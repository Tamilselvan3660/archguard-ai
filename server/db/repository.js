/**
 * ARCHGUARD AI — Unified Data Access Repository
 * 
 * Provides unified data access layer supporting:
 * 1. Neon PostgreSQL (Production persistence on cloud)
 * 2. In-Memory / File Storage (Graceful local development fallback)
 */

import { getDbPool, dbQuery } from './neon.js';

export class ArchRepository {
  /**
   * Retrieves all ADRs from Neon PostgreSQL or fallback.
   */
  static async getAdrs(fallbackAdrs = []) {
    const pool = getDbPool();
    if (!pool) return fallbackAdrs;

    try {
      const res = await dbQuery('SELECT * FROM arch_adrs ORDER BY id ASC');
      if (res.rows.length === 0 && fallbackAdrs.length > 0) {
        // Seed default ADRs if empty
        for (const adr of fallbackAdrs) {
          await this.saveAdr(adr);
        }
        return fallbackAdrs;
      }
      return res.rows.map(r => ({
        id: r.id,
        title: r.title,
        status: r.status,
        decision: r.decision,
        rationale: r.rationale,
        ruleId: r.rule_id,
        violationCount: r.violation_count
      }));
    } catch (err) {
      console.warn('⚠️ [DB REPO] Error reading ADRs from PostgreSQL, using fallback:', err.message);
      return fallbackAdrs;
    }
  }

  /**
   * Saves or updates an ADR in Neon PostgreSQL.
   */
  static async saveAdr(adr) {
    const pool = getDbPool();
    if (!pool) return adr;

    try {
      await dbQuery(`
        INSERT INTO arch_adrs (id, title, status, decision, rationale, rule_id, violation_count, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          status = EXCLUDED.status,
          decision = EXCLUDED.decision,
          rationale = EXCLUDED.rationale,
          rule_id = EXCLUDED.rule_id,
          violation_count = EXCLUDED.violation_count,
          updated_at = NOW()
      `, [
        adr.id,
        adr.title,
        adr.status || 'ACCEPTED',
        adr.decision || '',
        adr.rationale || '',
        adr.ruleId || null,
        adr.violationCount || 0
      ]);
      return adr;
    } catch (err) {
      console.warn('⚠️ [DB REPO] Error saving ADR to PostgreSQL:', err.message);
      return adr;
    }
  }

  /**
   * Saves an architecture scan to Neon PostgreSQL.
   */
  static async saveScan(scan) {
    const pool = getDbPool();
    if (!pool) return;

    try {
      const scanId = `scan-${Date.now()}`;
      await dbQuery(`
        INSERT INTO arch_scans (id, repository_name, health_score, elements, dependencies, violations)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        scanId,
        scan.repository || 'default',
        JSON.stringify(scan.healthScore || {}),
        JSON.stringify(scan.elements || []),
        JSON.stringify(scan.dependencies || []),
        JSON.stringify(scan.violations || [])
      ]);
    } catch (err) {
      console.warn('⚠️ [DB REPO] Error saving scan to PostgreSQL:', err.message);
    }
  }

  /**
   * Retrieves the latest repository scan from Neon PostgreSQL.
   */
  static async getLatestScan() {
    const pool = getDbPool();
    if (!pool) return null;

    try {
      const res = await dbQuery('SELECT * FROM arch_scans ORDER BY scanned_at DESC LIMIT 1');
      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      return {
        repository: row.repository_name,
        healthScore: row.health_score,
        elements: row.elements,
        dependencies: row.dependencies,
        violations: row.violations,
        scannedAt: row.scanned_at
      };
    } catch (err) {
      console.warn('⚠️ [DB REPO] Error loading scan from PostgreSQL:', err.message);
      return null;
    }
  }
}
