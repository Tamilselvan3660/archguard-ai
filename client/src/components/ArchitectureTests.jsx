import React, { useState, useEffect } from 'react';

export default function ArchitectureTests({ onShowToast, onNavigateTab }) {
  const [suite, setSuite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [showCiModal, setShowCiModal] = useState(false);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'FAILED' | 'PASSED'

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tests');
      const data = await res.json();
      setSuite(data);
    } catch {
      if (onShowToast) onShowToast('⚠️ Failed to load test results');
    } finally {
      setLoading(false);
    }
  };

  const handleRunTests = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/tests/run', { method: 'POST' });
      const data = await res.json();
      setSuite(data);
      if (onShowToast) {
        if (data.status === 'PASSED') {
          onShowToast('✅ All architecture tests passed!');
        } else {
          onShowToast(`❌ Architecture test suite failed: ${data.summary?.failed} failures`);
        }
      }
    } catch {
      if (onShowToast) onShowToast('⚠️ Error running architecture tests');
    } finally {
      setRunning(false);
    }
  };

  const filteredTests = (suite?.tests || []).filter(t => {
    if (filter === 'FAILED') return t.status === 'FAILED';
    if (filter === 'PASSED') return t.status === 'PASSED';
    return true;
  });

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.6rem' }}>🧪</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Architecture Regression Testing
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Automated shift-left regression tests preventing architectural erosion and circular reference regressions.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-secondary"
            onClick={() => setShowCiModal(true)}
            style={{ fontSize: '0.84rem' }}
          >
            ⚙️ CI/CD Pipeline
          </button>
          <button 
            className="btn-primary"
            onClick={handleRunTests}
            disabled={running}
            style={{ fontSize: '0.84rem' }}
          >
            {running ? 'Running Tests...' : '⚡ Run Test Suite'}
          </button>
        </div>
      </div>

      {/* 2. Suite Summary Metric Banner */}
      {suite && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-card)', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '0.95rem',
                letterSpacing: '1px',
                background: suite.status === 'PASSED' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: suite.status === 'PASSED' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
              }}>
                {suite.status === 'PASSED' ? '✓ TEST SUITE PASSED' : '✕ TEST SUITE FAILED'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Executed in <strong>{suite.durationMs}ms</strong> &bull; {suite.timestamp ? new Date(suite.timestamp).toLocaleTimeString() : ''}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {['ALL', 'FAILED', 'PASSED'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '4px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-card)',
                    background: filter === f ? 'var(--accent-blue)' : 'var(--bg-surface)',
                    color: filter === f ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {f} {f === 'ALL' ? `(${suite.summary.total})` : f === 'FAILED' ? `(${suite.summary.failed})` : `(${suite.summary.passed})`}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Tests</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{suite.summary.total}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Passed</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '2px' }}>{suite.summary.passed}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Failed</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '2px' }}>{suite.summary.failed}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pass Rate</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: suite.summary.passRate >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)', marginTop: '2px' }}>
                {suite.summary.passRate}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tests List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          Loading architecture test results...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTests.map((t, idx) => (
            <div 
              key={idx}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${t.status === 'FAILED' ? 'rgba(239,68,68,0.35)' : 'var(--border-card)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.1rem' }}>{t.status === 'PASSED' ? '✅' : '❌'}</span>
                  <span style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                    {t.name}
                  </span>
                  <span className={`violation-badge ${t.severity === 'CRITICAL' ? 'badge-critical' : t.severity === 'HIGH' ? 'badge-high' : 'badge-medium'}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                    {t.severity}
                  </span>
                  <span style={{ fontSize: '0.66rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {t.category}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: t.status === 'PASSED' ? 'var(--text-secondary)' : 'var(--accent-rose)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                  Evidence: {t.evidence}
                </div>
              </div>

              {t.status === 'FAILED' && onNavigateTab && (
                <button 
                  className="btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '5px 10px', whiteSpace: 'nowrap' }}
                  onClick={() => onNavigateTab('drift')}
                >
                  Inspect Drift →
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 4. CI/CD Integration Modal */}
      {showCiModal && (
        <div className="modal-overlay" onClick={() => setShowCiModal(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <div className="card-title">🚀 CI/CD Architecture Regression Gate</div>
              <button className="btn-secondary" style={{ padding: '3px 8px' }} onClick={() => setShowCiModal(false)}>✕</button>
            </div>
            
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Add ARCHGUARD AI testing to your pull request pipeline to automatically reject commits that breach architecture boundaries.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                LOCAL TERMINAL EXECUTION:
              </div>
              <pre style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-blue)' }}>
                node bin/archguard.js test --ci
              </pre>
            </div>

            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
                GITHUB ACTIONS WORKFLOW (.github/workflows/archguard.yml):
              </div>
              <pre style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)', fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-primary)', overflowX: 'auto' }}>
{`name: Architecture Regression Guard
on: [push, pull_request]

jobs:
  archguard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: node bin/archguard.js test --ci`}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-primary" onClick={() => setShowCiModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
