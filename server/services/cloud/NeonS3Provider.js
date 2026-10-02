/**
 * NeonS3Provider — AWS S3-Compatible Storage Adapter for Neon Object Storage
 *
 * Implements the CloudStorageProvider contract using the AWS SDK v3 against
 * Neon's S3-compatible endpoint. Supports full file CRUD, folder emulation
 * (via key prefixes), presigned download URLs, and storage analytics.
 *
 * Configured via environment variables:
 *   AWS_ENDPOINT_URL_S3  — Neon S3 endpoint
 *   AWS_ACCESS_KEY_ID    — Neon access key
 *   AWS_SECRET_ACCESS_KEY — Neon secret key
 *   AWS_REGION           — Region (e.g. us-east-2)
 *   S3_BUCKET_NAME       — Bucket to use (default: archguard-cloud-vault)
 */

import { CloudStorageProvider } from './CloudStorageProvider.js';
import { CloudFile } from '../../models/CloudFile.js';
import { CloudConnection } from '../../models/CloudConnection.js';
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  ListBucketsCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const PROVIDER_NAME = 'neon_s3';

function buildS3Client() {
  return new S3Client({
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // required for S3-compatible endpoints
  });
}

function getBucket() {
  return process.env.S3_BUCKET_NAME || 'archguard-cloud-vault';
}

function s3KeyToFile(key, bucket, userId) {
  const parts = key.split('/');
  const name = parts[parts.length - 1] || parts[parts.length - 2];
  const isFolder = key.endsWith('/');
  const parentParts = parts.slice(0, isFolder ? -2 : -1);
  const parentKey = parentParts.length > 0 ? parentParts.join('/') + '/' : null;

  return {
    id: key,
    name: isFolder ? parts[parts.length - 2] : name,
    type: isFolder ? 'folder' : guessFileType(name),
    provider: PROVIDER_NAME,
    size: 0,
    mimeType: guessMimeType(name),
    parentId: parentKey,
    path: `/${key}`,
    createdAt: null,
    modifiedAt: null,
    downloadUrl: null,
    isFolder,
    s3Key: key,
    bucket
  };
}

function guessFileType(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'];
  const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'];
  const codeExts = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'go', 'rs', 'cpp', 'c', 'h', 'json', 'yaml', 'yml', 'toml', 'xml', 'html', 'css'];
  const archiveExts = ['zip', 'tar', 'gz', 'rar', '7z', 'bz2'];

  if (imgExts.includes(ext)) return 'image';
  if (docExts.includes(ext)) return 'document';
  if (codeExts.includes(ext)) return 'code';
  if (archiveExts.includes(ext)) return 'archive';
  return 'file';
}

function guessMimeType(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  const map = {
    pdf: 'application/pdf',
    json: 'application/json',
    js: 'application/javascript',
    ts: 'application/typescript',
    html: 'text/html',
    css: 'text/css',
    txt: 'text/plain',
    md: 'text/markdown',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    zip: 'application/zip',
    gz: 'application/gzip',
  };
  return map[ext] || 'application/octet-stream';
}

export class NeonS3Provider extends CloudStorageProvider {
  constructor() {
    super(PROVIDER_NAME, 'Neon S3 Storage', {
      upload: true,
      download: true,
      search: true,
      createFolder: true,
      shareLink: true,
      move: true,
      rename: true,
      delete: true,
      replication: true,
    });
    this._s3 = null;
  }

  get s3() {
    if (!this._s3) this._s3 = buildS3Client();
    return this._s3;
  }

  isConfigured() {
    return !!(
      process.env.AWS_ENDPOINT_URL_S3 &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
    );
  }

  async ensureBucket() {
    const bucket = getBucket();
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (err) {
      if (err.$metadata?.httpStatusCode === 404 || err.name === 'NoSuchBucket') {
        await this.s3.send(new CreateBucketCommand({ Bucket: bucket }));
        console.log(`[NeonS3] Created bucket: ${bucket}`);
      } else {
        throw err;
      }
    }
    return bucket;
  }

