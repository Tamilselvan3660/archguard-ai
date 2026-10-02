/**
 * CloudAuditLog — Records cloud storage operations for compliance
 */
import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve('server/data/cloud_db/audit_logs.json');

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

export class CloudAuditLog {
  static log(entry) {
    const all = readAll();
    const record = {
      id: `clog_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      user_id: entry.user_id || 'system',
      provider: entry.provider || 'system',
      action: entry.action || 'UNKNOWN',
      resource_type: entry.resource_type || 'file',
      resource_id: entry.resource_id || null,
      resource_name: entry.resource_name || null,
      status: entry.status || 'SUCCESS',
      bytes_transferred: entry.bytes_transferred || 0,
      ip_address: entry.ip_address || null,
      metadata: entry.metadata || {}
    };
    all.push(record);
    // Keep last 1000 entries
    if (all.length > 1000) all.splice(0, all.length - 1000);
    writeAll(all);
    return record;
  }

  static findByUser(userId, limit = 50) {
    return readAll()
      .filter(l => l.user_id === userId)
      .slice(-limit)
      .reverse();
  }

  static getAll(limit = 200) {
    return readAll().slice(-limit).reverse();
  }
}
