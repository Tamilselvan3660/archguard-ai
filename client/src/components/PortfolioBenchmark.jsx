import React from 'react';

export default function PortfolioBenchmark({ onSelectRepository, onShowToast }) {
  const portfolio = [
    {
      id: 'sample-ecommerce',
      name: 'eCommerce Enterprise System',
      lead: 'Sarah Lin',
      lang: 'TypeScript',
      framework: 'Express / Node.js',
      components: 9,
      loc: 170,
      health: 81,
      debt: 33,
      violations: 3,
      status: 'Attention Needed',
      statusColor: 'var(--accent-amber)'
    },
    {
      id: 'archguard-core',
      name: 'ARCHGUARD AI Core Platform (Self)',
      lead: 'Alex Chen',
      lang: 'JavaScript',
      framework: 'Vite / React / AST',
      components: 38,
      loc: 1420,
      health: 96,
      debt: 4,
      violations: 0,
      status: 'Optimal Architecture',
      statusColor: 'var(--accent-emerald)'
    },
    {
      id: 'auth-gateway',
      name: 'Identity & Auth Gateway',
      lead: 'Elena Rostova',
      lang: 'Go',
      framework: 'gRPC / Gin',
      components: 24,
      loc: 3200,
      health: 92,
      debt: 10,
      violations: 1,
      status: 'Stable',
      statusColor: 'var(--accent-emerald)'
    },
    {
      id: 'billing-engine',
      name: 'Billing & Settlement Core',
      lead: 'David Kim',
      lang: 'Java',
      framework: 'Spring Boot 3',
      components: 42,
      loc: 4800,
      health: 72,
      debt: 54,
      violations: 6,
      status: 'Critical Debt',
      statusColor: 'var(--accent-rose)'
    },
    {
      id: 'inventory-worker',
      name: 'Inventory Fulfillment Service',
      lead: 'Marcus Vance',
      lang: 'TypeScript',
      framework: 'NestJS / Kafka',
      components: 18,
      loc: 2100,
      health: 88,
      debt: 14,
      violations: 2,
      status: 'Stable',
      statusColor: 'var(--accent-cyan)'
    },
    {
      id: 'recommendation-ai',
      name: 'Recommendation & Search ML',
      lead: 'Dr. Priya Patel',
      lang: 'Python',
      framework: 'FastAPI / PyTorch',
      components: 16,
      loc: 1950,
      health: 94,
      debt: 8,
      violations: 1,
      status: 'Optimal Architecture',
      statusColor: 'var(--accent-emerald)'
    }
  ];

  const avgHealth = Math.round(portfolio.reduce((acc, p) => acc + p.health, 0) / portfolio.length);
  const totalDebt = portfolio.reduce((acc, p) => acc + p.debt, 0);
  const totalComponents = portfolio.reduce((acc, p) => acc + p.components, 0);
  const totalViolations = portfolio.reduce((acc, p) => acc + p.violations, 0);

  const handleInspect = (repo) => {
    if (onSelectRepository) {
      onSelectRepository(repo.id);
    }
    if (onShowToast) {
      onShowToast(`Switched active workspace to: ${repo.name}`);
    }
  };

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Enterprise Portfolio Architecture Benchmark</h1>
          <div className="page-subtitle">
            Cross-service architectural governance comparing microservices, technical debt liability, and ISO/IEC 25010 health indices.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ 
            fontSize: '0.8rem', 
            background: 'rgba(56,189,248,0.1)', 
            border: '1px solid rgba(56,189,248,0.3)', 
            color: 'var(--accent-cyan)', 
            padding: '6px 14px', 
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)' 
          }}>
            ORG: ACME ENTERPRISE
          </span>
        </div>
      </div>

      {/* Portfolio Executive KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">PORTFOLIO AVG HEALTH</span>
            <div className="metric-icon-bubble" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-emerald)' }}>
              🩺
            </div>
          </div>
          <div className="metric-val" style={{ color: 'var(--accent-emerald)' }}>
            {avgHealth}
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div className="metric-footer">
            <span>6 Microservices Monitored</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">TOTAL ACCUMULATED DEBT</span>
            <div className="metric-icon-bubble" style={{ background: 'rgba(168,85,247,0.15)', color: 'var(--accent-purple)' }}>
              ⏳
            </div>
          </div>
          <div className="metric-val" style={{ color: 'var(--accent-purple)' }}>
            {totalDebt}
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}> hrs</span>
          </div>
          <div className="metric-footer">
            <span>~$18,450 Refactoring liability</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">TOTAL ACTIVE VIOLATIONS</span>
            <div className="metric-icon-bubble" style={{ background: 'rgba(244,63,94,0.15)', color: 'var(--accent-rose)' }}>
              ⚠️
            </div>
          </div>
          <div className="metric-val" style={{ color: 'var(--accent-rose)' }}>
            {totalViolations}
          </div>
          <div className="metric-footer">
            <span>Across all 6 systems</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">GOVERNED COMPONENTS</span>
            <div className="metric-icon-bubble" style={{ background: 'rgba(56,189,248,0.15)', color: 'var(--accent-cyan)' }}>
              📦
            </div>
          </div>
          <div className="metric-val" style={{ color: 'var(--accent-cyan)' }}>
            {totalComponents}
          </div>
          <div className="metric-footer">
            <span>13,640 Total LOC Analyzed</span>
          </div>
        </div>
      </div>

      {/* Portfolio Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>🏢</span>
            <span>Microservices Portfolio Matrix</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Ranked by Architectural Risk & Health
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Tech Stack</th>
                <th>Lead Architect</th>
                <th>Health Score</th>
                <th>Tech Debt</th>
                <th>Violations</th>
                <th>Governance Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.components} components • {p.loc} LOC</div>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '0.74rem', 
                      background: 'var(--bg-surface-elevated)', 
                      border: '1px solid var(--border-card)',
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      color: 'var(--accent-cyan)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600
                    }}>
                      {p.lang}
                    </span>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>{p.framework}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.lead}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ 
                        fontFamily: 'var(--font-heading)', 
                        fontSize: '1.1rem',
                        color: p.health >= 90 ? 'var(--accent-emerald)' : p.health >= 80 ? 'var(--accent-amber)' : 'var(--accent-rose)' 
                      }}>
                        {p.health}%
                      </strong>
                      <div style={{ width: '60px', height: '5px', background: 'var(--border-card)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${p.health}%`, 
                          height: '100%', 
                          background: p.health >= 90 ? 'var(--accent-emerald)' : p.health >= 80 ? 'var(--accent-amber)' : 'var(--accent-rose)' 
                        }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-purple)' }}>
                    {p.debt} hrs
                  </td>
                  <td>
                    <span style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontWeight: 700,
                      color: p.violations > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'
                    }}>
                      {p.violations}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '0.74rem', 
                      fontWeight: 700, 
                      color: p.statusColor,
                      background: 'rgba(255,255,255,0.04)',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      border: `1px solid ${p.statusColor}33`
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-secondary" 
                      style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                      onClick={() => handleInspect(p)}
                    >
                      Inspect Service →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
