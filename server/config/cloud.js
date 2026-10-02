/**
 * ARCHGUARD AI — Multi-Cloud Storage Configuration & Security Layer
 * 
 * Provides centralized environment configuration and AES-256-GCM cryptographic
 * primitives for token and credential encryption at rest.
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load .env if present
dotenv?.config?.();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Derive a resilient 32-byte key from environment or fallback secure seed
const RAW_KEY = process.env.TOKEN_ENCRYPTION_KEY || 'archguard-cloud-vault-master-sec-key-2026-production';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(RAW_KEY).digest();

/**
 * Encrypt a sensitive token or credential string with AES-256-GCM
 * @param {string} plainText 
 * @returns {string} base64 encoded ciphertext with iv and authTag
 */
export function encryptToken(plainText) {
  if (!plainText) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(String(plainText), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a ciphertext string with AES-256-GCM
 * @param {string} cipherText 
 * @returns {string|null} original plain text
 */
export function decryptToken(cipherText) {
  if (!cipherText) return null;
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return null;

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Cryptographic decryption failure:', err.message);
    return null;
  }
}

/**
 * Cloud Storage Environment Configuration
 */
export const cloudConfig = {
  appUrl: process.env.APP_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/cloud/callback/google_drive',
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]
  },

  onedrive: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
    redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/cloud/callback/onedrive',
    scopes: [
      'offline_access',
      'User.Read',
      'Files.ReadWrite.All'
    ]
  },

  mega: {
    configuration: process.env.MEGA_CONFIGURATION || '',
    defaultStorageBytes: 20 * 1024 * 1024 * 1024 // 20 GB free tier
  },

  security: {
    maxUploadSizeBytes: 100 * 1024 * 1024, // 100 MB per file limit
    allowedMimeTypes: [
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'application/json',
      'text/plain',
      'text/markdown',
      'text/csv',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  }
};
