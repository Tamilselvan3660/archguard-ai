/**
 * CloudFile — Tracks cloud file/folder metadata across providers
 */
import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve('server/data/cloud_db/files.json');

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

export class CloudFile {
  /**
   * Find files for a user, optionally filtered
   */
  static find(userId, filters = {}) {
    let records = readAll().filter(f => f.user_id === userId);
    if (filters.provider) records = records.filter(f => f.provider === filters.provider);
    if (filters.type) records = records.filter(f => f.type === filters.type);
    if (filters.parentId !== undefined) records = records.filter(f => f.parentId === filters.parentId);
    return records;
  }

  /**
   * Upsert a file record
   */
  static upsert(fileData) {
    const all = readAll();
    const idx = all.findIndex(f => f.id === fileData.id && f.user_id === fileData.user_id);
    const record = {
      ...fileData,
      updatedAt: new Date().toISOString()
    };
    if (!record.createdAt) record.createdAt = new Date().toISOString();
    if (idx >= 0) all[idx] = record;
    else all.push(record);
    writeAll(all);
    return record;
  }

  /**
   * Delete a file record
   */
  static delete(userId, provider, fileId) {
    const all = readAll().filter(f => !(f.id === fileId && f.user_id === userId && f.provider === provider));
    writeAll(all);
  }

  /**
   * Sync provider files — removes old entries and adds/updates new ones
   */
  static syncProviderFiles(userId, provider, files) {
    const all = readAll().filter(f => !(f.user_id === userId && f.provider === provider));
    const now = new Date().toISOString();
    for (const f of files) {
      all.push({ ...f, user_id: userId, provider, createdAt: f.createdAt || now, updatedAt: now });
    }
    writeAll(all);
  }

  /**
   * Get storage statistics per provider for a user
   */
  static getStorageStats(userId) {
    const files = readAll().filter(f => f.user_id === userId && f.type === 'file');
    const byProvider = {};
    for (const f of files) {
      if (!byProvider[f.provider]) byProvider[f.provider] = { count: 0, totalSize: 0 };
      byProvider[f.provider].count++;
      byProvider[f.provider].totalSize += f.size || 0;
    }
    return byProvider;
  }
}
