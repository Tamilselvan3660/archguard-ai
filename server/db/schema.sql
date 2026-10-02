-- ==============================================================================
-- ARCHGUARD AI — NEON POSTGRESQL PRODUCTION DATABASE SCHEMA
-- ==============================================================================

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

-- Indexes for query acceleration
CREATE INDEX IF NOT EXISTS idx_scans_repo ON arch_scans(repository_name);
CREATE INDEX IF NOT EXISTS idx_audit_created ON arch_cloud_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cloud_conn_user ON arch_cloud_connections(user_id);

-- 6. Users (Enterprise Authentication)
CREATE TABLE IF NOT EXISTS arch_users (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  account_status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
  role VARCHAR(100) DEFAULT 'Staff Architect',
  avatar VARCHAR(10),
  color VARCHAR(20),
  roles JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  auth_provider VARCHAR(50) DEFAULT 'Email OTP'
);

-- 7. OTPs (One-Time Passwords)
CREATE TABLE IF NOT EXISTS arch_otps (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) REFERENCES arch_users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  otp_hash TEXT NOT NULL,
  purpose VARCHAR(50) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 5,
  verified_at TIMESTAMPTZ,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Security Audit Logs
CREATE TABLE IF NOT EXISTS arch_security_events (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100),
  event_type VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  ip_address VARCHAR(50),
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Additional Security Indexes
CREATE INDEX IF NOT EXISTS idx_otps_email_purpose ON arch_otps(email, purpose);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON arch_security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON arch_security_events(event_type);
