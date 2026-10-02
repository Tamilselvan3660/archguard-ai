import React, { useState } from 'react';

export default function TimeMachine({ commitHistory = [] }) {
  const [selectedCommit, setSelectedCommit] = useState(
    commitHistory.length > 0 ? commitHistory[commitHistory.length - 1] : null
  );

  if (!commitHistory || commitHistory.length === 0) {
    return (
      <div className="content-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>Loading Git Evolution history...</h2>
      </div>
    );
  }

  // Calculate SVG line chart coordinates for health score progression
  const chartHeight = 120;
  const chartWidth = 600;
  const paddingX = 40;
  const paddingY = 20;

  const points = commitHistory.map((c, i) => {
    const x = paddingX + (i / (commitHistory.length - 1)) * (chartWidth - 2 * paddingX);
    const y = paddingY + ((100 - c.health) / 40) * (chartHeight - 2 * paddingY);
    return { x, y, ...c };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Architecture Time Machine</h1>
          <div className="page-subtitle">
            Commit-by-commit Git telemetry tracing architectural health degradation and accumulated technical debt.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(255,255,255,0.04)', 
            border: '1px solid var(--border-card)', 
            padding: '6px 14px', 
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            fontFamily: 'var(--font-mono)'
          }}>
            <span>🌱 BASELINE:</span>
            <strong style={{ color: 'var(--accent-emerald)' }}>c1a90f (96/100)</strong>
          </span>
        </div>
      </div>

      {/* SVG Health Trend Chart */}
      <div className="card" style={{ marginBottom: '24px', overflow: 'hidden' }}>
        <div className="card-header">
          <div className="card-title">
            <span>📈</span>
            <span>Historical Health Degradation Curve</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            4 Analyzed Commits (Sep 15 – Oct 1)
          </span>
        </div>

        <div style={{ width: '100%', overflowX: 'auto', padding: '10px 0' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} style={{ width: '100%', height: '170px' }}>
            {/* Grid Lines */}
            <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <line x1={paddingX} y1={chartHeight} x2={chartWidth - paddingX} y2={chartHeight} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

            {/* Gradient Area Fill under Curve */}
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <path 
              d={`${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`}
              fill="url(#chartGradient)"
            />

            {/* Main Trend Line */}
            <path 
              d={pathD} 
              fill="none" 
              stroke="#38bdf8" 
              strokeWidth="3" 
              filter="drop-shadow(0 0 6px rgba(56, 189, 248, 0.4))"
            />

            {/* Interactive Data Points */}
            {points.map((p) => {
              const isSelected = selectedCommit?.commit === p.commit;
              const pointColor = p.health >= 90 ? '#10b981' : p.health >= 80 ? '#f59e0b' : '#f43f5e';

              return (
                <g 
                  key={p.commit} 
                  onClick={() => setSelectedCommit(p)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r={isSelected ? 7 : 5} 
                    fill={pointColor}
                    stroke="#fff"
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  <text 
                    x={p.x} 
                    y={p.y - 10} 
                    fill="#fff" 
                    fontSize="11" 
                    fontFamily="var(--font-mono)" 
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {p.health}
                  </text>
                  <text 
                    x={p.x} 
                    y={chartHeight + 20} 
                    fill="var(--text-muted)" 
                    fontSize="10" 
                    fontFamily="var(--font-mono)" 
                    textAnchor="middle"
                  >
                    {p.commit}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Commit Evolution Timeline */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>⏱️</span>
              <span>Git Commit Trajectory</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Click commit to inspect architecture diff
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {commitHistory.map((c, i) => {
              const isSelected = selectedCommit?.commit === c.commit;
              const healthDelta = i === 0 ? 0 : c.health - commitHistory[i - 1].health;

              return (
                <div 
                  key={c.commit}
                  onClick={() => setSelectedCommit(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isSelected ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.02)',
                    border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-card)',
                    padding: '16px 18px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isSelected ? '0 0 15px rgba(56,189,248,0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.06)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: 'var(--accent-purple)'
                    }}>
                      {c.author.split(' ').map(n => n[0]).join('')}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ 
                          fontFamily: 'var(--font-mono)', 
                          color: 'var(--accent-cyan)', 
                          fontWeight: 700, 
                          fontSize: '0.82rem',
                          background: 'rgba(56, 189, 248, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '3px'
                        }}>
                          {c.commit}
                        </span>
                        <strong style={{ fontSize: '0.94rem', color: 'var(--text-primary)' }}>{c.message}</strong>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {c.author} • {c.date}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '6px' }}>
                      <span style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 800, 
                        fontFamily: 'var(--font-heading)', 
                        color: c.health >= 90 ? 'var(--accent-emerald)' : c.health >= 80 ? 'var(--accent-amber)' : 'var(--accent-rose)' 
                      }}>
                        {c.health}
                      </span>
                      {healthDelta !== 0 && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          color: healthDelta > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' 
                        }}>
                          {healthDelta > 0 ? `+${healthDelta}` : healthDelta}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {c.violations} Violations • Debt: {c.debt}h
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Commit Drift Inspector */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>🔍</span>
              <span>Commit Drift Inspector</span>
            </div>
          </div>

          {selectedCommit ? (
            <div>
              <div style={{ 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid var(--border-card)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '14px', 
                marginBottom: '16px' 
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  SNAPSHOT COMMIT
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: 'var(--accent-cyan)', fontWeight: 700, marginTop: '2px' }}>
                  git commit {selectedCommit.commit}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Author: <strong>{selectedCommit.author}</strong> ({selectedCommit.date})
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>COMMIT MESSAGE:</strong>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.94rem', marginTop: '4px', fontWeight: 500 }}>
                  "{selectedCommit.message}"
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HEALTH SCORE</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: selectedCommit.health >= 90 ? 'var(--accent-emerald)' : selectedCommit.health >= 80 ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>
                    {selectedCommit.health}/100
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TECH DEBT</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
                    {selectedCommit.debt} hrs
                  </div>
                </div>
              </div>

              <div style={{ 
                background: selectedCommit.violations > 0 ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${selectedCommit.violations > 0 ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '14px'
              }}>
                <div style={{ 
                  fontSize: '0.82rem', 
                  fontWeight: 700, 
                  color: selectedCommit.violations > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                  marginBottom: '4px' 
                }}>
                  {selectedCommit.violations > 0 ? '⚠️ Architectural Drift Introduced' : '✅ Baseline Architecture Preserved'}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedCommit.violations > 0 
                    ? `This commit introduced ${selectedCommit.violations} new architecture violations, resulting in an accumulated debt of ${selectedCommit.debt} engineering hours.`
                    : 'Clean domain architecture with zero layer breaches or circular references.'}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 16px' }}>
              Select a commit from the timeline to inspect its architectural impact.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
