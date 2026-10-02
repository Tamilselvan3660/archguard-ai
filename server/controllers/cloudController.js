/**
 * CloudController — Express REST API Controller for Multi-Cloud Storage
 * 
 * Handles request validation, security headers, standardized error formatting,
 * and delegates all provider operations to CloudStorageManager.
 */

import { CloudStorageManager } from '../services/cloud/CloudStorageManager.js';
import { cloudConfig } from '../config/cloud.js';

// Standardized error responder (Section 15)
function sendError(res, err, defaultCode = 'INTERNAL_ERROR', defaultStatus = 500) {
  const code = err.code || defaultCode;
  const message = err.message || 'An unexpected cloud storage error occurred.';
  const provider = err.provider || 'system';
  const status = err.status || defaultStatus;

  // Never expose stack traces or raw tokens to client
  return res.status(status).json({
    success: false,
    provider,
    code,
    message
  });
}

export const cloudController = {
  /**
   * GET /api/cloud/providers
   * Returns list of providers, connection states, and capabilities
   */
  async listProviders(req, res) {
    try {
      const userId = req.headers['x-user-id'] || 'default_user';
      const providers = await CloudStorageManager.listProviders(userId);
      res.json({
        success: true,
        providers
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * GET /api/cloud/connect/:provider
   * Generates OAuth 2.0 URL or connection initiation
   */
  async getConnectUrl(req, res) {
    try {
      const { provider } = req.params;
      const state = `arch_${provider}_${Date.now()}`;
      const prov = CloudStorageManager.getProvider(provider);
      const authInfo = await prov.getAuthUrl(state);
      res.json({
        success: true,
        provider,
        authUrl: authInfo.authUrl,
        state: authInfo.state,
        isSandbox: authInfo.isSandbox || false,
        note: authInfo.note || null
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * POST /api/cloud/callback/:provider
   * Handles OAuth authorization code exchange
   */
  async handleCallback(req, res) {
    try {
      const { provider } = req.params;
      const userId = req.headers['x-user-id'] || 'default_user';
      const { code, state, email, password } = req.body;

      const prov = CloudStorageManager.getProvider(provider);
      const result = await prov.authenticate(userId, { code, email, password });

      CloudAuditLog.log({
        user_id: userId,
        provider,
        action: 'CONNECT',
        status: 'SUCCESS',
        ip_address: req.ip || '127.0.0.1',
        details: `Account ${result.accountEmail} connected`
      });

      res.json({
        success: true,
        provider,
        accountEmail: result.accountEmail,
        message: `${prov.displayName} connected successfully.`
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * POST /api/cloud/demo-connect/:provider
   * 1-Click Sandbox / Demo connection for instant testing
   */
  async demoConnect(req, res) {
    try {
      const { provider } = req.params;
      const userId = req.headers['x-user-id'] || 'default_user';
      const { email } = req.body || {};

      const prov = CloudStorageManager.getProvider(provider);
      const result = await prov.authenticate(userId, {
        code: `demo_${provider}_code`,
        demoEmail: email || `architect.${provider}@enterprise.io`
      });

      CloudAuditLog.log({
        user_id: userId,
        provider,
        action: 'CONNECT',
        status: 'SUCCESS',
        ip_address: req.ip || '127.0.0.1',
        details: `Connected in Sandbox / Demo mode for ${result.accountEmail}`
      });

      if (req.method === 'GET') {
        const frontendUrl = cloudConfig.frontendUrl || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/?cloud_callback=${provider}&status=connected`);
      }

      res.json({
        success: true,
        provider,
        accountEmail: result.accountEmail,
        message: `Connected to ${prov.displayName} in Sandbox mode`
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * POST /api/cloud/disconnect/:provider
   * Disconnects account and removes encrypted tokens
   */
  async disconnect(req, res) {
    try {
      const { provider } = req.params;
      const userId = req.headers['x-user-id'] || 'default_user';

      const prov = CloudStorageManager.getProvider(provider);
      await prov.disconnect(userId);

      CloudAuditLog.log({
        user_id: userId,
        provider,
        action: 'DISCONNECT',
        status: 'SUCCESS',
        ip_address: req.ip || '127.0.0.1',
        details: `User disconnected ${prov.displayName}`
      });

      res.json({
        success: true,
        provider,
        message: `${prov.displayName} disconnected.`
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * GET /api/cloud/:provider/files
   * List files for a specific provider
   */
  async listFiles(req, res) {
    try {
      const { provider } = req.params;
      const userId = req.headers['x-user-id'] || 'default_user';
      const { folderId } = req.query;

      const prov = CloudStorageManager.getProvider(provider);
      const files = await prov.listFiles(userId, folderId || null);

      res.json({
        success: true,
        provider,
        folderId: folderId || null,
        files
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * POST /api/cloud/:provider/upload
   * Single provider file upload
   */
  async uploadFile(req, res) {
    try {
      const { provider } = req.params;
      const userId = req.headers['x-user-id'] || 'default_user';
      const { parentId } = req.body;

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }

      const prov = CloudStorageManager.getProvider(provider);
      const file = await prov.uploadFile(userId, req.file.buffer, {
        name: req.file.originalname,
        mimeType: req.file.mimetype,
        parentId: parentId || null
      });

      CloudAuditLog.log({
        user_id: userId,
        provider,
        action: 'UPLOAD',
        file_id: file.id,
        file_name: file.name,
        status: 'SUCCESS',
        ip_address: req.ip || '127.0.0.1',
        details: `Uploaded ${file.name} to ${prov.displayName}`
      });

      res.json({
        success: true,
        provider,
        file
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * GET /api/cloud/:provider/download/:fileId
   * Streams download content
   */
  async downloadFile(req, res) {
    try {
      const { provider, fileId } = req.params;
      const userId = req.user?.id || req.headers['x-user-id'] || 'default_user';

      const file = CloudFile.getById(fileId);
      if (file && req.user) {
        const check = PolicyEngine.canAccessResource(req.user, 'file', file, 'download');
        if (!check.allowed) {
          return res.status(403).json({
            success: false,
            code: 'RESOURCE_ACCESS_DENIED',
            message: check.reason,
            requiresAuthorization: check.requiresAuthorization || false,
            fileId,
            fileName: file.name
          });
        }
      }

      const prov = CloudStorageManager.getProvider(provider);
      const downloaded = await prov.downloadFile(userId, fileId);

      CloudAuditLog.log({
        user_id: userId,
        provider,
        action: 'DOWNLOAD',
        file_id: fileId,
        file_name: downloaded.filename,
        status: 'SUCCESS',
        ip_address: req.ip || '127.0.0.1'
      });

      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloaded.filename)}"`);
      res.setHeader('Content-Type', downloaded.mimeType || 'application/octet-stream');
      if (downloaded.size) res.setHeader('Content-Length', downloaded.size);

      if (Buffer.isBuffer(downloaded.stream)) {
        return res.send(downloaded.stream);
      }
      return downloaded.stream.pipe(res);
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * POST /api/cloud/:provider/folder
   * Create folder
   */
  async createFolder(req, res) {
    try {
      const { provider } = req.params;
      const userId = req.user?.id || req.headers['x-user-id'] || 'default_user';
      const { name, parentId } = req.body;

      if (!name) return res.status(400).json({ success: false, message: 'Folder name is required.' });

      const prov = CloudStorageManager.getProvider(provider);
      const folder = await prov.createFolder(userId, name, parentId || null);

      CloudAuditLog.log({
        user_id: userId,
        provider,
        action: 'CREATE_FOLDER',
        file_id: folder.id,
        file_name: folder.name,
        status: 'SUCCESS',
        ip_address: req.ip || '127.0.0.1'
      });

      res.json({
        success: true,
        provider,
        folder
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * DELETE /api/cloud/:provider/files/:fileId
   */
  async deleteFile(req, res) {
    try {
      const { provider, fileId } = req.params;
      const userId = req.user?.id || req.headers['x-user-id'] || 'default_user';

      const file = CloudFile.getById(fileId);
      if (file && req.user) {
        const check = PolicyEngine.canAccessResource(req.user, 'file', file, 'delete');
        if (!check.allowed) {
          return res.status(403).json({
            success: false,
            code: 'RESOURCE_ACCESS_DENIED',
            message: check.reason
          });
        }
      }

      const prov = CloudStorageManager.getProvider(provider);
      const result = await prov.deleteFile(userId, fileId);

      CloudAuditLog.log({
        user_id: userId,
        provider,
        action: 'DELETE',
        file_id: fileId,
        status: 'SUCCESS',
        ip_address: req.ip || '127.0.0.1'
      });

      res.json({
        success: true,
        provider,
        result
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * PATCH /api/cloud/:provider/files/:fileId/rename
   */
  async renameFile(req, res) {
    try {
      const { provider, fileId } = req.params;
      const { newName } = req.body;
      const userId = req.headers['x-user-id'] || 'default_user';

      if (!newName) return res.status(400).json({ success: false, message: 'New name is required.' });

      const prov = CloudStorageManager.getProvider(provider);
      const updated = await prov.renameFile(userId, fileId, newName);

      CloudAuditLog.log({
        user_id: userId,
        provider,
        action: 'RENAME',
        file_id: fileId,
        file_name: newName,
        status: 'SUCCESS',
        ip_address: req.ip || '127.0.0.1'
      });

      res.json({
        success: true,
        provider,
        file: updated
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * PATCH /api/cloud/:provider/files/:fileId/move
   */
  async moveFile(req, res) {
    try {
      const { provider, fileId } = req.params;
      const { newParentId } = req.body;
      const userId = req.headers['x-user-id'] || 'default_user';

      const prov = CloudStorageManager.getProvider(provider);
      const updated = await prov.moveFile(userId, fileId, newParentId || null);

      CloudAuditLog.log({
        user_id: userId,
        provider,
        action: 'MOVE',
        file_id: fileId,
        status: 'SUCCESS',
        ip_address: req.ip || '127.0.0.1',
        details: `Moved to folder ${newParentId || 'root'}`
      });

      res.json({
        success: true,
        provider,
        file: updated
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * POST /api/cloud/:provider/share/:fileId
   */
  async createShareLink(req, res) {
    try {
      const { provider, fileId } = req.params;
      const userId = req.headers['x-user-id'] || 'default_user';

      const prov = CloudStorageManager.getProvider(provider);
      const linkInfo = await prov.createShareLink(userId, fileId);

      CloudAuditLog.log({
        user_id: userId,
        provider,
        action: 'SHARE',
        file_id: fileId,
        status: 'SUCCESS',
        ip_address: req.ip || '127.0.0.1',
        details: `Generated share link`
      });

      res.json({
        success: true,
        provider,
        shareLink: linkInfo.shareLink,
        permission: linkInfo.permission
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * GET /api/cloud/:provider/storage
   */
  async getStorage(req, res) {
    try {
      const { provider } = req.params;
      const userId = req.headers['x-user-id'] || 'default_user';

      const prov = CloudStorageManager.getProvider(provider);
      const storage = await prov.getStorageInfo(userId);

      res.json({
        success: true,
        storage
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * GET /api/cloud/:provider/search
   */
  async searchFiles(req, res) {
    try {
      const { provider } = req.params;
      const { q } = req.query;
      const userId = req.headers['x-user-id'] || 'default_user';

      const prov = CloudStorageManager.getProvider(provider);
      const results = await prov.searchFiles(userId, q || '');

      res.json({
        success: true,
        provider,
        query: q || '',
        count: results.length,
        results
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  // =========================================================================
  // MULTI-CLOUD UNIFIED ENDPOINTS
  // =========================================================================

  /**
   * GET /api/cloud/unified/files
   */
  async unifiedList(req, res) {
    try {
      const userId = req.headers['x-user-id'] || 'default_user';
      const files = await CloudStorageManager.unifiedListFiles(userId, req.query);
      res.json({
        success: true,
        count: files.length,
        files
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * GET /api/cloud/unified/search?q=...
   */
  async unifiedSearch(req, res) {
    try {
      const userId = req.headers['x-user-id'] || 'default_user';
      const { q } = req.query;
      const results = await CloudStorageManager.unifiedSearch(userId, q);
      res.json({
        success: true,
        query: q || '',
        count: results.length,
        results
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * POST /api/cloud/unified/multi-upload
   * Uploads file to multiple clouds simultaneously
   */
  async multiUpload(req, res) {
    try {
      const userId = req.headers['x-user-id'] || 'default_user';
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file provided.' });
      }

      let targets = ['google_drive'];
      if (req.body.targetProviders) {
        try {
          targets = typeof req.body.targetProviders === 'string'
            ? JSON.parse(req.body.targetProviders)
            : req.body.targetProviders;
        } catch (e) {
          targets = [req.body.targetProviders];
        }
      }

      const result = await CloudStorageManager.smartUpload(userId, {
        fileBuffer: req.file.buffer,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        targetProviders: targets,
        parentId: req.body.parentId || null,
        ipAddress: req.ip || '127.0.0.1'
      });

      res.json(result);
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * POST /api/cloud/unified/replicate
   * Replicates file from one cloud to others
   */
  async replicateFile(req, res) {
    try {
      const userId = req.headers['x-user-id'] || 'default_user';
      const { sourceProvider, fileId, destinationProviders } = req.body;

      if (!sourceProvider || !fileId || !destinationProviders?.length) {
        return res.status(400).json({
          success: false,
          message: 'sourceProvider, fileId, and destinationProviders are required.'
        });
      }

      const result = await CloudStorageManager.replicateFile(userId, {
        sourceProvider,
        fileId,
        destinationProviders,
        ipAddress: req.ip || '127.0.0.1'
      });

      res.json({
        success: true,
        message: `Replication initiated for ${result.fileName}`,
        ...result
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * GET /api/cloud/unified/replications
   */
  async listReplications(req, res) {
    try {
      const userId = req.headers['x-user-id'] || 'default_user';
      const replications = FileReplication.findByUser(userId);
      res.json({
        success: true,
        replications
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * GET /api/cloud/unified/duplicates
   */
  async detectDuplicates(req, res) {
    try {
      const userId = req.headers['x-user-id'] || 'default_user';
      const duplicates = await CloudStorageManager.detectDuplicates(userId);
      res.json({
        success: true,
        count: duplicates.length,
        duplicates
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * GET /api/cloud/unified/analytics
   */
  async getAnalytics(req, res) {
    try {
      const userId = req.headers['x-user-id'] || 'default_user';
      const analytics = await CloudStorageManager.getStorageAnalytics(userId);
      res.json({
        success: true,
        analytics
      });
    } catch (err) {
      sendError(res, err);
    }
  },

  /**
   * GET /api/cloud/unified/audit-logs
   */
  async getAuditLogs(req, res) {
    try {
      const userId = req.headers['x-user-id'] || 'default_user';
      const logs = CloudAuditLog.find(userId, req.query);
      res.json({
        success: true,
        logs
      });
    } catch (err) {
      sendError(res, err);
    }
  }
};
