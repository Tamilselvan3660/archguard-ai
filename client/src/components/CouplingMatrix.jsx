import React, { useState } from 'react';

export default function CouplingMatrix({ scanData, onShowToast }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  const modules = [
    { id: 'UserController', name: 'UserController', layer: 'presentation', loc: 24 },
    { id: 'OrderController', name: 'OrderController', layer: 'presentation', loc: 18 },
    { id: 'PaymentController', name: 'PaymentController', layer: 'presentation', loc: 20 },
    { id: 'UserService', name: 'UserService', layer: 'domain', loc: 32 },
    { id: 'OrderService', name: 'OrderService', layer: 'domain', loc: 28 },
    { id: 'PaymentService', name: 'PaymentService', layer: 'domain', loc: 25 },
    { id: 'UserModel', name: 'UserModel', layer: 'domain', loc: 14 },
    { id: 'DatabaseRepository', name: 'DatabaseRepository', layer: 'infrastructure', loc: 45 },
    { id: 'InfrastructureConfig', name: 'InfrastructureConfig', layer: 'infrastructure', loc: 16 }
  ];

  // Actual dependency connections in sample-ecommerce
  // [source, target, type]
  const dependencies = [
    { from: 'UserController', to: 'UserService', type: 'clean', count: 1 },
    { from: 'UserController', to: 'DatabaseRepository', type: 'violation', count: 1, reason: 'Presentation directly queries Database (RULE-001)' },
    { from: 'OrderController', to: 'OrderService', type: 'clean', count: 1 },
    { from: 'PaymentController', to: 'PaymentService', type: 'clean', count: 1 },
    { from: 'UserService', to: 'UserModel', type: 'clean', count: 1 },
    { from: 'UserService', to: 'InfrastructureConfig', type: 'violation', count: 1, reason: 'Domain couples with Infrastructure Config (RULE-002)' },
    { from: 'PaymentService', to: 'OrderService', type: 'cycle', count: 1, reason: 'Circular loop: PaymentService imports OrderService' },
    { from: 'OrderService', to: 'PaymentService', type: 'cycle', count: 1, reason: 'Circular loop: OrderService imports PaymentService' }
  ];

  const getDependency = (sourceId, targetId) => {
    return dependencies.find(d => d.from === sourceId && d.to === targetId);
  };

  // Compute Ca, Ce, Instability for each module
  const moduleMetrics = modules.map(m => {
    const ce = dependencies.filter(d => d.from === m.id).length; // Outgoing
    const ca = dependencies.filter(d => d.to === m.id).length;   // Incoming
    const total = ca + ce;
    const instability = total === 0 ? 0 : parseFloat((ce / total).toFixed(2));
    
    // Abstractness heuristic: 1 for models/interfaces, 0 for concrete controllers
    const abstractness = m.name.includes('Model') || m.name.includes('Config') ? 0.8 : 0.1;
    const distance = parseFloat(Math.abs(abstractness + instability - 1).toFixed(2));

    return {
      ...m,
      ca,
      ce,
      instability,
      abstractness,
      distance
    };
  });

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Design Structure Matrix (DSM) & Coupling Heatmap</h1>
          <div className="page-subtitle">
            Rigorous N² matrix visualization calculating Robert C. Martin's Package Coupling & Instability metrics.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ 
            fontSize: '0.78rem', 
            background: 'rgba(16, 185, 129, 0.12)', 
            color: 'var(--accent-emerald)', 
            border: '1px solid rgba(16, 185, 129, 0.3)', 
            padding: '5px 12px', 
            borderRadius: 'var(--radius-sm)' 
          }}>
            🟢 Valid Layer Flow
          </span>
          <span style={{ 
            fontSize: '0.78rem', 
            background: 'rgba(244, 63, 94, 0.12)', 
            color: 'var(--accent-rose)', 
            border: '1px solid rgba(244, 63, 94, 0.3)', 
            padding: '5px 12px', 
            borderRadius: 'var(--radius-sm)' 
          }}>
            🔴 Layer Violation
          </span>
          <span style={{ 
            fontSize: '0.78rem', 
            background: 'rgba(168, 85, 247, 0.12)', 
            color: 'var(--accent-purple)', 
            border: '1px solid rgba(168, 85, 247, 0.3)', 
            padding: '5px 12px', 
            borderRadius: 'var(--radius-sm)' 
          }}>
            🟣 Circular Loop
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* N² Matrix Canvas */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>📐</span>
              <span>Dependency Structure Matrix (DSM)</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Rows: Caller (Source) ➔ Columns: Callee (Target)
            </span>
          </div>

          <div className="matrix-wrapper">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}></th>
                  {modules.map((m, colIdx) => (
                    <th key={m.id} className="matrix-th" title={m.name}>
                      M{colIdx + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((source, rowIdx) => (
                  <tr key={source.id}>
                    <td className="matrix-row-label">
                      <span style={{ color: 'var(--accent-cyan)', marginRight: '6px' }}>M{rowIdx + 1}</span>
                      <span>{source.name}</span>
                    </td>
                    {modules.map((target, colIdx) => {
                      const isSelf = source.id === target.id;
                      const dep = getDependency(source.id, target.id);

                      let cellClass = 'empty';
                      let cellContent = '';

                      if (isSelf) {
                        cellClass = 'self';
                        cellContent = '•';
                      } else if (dep) {
                        cellClass = dep.type; // 'clean', 'violation', 'cycle'
                        cellContent = dep.count;
                      }

                      return (
                        <td 
                          key={target.id}
                          className={`matrix-cell ${cellClass}`}
                          onMouseEnter={() => setHoveredCell({ source, target, dep, isSelf })}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cell Inspection Detail */}
          <div style={{ 
            marginTop: '16px', 
            padding: '12px 16px', 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid var(--border-card)', 
            borderRadius: 'var(--radius-sm)',
            minHeight: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {hoveredCell ? (
              hoveredCell.isSelf ? (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Diagonal Self-Reference: <code>{hoveredCell.source.name}</code>
                </span>
              ) : hoveredCell.dep ? (
                <div>
                  <strong style={{ 
                    fontSize: '0.88rem', 
                    color: hoveredCell.dep.type === 'violation' ? 'var(--accent-rose)' : hoveredCell.dep.type === 'cycle' ? 'var(--accent-purple)' : 'var(--accent-emerald)' 
                  }}>
                    {hoveredCell.source.name} ➔ {hoveredCell.target.name}
                  </strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {hoveredCell.dep.reason || 'Conforming architectural layer invocation.'}
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Zero dependency link between <strong>{hoveredCell.source.name}</strong> and <strong>{hoveredCell.target.name}</strong>
                </span>
              )
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Hover any cell in the matrix to inspect dependency calls and breach details.
              </span>
            )}
          </div>
        </div>

        {/* Legend & Clean Architecture Principles */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>🏛️</span>
              <span>Architectural Principles</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: '4px' }}>
                Stable Abstractions Principle (SAP)
              </strong>
              Modules that are maximally stable ($I \approx 0$) should be abstract, while unstable modules ($I \approx 1$) should be concrete.
            </div>

            <div style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ color: 'var(--accent-rose)', display: 'block', marginBottom: '4px' }}>
                Acyclic Dependencies Principle (ADP)
              </strong>
              The dependency structure of packages/modules must have no circular dependency loops ($A \rightarrow B \rightarrow A$).
            </div>

            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ color: 'var(--accent-emerald)', display: 'block', marginBottom: '4px' }}>
                Dependency Inversion Principle (DIP)
              </strong>
              High-level domain logic must never import low-level infrastructure details. Both must depend upon abstractions.
            </div>
          </div>
        </div>
      </div>

      {/* Martin's Package Coupling Metrics Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>📊</span>
            <span>Module Instability & Coupling Analysis</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            $I = C_e / (C_a + C_e)$ • Distance from Main Sequence $D = |A + I - 1|$
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>Module Name</th>
                <th>Layer</th>
                <th>LOC</th>
                <th>Afferent ($C_a$)</th>
                <th>Efferent ($C_e$)</th>
                <th>Instability ($I$)</th>
                <th>Distance ($D$)</th>
                <th>Stability Status</th>
              </tr>
            </thead>
            <tbody>
              {moduleMetrics.map(m => (
                <tr key={m.id}>
                  <td>
                    <strong style={{ color: 'var(--text-primary)' }}>{m.name}</strong>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      textTransform: 'uppercase', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      background: m.layer === 'presentation' ? 'rgba(56,189,248,0.1)' : m.layer === 'domain' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      color: m.layer === 'presentation' ? 'var(--accent-cyan)' : m.layer === 'domain' ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {m.layer}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{m.loc}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', fontWeight: 600 }}>{m.ca}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>{m.ce}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{m.instability}</span>
                      <div style={{ width: '50px', height: '4px', background: 'var(--border-card)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${m.instability * 100}%`, height: '100%', background: m.instability > 0.7 ? 'var(--accent-amber)' : 'var(--accent-cyan)' }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: m.distance > 0.5 ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                    {m.distance}
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      color: m.instability >= 0.8 ? 'var(--accent-cyan)' : m.instability === 0 ? 'var(--accent-emerald)' : 'var(--accent-amber)' 
                    }}>
                      {m.instability >= 0.8 ? 'Flexible / High Efferent' : m.instability === 0 ? 'Maximal Stability' : 'Balanced'}
                    </span>
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
