import React from 'react';

export default function DashboardOverview({ scanData, onNavigateTab, onTriggerAICopilot }) {
  if (!scanData) {
    return (
      <div className="content-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Analyzing System Topology...</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Parsing ASTs, recovering dependency graphs, and evaluating architectural drift.</p>
      </div>
    );
  }

  const health = scanData?.health || {};
  const techStack = scanData?.techStack || [];
  const violations = scanData?.violations || [];
  const healthScore = health.overallHealth || 85;
  const debt = health.architectureDebtIndex || 0;
  const violationCount = violations.length;
  const cycleCount = health?.counts?.cycleCount || 0;
  const totalComponents = health?.counts?.totalElements || 0;
  const totalDependencies = health?.counts?.totalDependencies || 0;

  // Mini Sparkline Component
  const Sparkline = ({ color, points }) => {
    const max = Math.max(...points, 1);
    const min = Math.min(...points, 0);
    const range = max - min || 1;
    const width = 100;
    const height = 30;
    const pathData = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <svg width="100%" height="30" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ marginTop: '10px', overflow: 'visible' }}>
        <path d={pathData} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="content-body" style={{ paddingTop: '8px' }}>
      
      {/* KPI Row */}
      <div className="vault-kpi-grid">
        <div className="vault-kpi-card" onClick={() => onNavigateTab('drift')} style={{ cursor: 'pointer' }}>
          <div className="vault-kpi-info">
            <span className="vault-kpi-label" style={{ fontSize: '0.7rem' }}>ARCHITECTURE HEALTH</span>
            <span className="vault-kpi-val" style={{ color: healthScore < 80 ? '#ef4444' : '#10b981' }}>{healthScore} / 100</span>
          </div>
          <Sparkline color={healthScore < 80 ? '#ef4444' : '#10b981'} points={[70, 75, 78, 80, healthScore]} />
        </div>
        
        <div className="vault-kpi-card" onClick={() => onNavigateTab('drift')} style={{ cursor: 'pointer' }}>
          <div className="vault-kpi-info">
            <span className="vault-kpi-label" style={{ fontSize: '0.7rem' }}>DRIFT VIOLATIONS</span>
            <span className="vault-kpi-val">{violationCount}</span>
          </div>
          <Sparkline color="#f59e0b" points={[2, 4, 3, 5, violationCount]} />
        </div>

        <div className="vault-kpi-card">
          <div className="vault-kpi-info">
            <span className="vault-kpi-label" style={{ fontSize: '0.7rem' }}>ARCHITECTURE DEBT</span>
            <span className="vault-kpi-val">{debt}</span>
          </div>
          <Sparkline color="#ef4444" points={[10, 15, 20, 22, debt]} />
        </div>

        <div className="vault-kpi-card" onClick={() => onNavigateTab('map')} style={{ cursor: 'pointer' }}>
          <div className="vault-kpi-info">
            <span className="vault-kpi-label" style={{ fontSize: '0.7rem' }}>CYCLES</span>
            <span className="vault-kpi-val" style={{ color: cycleCount > 0 ? '#ef4444' : 'var(--text-primary)' }}>{cycleCount}</span>
          </div>
          <Sparkline color="#8b5cf6" points={[0, 1, 1, 2, cycleCount]} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        
        {/* Recent Violations */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-primary)' }}>Recent Architecture Drift</h3>
          {violations.slice(0, 5).map((v, i) => (
            <div key={i} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px', marginBottom: '8px', borderLeft: `3px solid ${v.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong>{v.id}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v.category}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{v.actual}</div>
            </div>
          ))}
          {violations.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>No drift detected.</div>}
          <button className="primary-btn" style={{ width: '100%', marginTop: '10px' }} onClick={() => onNavigateTab('drift')}>
            View All Violations
          </button>
        </div>

        {/* AI Recommendations */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-primary)' }}>AI Architect Recommendations</h3>
          {violations.filter(v => v.severity === 'CRITICAL').slice(0, 2).map((v, i) => (
            <div key={i} style={{ padding: '12px', background: 'rgba(126, 34, 206, 0.1)', borderRadius: '6px', marginBottom: '8px', border: '1px solid rgba(126, 34, 206, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.2rem' }}>🤖</span>
                <strong style={{ color: '#a855f7' }}>Refactoring Plan for {v.id}</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {v.recommendation}
              </p>
              <button 
                onClick={() => onTriggerAICopilot(`How do I fix ${v.id}?`)}
                style={{ background: 'transparent', border: '1px solid #a855f7', color: '#a855f7', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Ask Copilot
              </button>
            </div>
          ))}
          {violations.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>Architecture is healthy. No recommendations.</div>}
        </div>
      </div>

      {/* Tech Stack & Component Stats */}
      <div className="glass-panel" style={{ padding: '20px', marginTop: '20px' }}>
         <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-primary)' }}>System Topology</h3>
         <div style={{ display: 'flex', gap: '40px' }}>
           <div>
             <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>COMPONENTS</div>
             <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{totalComponents}</div>
           </div>
           <div>
             <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>DEPENDENCIES</div>
             <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{totalDependencies}</div>
           </div>
           <div>
             <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TECH STACK</div>
             <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
               {Object.entries(techStack?.languages || {}).map(([lang, pct]) => (
                 <span key={lang} style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{lang} {pct}</span>
               ))}
               {techStack?.frameworks?.map(f => (
                 <span key={f} style={{ background: 'rgba(37,99,235,0.1)', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{f}</span>
               ))}
             </div>
           </div>
         </div>
      </div>
    </div>
  );
}
