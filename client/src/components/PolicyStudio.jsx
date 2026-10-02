import React, { useState } from 'react';

export default function PolicyStudio({ onShowToast }) {
  const [rules, setRules] = useState([
    {
      id: 'RULE-001',
      name: 'no-ui-database-access',
      title: 'UI & Presentation Direct Database Access Prohibition',
      category: 'LAYER_VIOLATION',
      severity: 'HIGH',
      source: 'presentation',
      forbidden: ['infrastructure'],
      description: 'Controllers, views, and UI handlers must never query database repositories or drivers directly.',
      enforced: true,
      violationsCount: 1
    },
    {
      id: 'RULE-002',
      name: 'no-domain-infrastructure-coupling',
      title: 'Domain Layer Isolation from Infrastructure Details',
      category: 'BOUNDARY_VIOLATION',
      severity: 'CRITICAL',
      source: 'domain',
      forbidden: ['infrastructure'],
      description: 'Core domain services and entities must remain pure business logic and not couple with concrete infrastructure classes.',
      enforced: true,
      violationsCount: 1
    },
    {
      id: 'RULE-003',
      name: 'no-circular-dependencies',
      title: 'Acyclic Dependency Graph Mandate (ADP)',
      category: 'CYCLIC_DEPENDENCY',
      severity: 'CRITICAL',
      source: '*',
      forbidden: ['self-cycle'],
      description: 'Modules must form a Directed Acyclic Graph (DAG). Mutual recursion between domain components is forbidden.',
      enforced: true,
      violationsCount: 1
    },
    {
      id: 'RULE-004',
      name: 'enforce-application-facade',
      title: 'Application Layer Use-Case Orchestration Mandatory',
      category: 'LAYER_VIOLATION',
      severity: 'MEDIUM',
      source: 'presentation',
      forbidden: ['domain'],
      description: 'Presentation controllers should orchestrate operations via Application Use Cases rather than directly instantiating domain entities.',
      enforced: false,
      violationsCount: 0
    },
    {
      id: 'RULE-005',
      name: 'no-third-party-in-domain',
      title: 'Zero Third-Party Vendor SDKs in Pure Domain',
      category: 'BOUNDARY_VIOLATION',
      severity: 'HIGH',
      source: 'domain',
      forbidden: ['external-sdk'],
      description: 'Prevents vendor lock-in by prohibiting vendor HTTP libraries (e.g. axios, aws-sdk) inside domain business logic.',
      enforced: true,
      violationsCount: 0
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    title: '',
    category: 'LAYER_VIOLATION',
    severity: 'HIGH',
    source: 'presentation',
    forbidden: 'infrastructure',
    description: ''
  });

  const toggleRule = (id) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enforced: !r.enforced } : r));
    const r = rules.find(rule => rule.id === id);
    if (onShowToast) {
      onShowToast(`${r.enforced ? 'Disabled' : 'Enabled'} rule ${r.id}: ${r.name}`);
    }
  };

  const handleCreateRule = (e) => {
    e.preventDefault();
    if (!newRule.name || !newRule.title) return;

    const created = {
      id: `RULE-00${rules.length + 1}`,
      name: newRule.name.toLowerCase().replace(/\s+/g, '-'),
      title: newRule.title,
      category: newRule.category,
      severity: newRule.severity,
      source: newRule.source,
      forbidden: [newRule.forbidden],
      description: newRule.description,
      enforced: true,
      violationsCount: 0
    };

    setRules(prev => [...prev, created]);
    setShowAddModal(false);
    setNewRule({
      name: '',
      title: '',
      category: 'LAYER_VIOLATION',
      severity: 'HIGH',
      source: 'presentation',
      forbidden: 'infrastructure',
      description: ''
    });

    if (onShowToast) onShowToast(`Created & Activated Rule ${created.id}!`);
  };

  const handleExportYaml = () => {
    const yaml = `# ARCHGUARD AI — Architecture Intended Specification
version: 1.0
system: sample-ecommerce
rules:
${rules.map(r => `  - id: "${r.id}"
    name: "${r.name}"
    severity: "${r.severity}"
    category: "${r.category}"
    source: "${r.source}"
    forbidden: ${JSON.stringify(r.forbidden)}
    enforced: ${r.enforced}
    description: "${r.description}"`).join('\n')}
`;

    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'architecture.yaml';
    a.click();
    if (onShowToast) onShowToast('Exported architecture.yaml specification!');
  };

  return (
    <div className="content-body">
      {/* Modal to Create New Custom Rule */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div className="card-title">
                <span>➕</span>
                <span>Author New Architectural Governance Rule</span>
              </div>
              <button className="btn-secondary" style={{ padding: '4px 10px' }} onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateRule}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Rule Identifier Slug</label>
                <input 
                  type="text" 
                  className="repo-selector" 
                  style={{ width: '100%' }}
                  placeholder="e.g. no-direct-orm-in-controllers"
                  value={newRule.name}
                  onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Descriptive Rule Title</label>
                <input 
                  type="text" 
                  className="repo-selector" 
                  style={{ width: '100%' }}
                  placeholder="e.g. Controllers Must Not Import TypeORM Repositories"
                  value={newRule.title}
                  onChange={e => setNewRule({ ...newRule, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Source Layer</label>
                  <select 
                    className="repo-selector" 
                    style={{ width: '100%' }}
                    value={newRule.source}
                    onChange={e => setNewRule({ ...newRule, source: e.target.value })}
                  >
                    <option value="presentation">Presentation Layer</option>
                    <option value="application">Application Layer</option>
                    <option value="domain">Domain Layer</option>
                    <option value="infrastructure">Infrastructure Layer</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Forbidden Target Layer</label>
                  <select 
                    className="repo-selector" 
                    style={{ width: '100%' }}
                    value={newRule.forbidden}
                    onChange={e => setNewRule({ ...newRule, forbidden: e.target.value })}
                  >
                    <option value="infrastructure">Infrastructure Layer</option>
                    <option value="presentation">Presentation Layer</option>
                    <option value="domain">Domain Layer</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Violation Severity</label>
                  <select 
                    className="repo-selector" 
                    style={{ width: '100%' }}
                    value={newRule.severity}
                    onChange={e => setNewRule({ ...newRule, severity: e.target.value })}
                  >
                    <option value="CRITICAL">CRITICAL (Blocks CI/CD)</option>
                    <option value="HIGH">HIGH (Warning & Metric Drop)</option>
                    <option value="MEDIUM">MEDIUM (Code Smell)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Rule Category</label>
                  <select 
                    className="repo-selector" 
                    style={{ width: '100%' }}
                    value={newRule.category}
                    onChange={e => setNewRule({ ...newRule, category: e.target.value })}
                  >
                    <option value="LAYER_VIOLATION">Layer Violation</option>
                    <option value="BOUNDARY_VIOLATION">Boundary Violation</option>
                    <option value="CYCLIC_DEPENDENCY">Cyclic Dependency</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Rationale & Policy Guidance</label>
                <textarea 
                  className="repo-selector" 
                  style={{ width: '100%', minHeight: '70px', fontFamily: 'var(--font-main)' }}
                  placeholder="Explain why this architectural restriction is enforced..."
                  value={newRule.description}
                  onChange={e => setNewRule({ ...newRule, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save & Activate Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Architecture Policy & Rule Studio</h1>
          <div className="page-subtitle">
            Configure declarative structural boundaries, layer forbidden constraints, and CI/CD gatekeeping thresholds.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={handleExportYaml}>
            📥 Export architecture.yaml
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            ➕ Add Custom Rule
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {rules.map(rule => (
          <div 
            key={rule.id}
            className="card"
            style={{ 
              opacity: rule.enforced ? 1 : 0.6, 
              borderLeft: `4px solid ${rule.severity === 'CRITICAL' ? 'var(--accent-rose)' : rule.severity === 'HIGH' ? 'var(--accent-amber)' : 'var(--accent-cyan)'}`,
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={`violation-badge ${rule.severity === 'CRITICAL' ? 'badge-critical' : rule.severity === 'HIGH' ? 'badge-high' : 'badge-medium'}`}>
                  {rule.severity}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  {rule.id}
                </span>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  {rule.title}
                </strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ 
                  fontSize: '0.74rem', 
                  fontFamily: 'var(--font-mono)',
                  color: rule.violationsCount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                  background: rule.violationsCount > 0 ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}>
                  {rule.violationsCount > 0 ? `⚠️ ${rule.violationsCount} Breaches` : '✅ 0 Breaches'}
                </span>

                <label className="switch-toggle" title={rule.enforced ? 'Rule Active' : 'Rule Disabled'}>
                  <input 
                    type="checkbox" 
                    checked={rule.enforced} 
                    onChange={() => toggleRule(rule.id)}
                  />
                  <span className="slider-round"></span>
                </label>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px', lineHeight: '1.5' }}>
              {rule.description}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Identifier: <code style={{ color: 'var(--text-primary)' }}>{rule.name}</code></span>
              <span>Source: <strong style={{ color: 'var(--accent-cyan)' }}>{rule.source}</strong></span>
              <span>Forbidden: <strong style={{ color: 'var(--accent-rose)' }}>{rule.forbidden.join(', ')}</strong></span>
              <span style={{ marginLeft: 'auto', color: rule.enforced ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                {rule.enforced ? '● ENFORCED IN CI/CD' : '○ DISABLED'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