  async getAuthUrl(state) {
    if (!this.isConfigured()) {
      return {
        authUrl: null,
        state,
        isSandbox: false,
        error: 'Neon S3 credentials not configured in .env'
      };
    }
    // S3-compatible — no OAuth, credentials are static keys.
    return {
      authUrl: null,
      state,
      isSandbox: false,
      note: 'Neon S3 uses static API key credentials. Connect directly.',
      directConnect: true
    };
  }

  async authenticate(userId, { demoEmail } = {}) {
    if (!this.isConfigured()) {
      throw {
        provider: this.name,
        code: 'CONFIG_MISSING',
        message: 'AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY not set in environment.'
      };
    }

    // Validate credentials by listing buckets
    try {
      await this.s3.send(new ListBucketsCommand({}));
    } catch (err) {
      throw {
        provider: this.name,
        code: 'AUTH_FAILED',
        message: `Cannot connect to Neon S3: ${err.message}`
      };
    }

    await this.ensureBucket();

    const email = demoEmail || `neon-s3@${process.env.AWS_ENDPOINT_URL_S3?.split('/')[2] || 'neon.tech'}`;
    CloudConnection.upsert({
      user_id: userId,
      provider: this.name,
      provider_user_id: `neon_s3_${process.env.AWS_ACCESS_KEY_ID?.slice(-8)}`,
      account_email: email,
      access_token: process.env.AWS_ACCESS_KEY_ID,
      refresh_token: null,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      connection_status: 'connected',
      scopes: ['s3:*']
    });

    console.log(`[NeonS3] Connected for user ${userId} → bucket: ${getBucket()}`);
    return { accountEmail: email };
  }

  async getUserInfo(userId) {
    return {
      id: `neon_s3_${process.env.AWS_ACCESS_KEY_ID?.slice(-8)}`,
      email: `neon-s3@neon.tech`,
      name: 'Neon S3 Object Storage'
    };
  }

  async listFiles(userId, folderId = null) {
    const bucket = getBucket();
    const prefix = folderId ? (folderId.endsWith('/') ? folderId : `${folderId}/`) : '';

    let files = [];
    let continuationToken;

    do {
      const cmd = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        Delimiter: '/',
        MaxKeys: 200,
        ContinuationToken: continuationToken
      });
      const res = await this.s3.send(cmd);

      // Common prefixes = virtual folders
      for (const cp of res.CommonPrefixes || []) {
        files.push({
          id: cp.Prefix,
          name: cp.Prefix.replace(prefix, '').replace(/\/$/, ''),
          type: 'folder',
          provider: this.name,
          size: 0,
          mimeType: 'application/x-directory',
          parentId: prefix || null,
          path: `/${cp.Prefix}`,
          createdAt: null,
          modifiedAt: null,
          isFolder: true,
          s3Key: cp.Prefix,
          bucket
        });
      }

