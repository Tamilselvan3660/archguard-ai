/**
 * ARCHGUARD AI — Neon PostgreSQL Database Service
 * 
 * Provides serverless PostgreSQL connection pooling, schema initialization,
 * and persistence for ArchGuard scans, ADRs, fitness functions, and cloud governance.
 */

import pg from 'pg';
const { Pool } = pg;

let pool = null;
let isInitialized = false;

/**
 * Returns the active Neon PostgreSQL connection pool if configured.
 * @returns {pg.Pool|null}
 */
export function getDbPool() {
  if (pool) return pool;

  const connectionString = 
    process.env.DATABASE_URL || 
    process.env.NEON_DATABASE_URL || 
    process.env.POSTGRES_URL;

  if (!connectionString) {
    return null;
  }

  try {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    pool.on('error', (err) => {
      console.error('⚠️ [NEON POSTGRESQL] Pool error:', err.message);
    });

    return pool;
  } catch (err) {
    console.error('❌ [NEON POSTGRESQL] Connection initialization failed:', err.message);
    return null;
  }
}

/**
 * Checks if Neon PostgreSQL is configured and reachable.
 */
export async function isDbConnected() {
  const p = getDbPool();
  if (!p) return false;
  try {
    const client = await p.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (err) {
    console.warn('⚠️ [NEON POSTGRESQL] Connectivity check warning:', err.message);
    return false;
  }
}

/**
 * Initializes database tables automatically if Neon PostgreSQL is active.
 */
export async function initDatabase() {
  if (isInitialized) return true;
  const p = getDbPool();
  if (!p) {
    console.log('ℹ️  [DATABASE] No DATABASE_URL found. Running with local in-memory/JSON storage.');
    return false;
  }

  const schemaSql = `
    -- ArchGuard AI Neon PostgreSQL Schema

    -- 1. Scans & Architecture Graphs
    CREATE TABLE IF NOT EXISTS arch_scans (
      id VARCHAR(100) PRIMARY KEY,
      repository_name VARCHAR(255) NOT NULL,
      health_score JSONB,
      elements JSONB,
      dependencies JSONB,
      violations JSONB,
      scanned_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 2. Architecture Decision Records (ADRs)
    CREATE TABLE IF NOT EXISTS arch_adrs (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'ACCEPTED',
      decision TEXT NOT NULL,
      rationale TEXT,
      rule_id VARCHAR(50),
      violation_count INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. Architecture Fitness Functions
    CREATE TABLE IF NOT EXISTS arch_fitness_functions (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) NOT NULL,
      severity VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
      enabled BOOLEAN DEFAULT TRUE,
      spec JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 4. Cloud Storage Provider Connections
    CREATE TABLE IF NOT EXISTS arch_cloud_connections (
      id VARCHAR(100) PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL,
      provider VARCHAR(50) NOT NULL,
      access_token_encrypted TEXT,
      refresh_token_encrypted TEXT,
      account_email VARCHAR(255),
      status VARCHAR(50) DEFAULT 'connected',
      connected_at TIMESTAMPTZ DEFAULT NOW(),
      last_sync TIMESTAMPTZ,
      UNIQUE(user_id, provider)
    );

    -- 5. Cloud Audit Logs
    CREATE TABLE IF NOT EXISTS arch_cloud_audit_logs (
      id VARCHAR(100) PRIMARY KEY,
      user_id VARCHAR(100),
      action VARCHAR(100) NOT NULL,
      provider VARCHAR(50),
      file_name VARCHAR(255),
      details JSONB,
      ip_address VARCHAR(50),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_scans_repo ON arch_scans(repository_name);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON arch_cloud_audit_logs(created_at DESC);
  `;

  try {
    const client = await p.connect();
    await client.query(schemaSql);
    client.release();
    isInitialized = true;
    console.log('✅ [NEON POSTGRESQL] Database connected and schema synchronized successfully.');
    return true;
  } catch (err) {
    console.error('❌ [NEON POSTGRESQL] Failed to apply schema migrations:', err.message);
    return false;
  }
}

/**
 * Execute parameterized query on PostgreSQL pool.
 */
export async function dbQuery(text, params = []) {
  const p = getDbPool();
  if (!p) {
    throw new Error('Database pool not configured.');
  }
  return p.query(text, params);
}

export default {
  getDbPool,
  isDbConnected,
  initDatabase,
  dbQuery
};
