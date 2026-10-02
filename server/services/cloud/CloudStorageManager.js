/**
 * CloudStorageManager — Central Multi-Cloud Coordinator & Orchestrator
 * 
 * Provides unified multi-cloud operations, multi-destination smart upload,
 * asynchronous replication pipelines, cross-cloud duplicate detection,
 * and aggregated storage analytics.
 */

import { GoogleDriveProvider } from './GoogleDriveProvider.js';
import { OneDriveProvider } from './OneDriveProvider.js';
import { MegaProvider } from './MegaProvider.js';
import { CloudConnection } from '../../models/CloudConnection.js';
import { CloudFile } from '../../models/CloudFile.js';
import { CloudAuditLog } from '../../models/CloudAuditLog.js';
import { FileReplication } from '../../models/FileReplication.js';
import crypto from 'crypto';

class CloudStorageManagerClass {
  constructor() {
    this.providers = new Map();

    // Register primary supported cloud storage adapters
    this.registerProvider(new GoogleDriveProvider());
    this.registerProvider(new OneDriveProvider());
    this.registerProvider(new MegaProvider());
  }

  /**
   * Register a provider adapter
   */
  registerProvider(providerInstance) {
    this.providers.set(providerInstance.name, providerInstance);
  }

  /**
   * Retrieve a specific provider by name
   */
  getProvider(providerName) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw {
        success: false,
        code: 'UNSUPPORTED_PROVIDER',
        message: `Provider '${providerName}' is not supported.`
      };
    }
    return provider;
  }

  /**
   * List all registered providers with connection status and capabilities
   */
  async listProviders(userId = 'default_user') {
    const userConns = CloudConnection.findByUser(userId);
    const connMap = new Map(userConns.map(c => [c.provider, c]));

    const result = [];
    for (const [name, provider] of this.providers.entries()) {
      const conn = connMap.get(name);
      let storage = null;

      if (conn && conn.connection_status === 'connected') {
        try {
          storage = await provider.getStorageInfo(userId);
        } catch (e) {
          console.warn(`Could not get storage for ${name}:`, e.message);
        }
      }

      result.push({
        id: name,
        name: provider.displayName,
        isConnected: conn ? conn.connection_status === 'connected' : false,
        connectionStatus: conn ? conn.connection_status : 'disconnected',
        accountEmail: conn ? conn.account_email : null,
        connectedAt: conn ? conn.created_at : null,
        capabilities: provider.getCapabilities(),
        storage: storage || {
          usedBytes: 0,
          totalBytes: name === 'google_drive' ? 15 * 1024 * 1024 * 1024 : name === 'mega' ? 20 * 1024 * 1024 * 1024 : 5 * 1024 * 1024 * 1024,
          availableBytes: 0,
          percentUsed: 0
        }
      });
    }

    return result;
  }

  /**
   * List files across all connected clouds or filtered by provider
   */
  async unifiedListFiles(userId = 'default_user', options = {}) {
    const { provider = 'all', folderId = null, sortBy = 'name', sortOrder = 'asc', type = 'all' } = options;

    if (provider !== 'all') {
      const p = this.getProvider(provider);
      return p.listFiles(userId, folderId);
    }

    // List all files from all registered providers
    const allFiles = CloudFile.find(userId, { parentId: folderId, type, sortBy, sortOrder });
    return allFiles;
  }

  /**
   * Unified search across all connected cloud providers
   */
  async unifiedSearch(userId = 'default_user', query = '') {
    return CloudFile.search(userId, query);
  }

  /**
   * Smart Multi-Cloud Upload
   * Supports uploading to single cloud, selected clouds, or "all"
   */
  async smartUpload(userId = 'default_user', { fileBuffer, filename, mimeType, targetProviders = ['google_drive'], parentId = null, ipAddress = '127.0.0.1' }) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('Upload payload is empty or invalid.');
    }

    // Resolve 'all' to all connected providers
    let targets = targetProviders;
    if (targets.includes('all')) {
      const conns = CloudConnection.findByUser(userId).filter(c => c.connection_status === 'connected');
      targets = conns.length > 0 ? conns.map(c => c.provider) : ['google_drive', 'mega', 'onedrive'];
    }

    // Deduplicate targets
    targets = [...new Set(targets)];

    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const results = [];
    const errors = [];

    // Upload to each provider independently
    for (const provName of targets) {
      try {
        const provider = this.getProvider(provName);
        const uploaded = await provider.uploadFile(userId, fileBuffer, {
          name: filename,
          mimeType,
          size: fileBuffer.length,
          parentId,
          sha256: hash
        });

        results.push({
          provider: provName,
          status: 'success',
          file: uploaded
        });

        CloudAuditLog.log({
          user_id: userId,
          provider: provName,
          action: 'UPLOAD',
          file_id: uploaded.id,
          file_name: filename,
          status: 'SUCCESS',
          ip_address: ipAddress,
          details: `Size: ${(fileBuffer.length / 1024).toFixed(1)} KB, SHA-256: ${hash.slice(0, 12)}...`
        });
      } catch (err) {
        console.error(`Upload error on ${provName}:`, err);
        errors.push({
          provider: provName,
          status: 'failed',
          error: err.message || 'Upload failed'
        });

        CloudAuditLog.log({
          user_id: userId,
          provider: provName,
          action: 'UPLOAD',
          file_name: filename,
          status: 'FAILED',
          ip_address: ipAddress,
          details: err.message
        });
      }
    }

    const allSuccessful = errors.length === 0 && results.length > 0;
    const partialSuccess = results.length > 0 && errors.length > 0;

    return {
      success: results.length > 0,
      allSuccessful,
      partialSuccess,
      hash,
      totalTargets: targets.length,
      successfulCount: results.length,
      failedCount: errors.length,
      results,
      errors
    };
  }

  /**
   * Replicate file from source cloud to one or more destination clouds
   */
  async replicateFile(userId = 'default_user', { sourceProvider, fileId, destinationProviders = [], ipAddress = '127.0.0.1' }) {
    const src = this.getProvider(sourceProvider);
    
    // 1. Download file stream/buffer from source
    const downloaded = await src.downloadFile(userId, fileId);
    let fileBuffer;
    if (Buffer.isBuffer(downloaded.stream)) {
      fileBuffer = downloaded.stream;
    } else {
      // Collect stream chunks
      const chunks = [];
      for await (const chunk of downloaded.stream) {
        chunks.push(chunk);
      }
      fileBuffer = Buffer.concat(chunks);
    }

    const results = [];
    for (const destName of destinationProviders) {
      if (destName === sourceProvider) continue; // Skip identical provider

      const task = FileReplication.create({
        user_id: userId,
        source_provider: sourceProvider,
        source_file_id: fileId,
        source_file_name: downloaded.filename,
        destination_provider: destName,
        status: 'uploading'
      });

      try {
        const destProvider = this.getProvider(destName);
        const uploaded = await destProvider.uploadFile(userId, fileBuffer, {
          name: downloaded.filename,
          mimeType: downloaded.mimeType,
          size: fileBuffer.length
        });

        FileReplication.updateStatus(task.id, 'completed', uploaded.id);
        results.push({ destination: destName, status: 'completed', file: uploaded });

        CloudAuditLog.log({
          user_id: userId,
          provider: destName,
          action: 'REPLICATE',
          file_id: uploaded.id,
          file_name: downloaded.filename,
          status: 'SUCCESS',
          ip_address: ipAddress,
          details: `Replicated from ${sourceProvider}`
        });
      } catch (err) {
        FileReplication.updateStatus(task.id, 'failed', null, err.message);
        results.push({ destination: destName, status: 'failed', error: err.message });

        CloudAuditLog.log({
          user_id: userId,
          provider: destName,
          action: 'REPLICATE',
          file_name: downloaded.filename,
          status: 'FAILED',
          ip_address: ipAddress,
          details: err.message
        });
      }
    }

    return {
      source: sourceProvider,
      fileName: downloaded.filename,
      results
    };
  }

  /**
   * Cross-Cloud Duplicate Detection (SHA-256)
   */
  async detectDuplicates(userId = 'default_user') {
    return CloudFile.detectDuplicates(userId);
  }

  /**
   * Aggregated Storage Analytics across all providers
   */
  async getStorageAnalytics(userId = 'default_user') {
    const providers = await this.listProviders(userId);
    const allFiles = CloudFile.find(userId, { type: 'file' });

    let totalUsedBytes = 0;
    let totalCapacityBytes = 0;
    const providerBreakdown = [];

    for (const p of providers) {
      totalUsedBytes += p.storage.usedBytes;
      totalCapacityBytes += p.storage.totalBytes;
      providerBreakdown.push({
        id: p.id,
        name: p.name,
        usedBytes: p.storage.usedBytes,
        totalBytes: p.storage.totalBytes,
        percent: p.storage.percentUsed,
        formattedUsed: `${(p.storage.usedBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`,
        formattedTotal: `${(p.storage.totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
      });
    }

    // Breakdown by file types
    const typeMap = {
      Archives: 0,
      Documents: 0,
      Images: 0,
      Code: 0,
      Other: 0
    };

    for (const f of allFiles) {
      const mime = f.mimeType.toLowerCase();
      const ext = f.name.split('.').pop().toLowerCase();
      if (mime.includes('zip') || mime.includes('tar') || mime.includes('gz') || ['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
        typeMap.Archives += f.size;
      } else if (mime.includes('pdf') || mime.includes('word') || mime.includes('document') || ['pdf', 'docx', 'doc', 'txt', 'csv'].includes(ext)) {
        typeMap.Documents += f.size;
      } else if (mime.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
        typeMap.Images += f.size;
      } else if (mime.includes('json') || mime.includes('text') || ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'sql', 'yaml', 'yml'].includes(ext)) {
        typeMap.Code += f.size;
      } else {
        typeMap.Other += f.size;
      }
    }

    // Top 5 Largest Files
    const largestFiles = [...allFiles]
      .sort((a, b) => b.size - a.size)
      .slice(0, 5)
      .map(f => ({
        id: f.id,
        name: f.name,
        size: f.size,
        formattedSize: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        provider: f.provider,
        modifiedAt: f.modifiedAt
      }));

    return {
      summary: {
        totalUsedBytes,
        totalCapacityBytes,
        totalAvailableBytes: Math.max(0, totalCapacityBytes - totalUsedBytes),
        overallPercent: Math.round((totalUsedBytes / (totalCapacityBytes || 1)) * 100),
        formattedUsed: `${(totalUsedBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`,
        formattedTotal: `${(totalCapacityBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`,
        totalFilesCount: allFiles.length
      },
      providers: providerBreakdown,
      fileTypes: Object.entries(typeMap).map(([type, bytes]) => ({
        type,
        bytes,
        formatted: `${(bytes / (1024 * 1024)).toFixed(1)} MB`,
        percent: totalUsedBytes ? Math.round((bytes / totalUsedBytes) * 100) : 0
      })),
      largestFiles
    };
  }
}

export const CloudStorageManager = new CloudStorageManagerClass();