      // Contents = actual files (skip the prefix itself)
      for (const obj of res.Contents || []) {
        if (obj.Key === prefix) continue; // skip folder marker itself
        const name = obj.Key.replace(prefix, '');
        if (!name || name.includes('/')) continue; // skip deeply nested
        files.push({
          id: obj.Key,
          name,
          type: guessFileType(name),
          provider: this.name,
          size: obj.Size || 0,
          mimeType: guessMimeType(name),
          parentId: prefix || null,
          path: `/${obj.Key}`,
          createdAt: obj.LastModified?.toISOString() || null,
          modifiedAt: obj.LastModified?.toISOString() || null,
          isFolder: false,
          s3Key: obj.Key,
          bucket,
          etag: obj.ETag
        });
      }

      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);

    return files;
  }

  async uploadFile(userId, fileBuffer, { name, mimeType, parentId = null, size }) {
    const bucket = getBucket();
    const folder = parentId ? (parentId.endsWith('/') ? parentId : `${parentId}/`) : '';
    const key = `${folder}${name}`;

    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType || 'application/octet-stream',
        ContentLength: size || fileBuffer.length
      }
    });
    await upload.done();

    return {
      id: key,
      name,
      type: guessFileType(name),
      provider: this.name,
      size: size || fileBuffer.length,
      mimeType: mimeType || guessMimeType(name),
      parentId: parentId || null,
      path: `/${key}`,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      isFolder: false,
      s3Key: key,
      bucket
    };
  }

  async downloadFile(userId, fileId) {
    const bucket = getBucket();
    const key = fileId; // fileId IS the S3 key

    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const res = await this.s3.send(cmd);

    const chunks = [];
    for await (const chunk of res.Body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    const name = key.split('/').pop();

    return {
      stream: buffer,
      filename: name,
      mimeType: res.ContentType || guessMimeType(name),
      size: buffer.length
    };
  }

  async createFolder(userId, folderName, parentId = null) {
    const bucket = getBucket();
    const parentPrefix = parentId
      ? (parentId.endsWith('/') ? parentId : `${parentId}/`)
      : '';
    const key = `${parentPrefix}${folderName}/`;

    // S3 "folders" are zero-byte objects with a trailing slash
    await this.s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: '',
      ContentType: 'application/x-directory'
    }));

    return {
      id: key,
      name: folderName,
      type: 'folder',
      provider: this.name,
      size: 0,
      mimeType: 'application/x-directory',
      parentId: parentId || null,
      path: `/${key}`,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      isFolder: true,
      s3Key: key,
      bucket
    };
  }

  async deleteFile(userId, fileId) {
    const bucket = getBucket();
    await this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: fileId }));
    return { success: true, fileId };
  }

  async renameFile(userId, fileId, newName) {
    const bucket = getBucket();
    const parts = fileId.split('/');
    parts[parts.length - 1] = newName;
    const newKey = parts.join('/');

    // S3 rename = copy + delete
    await this.s3.send(new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${fileId}`,
      Key: newKey
    }));
    await this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: fileId }));

    return {
      id: newKey,
      name: newName,
      type: guessFileType(newName),
      provider: this.name,
      s3Key: newKey,
      bucket
    };
  }

  async moveFile(userId, fileId, newParentId) {
    const bucket = getBucket();
    const name = fileId.split('/').pop();
    const newPrefix = newParentId
      ? (newParentId.endsWith('/') ? newParentId : `${newParentId}/`)
      : '';
    const newKey = `${newPrefix}${name}`;

    await this.s3.send(new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${fileId}`,
      Key: newKey
    }));
    await this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: fileId }));

    return {
      id: newKey,
      name,
      type: guessFileType(name),
      provider: this.name,
      parentId: newParentId || null,
      s3Key: newKey,
      bucket
    };
  }

  async searchFiles(userId, query) {
    const all = await this.listFiles(userId, null);
    const q = query.toLowerCase();
    return all.filter(f => f.name.toLowerCase().includes(q));
  }

  async getStorageInfo(userId) {
    const bucket = getBucket();
    let totalSize = 0;
    let count = 0;
    let continuationToken;

    do {
      const res = await this.s3.send(new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 1000,
        ContinuationToken: continuationToken
      }));
      for (const obj of res.Contents || []) {
        totalSize += obj.Size || 0;
        count++;
      }
      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);

    const totalBytes = 100 * 1024 * 1024 * 1024; // Neon gives 100GB
    return {
      usedBytes: totalSize,
      totalBytes,
      availableBytes: totalBytes - totalSize,
      percentUsed: ((totalSize / totalBytes) * 100).toFixed(2),
      fileCount: count
    };
  }

  async createShareLink(userId, fileId) {
    const bucket = getBucket();
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: fileId });
    const url = await getSignedUrl(this.s3, cmd, { expiresIn: 3600 }); // 1 hour

    return {
      shareLink: url,
      permission: 'READ',
      expiresIn: '1 hour',
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
    };
  }

  async disconnect(userId) {
    CloudConnection.delete(userId, this.name);
    return { success: true };
  }
}
