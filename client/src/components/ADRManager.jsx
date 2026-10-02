import React, { useState, useEffect } from 'react';

export default function ADRManager({ onShowToast }) {
  const [adrs, setAdrs] = useState([]);
  const [title, setTitle] = useState('');
  const [decision, setDecision] = useState('');
  const [rationale, setRationale] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cloudStatus, setCloudStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchADRs();
    fetchCloudStatus();
  }, []);

  const fetchCloudStatus = async () => {
    try {
      const res = await fetch('/api/cloud/status');
      if (res.ok) {
        const data = await res.json();
        setCloudStatus(data);
      }
    } catch (e) {
      console.error('Cloud status check failed', e);
    }
  };

  const handleCloudSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/cloud/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCloudStatus(data.status);
        if (onShowToast) onShowToast(`☁️ Cloud Storage: ${data.message}`);
      }
    } catch (e) {
      console.error(e);
      if (onShowToast) onShowToast('❌ Cloud sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchADRs = async () => {
    try {
      const res = await fetch('/api/adrs');
      const data = await res.json();
      setAdrs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateADR = async (e) => {
    e.preventDefault();
    if (!title || !decision) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/adrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, decision, rationale })
      });
      const created = await res.json();
      setTitle('');
      setDecision('');
      setRationale('');
      fetchADRs();
      if (onShowToast) onShowToast(`Created ${created.id}: ${created.title}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportMarkdown = () => {
    const md = adrs.map(a => `# ${a.id} — ${a.title}
Status: ${a.status}
Rule ID: ${a.ruleId}

## Context and Problem Statement
${a.rationale || 'N/A'}

## Decision Outcome
${a.decision}
`).join('\n---\n\n');

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ARCHITECTURE_DECISIONS.md';
    a.click();
    if (onShowToast) onShowToast('Exported ARCHITECTURE_DECISIONS.md');
  };

  const filteredAdrs = statusFilter === 'ALL' 
    ? adrs 
    : adrs.filter(a => (statusFilter === 'VIOLATED' ? a.violationCount > 0 : a.violationCount === 0));

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Architecture Decision Records (ADR)</h1>
          <div className="page-subtitle">
            Formal architectural decision log binding executive governance choices to automated AST validation rules.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-secondary" 
            onClick={handleCloudSync}
            disabled={isSyncing}
            title="Sync ADRs directly to Google Cloud Storage Vault"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>{isSyncing ? '⏳' : '☁️'}</span>
            <span>{isSyncing ? 'Syncing...' : 'Cloud Storage Sync'}</span>
          </button>
          <button className="btn-secondary" onClick={handleExportMarkdown}>
            📥 Export MADR (.md)
          </button>
        </div>
      </div>

      {/* Cloud Storage Safe-Vault Protection Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 18px',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.4rem' }}>☁️</span>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Google Cloud Storage (GCS) Safe-Vault Protection</span>
              <span className="violation-badge badge-high" style={{ fontSize: '0.64rem', padding: '1px 7px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                KMS Encrypted &bull; User Safe
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
              Bucket: <code>gs://{cloudStatus?.bucketName || 'archguard-enterprise-vault'}/adrs</code> &bull; {cloudStatus?.statusMessage || 'Protected Safe-Vault Active'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <div>
            Last Cloud Snapshot: <strong style={{ color: 'var(--text-primary)' }}>{cloudStatus?.lastSync ? new Date(cloudStatus.lastSync).toLocaleTimeString() : 'Just now'}</strong>
          </div>
          <button 
            className="btn-secondary"
            style={{ fontSize: '0.74rem', padding: '4px 10px', background: 'var(--bg-surface)' }}
            onClick={handleCloudSync}
            disabled={isSyncing}
          >
            {isSyncing ? 'Syncing...' : 'Sync Vault'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* ADR List */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>📜</span>
              <span>Active Governance Records ({filteredAdrs.length})</span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                className={statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                onClick={() => setStatusFilter('ALL')}
              >
                All
              </button>
              <button 
                className={statusFilter === 'VIOLATED' ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                onClick={() => setStatusFilter('VIOLATED')}
              >
                Violated
              </button>
              <button 
                className={statusFilter === 'COMPLIANT' ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                onClick={() => setStatusFilter('COMPLIANT')}
              >
                Compliant
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredAdrs.map((adr) => {
              const isViolated = adr.violationCount > 0;

              return (
                <div 
                  key={adr.id} 
                  style={{ 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--border-card)', 
                    borderLeft: `4px solid ${isViolated ? 'var(--accent-rose)' : 'var(--accent-emerald)'}`,
                    borderRadius: 'var(--radius-sm)', 
                    padding: '16px 18px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '0.88rem' }}>
                        {adr.id}
                      </span>
                      <strong style={{ fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                        {adr.title}
                      </strong>
                    </div>

                    <span className={`violation-badge ${isViolated ? 'badge-critical' : 'badge-medium'}`}>
                      {isViolated ? `VIOLATED (${adr.violationCount})` : 'COMPLIANT'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Decision:</strong> {adr.decision}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    <strong>Rationale:</strong> {adr.rationale}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-card)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    <span>Static Rule: <code>{adr.ruleId}</code></span>
                    <span style={{ color: 'var(--accent-emerald)' }}>STATUS: {adr.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Create ADR Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>➕</span>
              <span>Author New Architecture Record</span>
            </div>
          </div>

          <form onSubmit={handleCreateADR}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
                ADR Title
              </label>
              <input 
                type="text" 
                className="repo-selector" 
                style={{ width: '100%' }}
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Domain Layer Storage Independence"
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
                Decision Statement
              </label>
              <textarea 
                className="repo-selector" 
                style={{ width: '100%', minHeight: '90px', fontFamily: 'var(--font-main)', lineHeight: '1.5' }}
                value={decision} 
                onChange={(e) => setDecision(e.target.value)}
                placeholder="We will prohibit UI components and presentation controllers from importing DB connectors..."
                required
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
                Rationale & Justification
              </label>
              <textarea 
                className="repo-selector" 
                style={{ width: '100%', minHeight: '80px', fontFamily: 'var(--font-main)', lineHeight: '1.5' }}
                value={rationale} 
                onChange={(e) => setRationale(e.target.value)}
                placeholder="To preserve hexagonal layer boundaries and isolate SQL persistence details."
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving Policy...' : '📜 Commit ADR & Bind AST Rule'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
