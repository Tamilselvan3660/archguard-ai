/**
 * CloudConnection — Manages user cloud provider OAuth connections
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.resolve('server/data/cloud_db/connections.json');

const ENCRYPTION_KEY = process.env.CLOUD_ENCRYPTION_KEY || 'archguard_cloud_secret_key_32_cha';
const KEY = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(text)), cipher.final()]);
  return `${iv.toString('hex')}:${crypto.randomBytes(16).toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(encryptedStr) {
  if (!encryptedStr) return null;
  try {
    const parts = encryptedStr.split(':');
    if (parts.length < 3) return encryptedStr;
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
  } catch {
    return encryptedStr;
  }
}

function readAll() {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch { return []; }
}

function writeAll(data) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export class CloudConnection {
  static findByUser(userId) {
    return readAll().filter(c => c.user_id === userId);
  }

  static findOne(userId, provider) {
    return readAll().find(c => c.user_id === userId && c.provider === provider) || null;
  }

  static getDecryptedTokens(userId, provider) {
    const conn = this.findOne(userId, provider);
    if (!conn) return null;
    return {
      accessToken: decrypt(conn.access_token_encrypted),
      refreshToken: decrypt(conn.refresh_token_encrypted),
      expiresAt: conn.token_expires_at,
      accountEmail: conn.account_email,
      providerUserId: conn.provider_user_id
    };
  }

  static upsert(data) {
    const all = readAll();
    const idx = all.findIndex(c => c.user_id === data.user_id && c.provider === data.provider);
    const record = {
      id: data.id || `conn_${data.provider}_${Date.now()}`,
      user_id: data.user_id,
      provider: data.provider,
      provider_user_id: data.provider_user_id || null,
      account_email: data.account_email || null,
      access_token_encrypted: data.accessToken ? encrypt(data.accessToken) : (all[idx]?.access_token_encrypted || null),
      refresh_token_encrypted: data.refreshToken ? encrypt(data.refreshToken) : (all[idx]?.refresh_token_encrypted || null),
      token_expires_at: data.expiresAt || null,
      connection_status: data.connection_status || 'connected',
      scopes: data.scopes || [],
      created_at: all[idx]?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (idx >= 0) all[idx] = record;
    else all.push(record);
    writeAll(all);
    return record;
  }

  static updateTokens(userId, provider, tokens) {
    const all = readAll();
    const idx = all.findIndex(c => c.user_id === userId && c.provider === provider);
    if (idx < 0) return;
    if (tokens.accessToken) all[idx].access_token_encrypted = encrypt(tokens.accessToken);
    if (tokens.refreshToken) all[idx].refresh_token_encrypted = encrypt(tokens.refreshToken);
    if (tokens.expiresAt) all[idx].token_expires_at = tokens.expiresAt;
    all[idx].updated_at = new Date().toISOString();
    writeAll(all);
  }

  static markReauthRequired(userId, provider) {
    const all = readAll();
    const idx = all.findIndex(c => c.user_id === userId && c.provider === provider);
    if (idx >= 0) {
      all[idx].connection_status = 'reauth_required';
      all[idx].updated_at = new Date().toISOString();
      writeAll(all);
    }
  }

  static delete(userId, provider) {
    const all = readAll().filter(c => !(c.user_id === userId && c.provider === provider));
    writeAll(all);
  }
}
