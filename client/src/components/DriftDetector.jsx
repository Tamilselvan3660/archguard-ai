import React, { useState } from 'react';

export default function DriftDetector({ violations = [], onNavigateToCopilot, onShowToast }) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filteredViolations = violations.filter(v => {
    const matchesSev = filterSeverity === 'ALL' || v.severity === filterSeverity;
    const matchesSearch = !searchQuery || 
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.actual.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.ruleName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesSearch;
  });

  const handleCopyCli = (violation) => {
    const cmd = `archguard fix --rule ${violation.ruleName} --target "${violation.actual}"`;
    navigator.clipboard?.writeText(cmd);
    if (onShowToast) onShowToast(`Copied CLI Command: ${cmd}`);
  };

  const handleAskAI = (violation) => {
    if (onNavigateToCopilot) {
      onNavigateToCopilot(`How do I refactor violation [${violation.id}] (${violation.actual}) according to ${violation.ruleName}?`);
    }
  };

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Architecture Drift Detector</h1>
          <div className="page-subtitle">
            Deterministic AST and import-edge evidence comparing intended architectural constraints against code realities.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="text"
            className="repo-selector"
            placeholder="🔍 Search violations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '220px' }}
          />

          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
              <button 
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={filterSeverity === sev ? 'btn-primary' : 'btn-secondary'}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '0.78rem',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-rose)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>CRITICAL SEVERITY</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-rose)', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
            {violations.filter(v => v.severity === 'CRITICAL').length}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Immediate build failure</div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-amber)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>HIGH SEVERITY</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
            {violations.filter(v => v.severity === 'HIGH').length}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Layer isolation leaks</div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-purple)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>GOVERNANCE RULES</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-purple)', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
            2 Active
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Bound from ADRs</div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '3px solid var(--accent-cyan)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>ESTIMATED RESOLUTION</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
            ~3.5 hrs
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Pair programming effort</div>
        </div>
      </div>

      {/* Violations List */}
      {filteredViolations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✨</div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>No Architecture Drift Violations Found</h3>
          <p style={{ fontSize: '0.9rem' }}>All evaluated code modules conform strictly to the specified architecture rules.</p>
        </div>
      ) : (
        filteredViolations.map((v) => {
          const isExpanded = expandedId === v.id;

          return (
            <div key={v.id} className={`violation-card severity-${v.severity.toLowerCase()}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`violation-badge badge-${v.severity.toLowerCase()}`}>
                    {v.severity}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    {v.id}
                  </span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {v.category}
                  </strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Policy: <code style={{ color: 'var(--text-primary)' }}>{v.ruleName}</code>
                  </span>
                  <button 
                    className="btn-secondary" 
                    style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    onClick={() => setExpandedId(isExpanded ? null : v.id)}
                  >
                    {isExpanded ? 'Collapse' : 'Details'}
                  </button>
                </div>
              </div>

              {/* Comparison Box */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    EXPECTED ARCHITECTURAL PATTERN
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.92rem', fontWeight: 500 }}>
                    {v.expected}
                  </div>
                </div>

                <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-rose)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    ACTUAL CODE IMPLEMENTATION (BREACH)
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.92rem', fontWeight: 500 }}>
                    {v.actual}
                  </div>
                </div>
              </div>

              {/* Empirical Code Evidence */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  EMPIRICAL CODE EVIDENCE & AST TRACE:
                </div>
                <div className="code-box">
                  {v.evidence.map((ev, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ color: 'var(--text-muted)', userSelect: 'none' }}>0{i + 1}</span>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 500 }}>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Impact & Action */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--accent-amber)', display: 'block', marginBottom: '4px' }}>
                    ⚠️ Architectural Impact:
                  </strong>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    {v.impact}
                  </p>
                </div>

                <div style={{ background: 'var(--bg-surface-elevated)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)', display: 'block', marginBottom: '4px' }}>
                    💡 Recommended Fix:
                  </strong>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    {v.recommendation}
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-card)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn-secondary" 
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    onClick={() => handleCopyCli(v)}
                  >
                    📋 Copy CLI Fix
                  </button>
                  <button 
                    className="btn-secondary" 
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    onClick={() => {
                      if (onShowToast) onShowToast(`Created issue for [${v.id}] in tracker`);
                    }}
                  >
                    🎫 Create Jira/GH Issue
                  </button>
                </div>

                <button 
                  className="btn-primary" 
                  style={{ fontSize: '0.8rem', padding: '6px 16px' }}
                  onClick={() => handleAskAI(v)}
                >
                  🤖 Refactor with AI Copilot →
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
