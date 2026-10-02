/**
 * FileReplication — Tracks cross-cloud replication jobs
 */
import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve('server/data/cloud_db/replications.json');

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

export class FileReplication {
  static create(data) {
    const all = readAll();
    const record = {
      id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      user_id: data.user_id,
      source_provider: data.source_provider,
      source_file_id: data.source_file_id,
      target_provider: data.target_provider,
      target_file_id: data.target_file_id || null,
      file_name: data.file_name || null,
      file_size: data.file_size || 0,
      status: data.status || 'PENDING',
      started_at: new Date().toISOString(),
      completed_at: null,
      error: null
    };
    all.push(record);
    writeAll(all);
    return record;
  }

  static updateStatus(id, status, extra = {}) {
    const all = readAll();
    const idx = all.findIndex(r => r.id === id);
    if (idx >= 0) {
      all[idx].status = status;
      if (extra.target_file_id) all[idx].target_file_id = extra.target_file_id;
      if (extra.error) all[idx].error = extra.error;
      if (status === 'COMPLETED' || status === 'FAILED') {
        all[idx].completed_at = new Date().toISOString();
      }
      writeAll(all);
    }
  }

  static findByUser(userId) {
    return readAll().filter(r => r.user_id === userId);
  }

  static findPending() {
    return readAll().filter(r => r.status === 'PENDING');
  }
}
