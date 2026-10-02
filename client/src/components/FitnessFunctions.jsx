import React, { useState, useEffect } from 'react';

export default function FitnessFunctions({ onShowToast }) {
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showYamlModal, setShowYamlModal] = useState(false);
  const [yamlContent, setYamlContent] = useState('');

  // Form State
  const [newFn, setNewFn] = useState({
    name: '',
    description: '',
    type: 'dependency',
    severity: 'HIGH',
    sourceLayer: 'domain',
    forbiddenLayer: 'presentation',
    metric: 'cycles',
    threshold: 0,
    operator: '=='
  });

  useEffect(() => {
    fetchFunctions();
  }, []);

  const fetchFunctions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fitness-functions');
      const data = await res.json();
      setFunctions(data);
    } catch {
      if (onShowToast) onShowToast('⚠️ Failed to load fitness functions');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const res = await fetch('/api/fitness-functions/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ functions })
      });
      const data = await res.json();
      setEvaluation(data);
      if (onShowToast) {
        if (data.summary?.status === 'PASSED') {
          onShowToast('✅ All architecture fitness functions passed!');
        } else {
          onShowToast(`⚠️ Fitness evaluation finished: ${data.summary?.failed} failures detected`);
        }
      }
    } catch {
      if (onShowToast) onShowToast('⚠️ Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  const handleToggle = async (fn) => {
    const updated = { ...fn, enabled: !fn.enabled };
    try {
      await fetch('/api/fitness-functions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      setFunctions(prev => prev.map(f => f.id === fn.id ? updated : f));
      if (onShowToast) onShowToast(`${fn.name} ${updated.enabled ? 'Enabled' : 'Disabled'}`);
    } catch {
      if (onShowToast) onShowToast('⚠️ Could not update function');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/fitness-functions/${id}`, { method: 'DELETE' });
      setFunctions(prev => prev.filter(f => f.id !== id));
      if (onShowToast) onShowToast(`Fitness function ${id} removed`);
    } catch {
      if (onShowToast) onShowToast('⚠️ Deletion failed');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newFn.name.trim()) return;

    let spec = {};
    if (newFn.type === 'dependency') {
      spec = { sourceLayer: newFn.sourceLayer, forbiddenLayer: newFn.forbiddenLayer };
    } else if (newFn.type === 'graph') {
      spec = { metric: 'cycles', operator: '==', threshold: 0 };
    } else if (newFn.type === 'metric') {
      spec = { metric: newFn.metric, operator: newFn.operator, threshold: Number(newFn.threshold) };
    }

    const payload = {
      name: newFn.name.trim(),
      description: newFn.description.trim() || 'Architectural governance constraint',
      type: newFn.type,
      severity: newFn.severity,
      enabled: true,
      spec
    };

    try {
      const res = await fetch('/api/fitness-functions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setFunctions(prev => [...prev, data.fitnessFunction]);
        setShowCreateModal(false);
        setNewFn({
          name: '',
          description: '',
          type: 'dependency',
          severity: 'HIGH',
          sourceLayer: 'domain',
          forbiddenLayer: 'presentation',
          metric: 'cycles',
          threshold: 0,
          operator: '=='
        });
        if (onShowToast) onShowToast('✅ Fitness function created');
      }
    } catch {
      if (onShowToast) onShowToast('⚠️ Failed to save fitness function');
    }
  };

  const handleExportYaml = () => {
    const yamlLines = ['# ARCHGUARD Architecture Fitness Functions Definition', 'fitness_functions:'];
    functions.forEach(f => {
      yamlLines.push(`  - id: ${f.id}`);
      yamlLines.push(`    name: "${f.name}"`);
      yamlLines.push(`    type: ${f.type}`);
      yamlLines.push(`    severity: ${f.severity.toLowerCase()}`);
      yamlLines.push(`    enabled: ${f.enabled}`);
      if (f.spec) {
        yamlLines.push(`    spec:`);
        Object.entries(f.spec).forEach(([k, v]) => {
          yamlLines.push(`      ${k}: ${Array.isArray(v) ? `[${v.join(', ')}]` : v}`);
        });
      }
      yamlLines.push('');
    });
    setYamlContent(yamlLines.join('\n'));
    setShowYamlModal(true);
  };

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>⚖️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Architecture Fitness Functions
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Automated continuous architectural fitness tests enforcing layer isolation, acyclic graphs, and boundary metrics.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-secondary"
            onClick={handleExportYaml}
            style={{ fontSize: '0.84rem' }}
          >
            📋 View YAML
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setShowCreateModal(true)}
            style={{ fontSize: '0.84rem' }}
          >
            ➕ New Function
          </button>
          <button 
            className="btn-primary"
            onClick={handleEvaluate}
            disabled={evaluating}
            style={{ fontSize: '0.84rem' }}
          >
            {evaluating ? 'Evaluating...' : '⚡ Run Evaluation'}
          </button>
        </div>
      </div>

      {/* 2. Evaluation Summary Card if Available */}
      {evaluation && (
        <div style={{ 
          background: evaluation.summary.status === 'PASSED' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${evaluation.summary.status === 'PASSED' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '2rem' }}>
              {evaluation.summary.status === 'PASSED' ? '🛡️' : '🚨'}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: evaluation.summary.status === 'PASSED' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                Fitness Evaluation: {evaluation.summary.status} ({evaluation.summary.passRate}% Pass Rate)
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Evaluated {evaluation.summary.total} functions: {evaluation.summary.passed} Passed &bull; {evaluation.summary.failed} Failed
              </div>
            </div>
          </div>
          <button 
            className="btn-secondary"
            style={{ fontSize: '0.78rem' }}
            onClick={() => setEvaluation(null)}
          >
            Clear Results
          </button>
        </div>
      )}

      {/* 3. Functions List Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          Loading fitness functions...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {functions.map(fn => {
            const evalResult = evaluation?.results?.find(r => r.id === fn.id);
            const status = evalResult ? evalResult.status : (fn.enabled ? 'ACTIVE' : 'DISABLED');

            return (
              <div 
                key={fn.id}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${evalResult?.status === 'FAILED' ? 'rgba(239,68,68,0.4)' : 'var(--border-card)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  transition: 'border-color 0.2s',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                      {fn.id}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                      {fn.name}
                    </span>
                    <span className={`violation-badge ${fn.severity === 'CRITICAL' ? 'badge-critical' : fn.severity === 'HIGH' ? 'badge-high' : 'badge-medium'}`} style={{ fontSize: '0.64rem', padding: '2px 7px' }}>
                      {fn.severity}
                    </span>
                    <span style={{
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(37,99,235,0.1)',
                      color: 'var(--accent-blue)',
                      textTransform: 'uppercase'
                    }}>
                      {fn.type}
                    </span>
                    {evalResult && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: evalResult.status === 'PASSED' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: evalResult.status === 'PASSED' ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                      }}>
                        {evalResult.status === 'PASSED' ? '✅ PASSED' : `❌ ${evalResult.violationCount} BREACHES`}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0 0 10px', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                    {fn.description}
                  </p>

                  {/* Evidence / Failures details if evaluated and failed */}
                  {evalResult?.violations?.length > 0 && (
                    <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginTop: '8px' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '4px' }}>
                        Violations Detected:
                      </div>
                      {evalResult.violations.map((v, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                          &bull; {v.evidence}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button 
                    type="button"
                    onClick={() => handleToggle(fn)}
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-card)',
                      cursor: 'pointer',
                      background: fn.enabled ? 'rgba(16,185,129,0.12)' : 'var(--bg-card-hover)',
                      color: fn.enabled ? 'var(--accent-emerald)' : 'var(--text-muted)'
                    }}
                  >
                    {fn.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleDelete(fn.id)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '0.78rem',
                      color: 'var(--accent-rose)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    title="Delete Fitness Function"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div className="card-title">➕ Add Architecture Fitness Function</div>
              <button className="btn-secondary" style={{ padding: '3px 8px' }} onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Function Name
                </label>
                <input 
                  type="text"
                  placeholder="e.g., Domain must not depend on UI"
                  value={newFn.name}
                  onChange={e => setNewFn({ ...newFn, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Rule Type
                  </label>
                  <select 
                    value={newFn.type}
                    onChange={e => setNewFn({ ...newFn, type: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="dependency">Dependency Layer Rule</option>
                    <option value="graph">Graph Cycle Constraint</option>
                    <option value="metric">Coupling / Metric Threshold</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Severity
                  </label>
                  <select 
                    value={newFn.severity}
                    onChange={e => setNewFn({ ...newFn, severity: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              {newFn.type === 'dependency' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Source Layer
                    </label>
                    <select 
                      value={newFn.sourceLayer}
                      onChange={e => setNewFn({ ...newFn, sourceLayer: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                    >
                      <option value="domain">domain</option>
                      <option value="application">application</option>
                      <option value="presentation">presentation</option>
                      <option value="infrastructure">infrastructure</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Forbidden Target Layer
                    </label>
                    <select 
                      value={newFn.forbiddenLayer}
                      onChange={e => setNewFn({ ...newFn, forbiddenLayer: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                    >
                      <option value="presentation">presentation</option>
                      <option value="infrastructure">infrastructure</option>
                      <option value="domain">domain</option>
                    </select>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Function
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. YAML View Modal */}
      {showYamlModal && (
        <div className="modal-overlay" onClick={() => setShowYamlModal(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: '14px' }}>
              <div className="card-title">📄 Fitness Functions Specification (YAML)</div>
              <button className="btn-secondary" style={{ padding: '3px 8px' }} onClick={() => setShowYamlModal(false)}>✕</button>
            </div>
            <pre style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              maxHeight: '360px',
              overflowY: 'auto'
            }}>
              {yamlContent}
            </pre>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-primary" onClick={() => {
                navigator.clipboard.writeText(yamlContent);
                if (onShowToast) onShowToast('YAML copied to clipboard');
              }}>
                📋 Copy YAML
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
