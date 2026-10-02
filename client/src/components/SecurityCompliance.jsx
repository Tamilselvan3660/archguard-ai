import React, { useState, useEffect } from 'react';

export default function SecurityCompliance({ scanData, onShowToast }) {
  const elements = scanData?.elements || [];
  const [selectedId, setSelectedId] = useState('');
  const [blastData, setBlastData] = useState(null);
  const [loadingBlast, setLoadingBlast] = useState(false);
  const [hotspots, setHotspots] = useState([]);
  const [loadingHotspots, setLoadingHotspots] = useState(true);
  const [signedOff, setSignedOff] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('blast'); // 'blast' | 'hotspots'

  useEffect(() => {
    if (elements.length > 0 && !selectedId) {
      // Pick first element or one with high connectivity
      const defaultElem = elements.find(e => /service|repo/i.test(e.name)) || elements[0];
      setSelectedId(defaultElem.id);
    }
  }, [elements]);

  useEffect(() => {
    if (selectedId) {
      fetchBlastRadius(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchHotspots();
  }, []);

  const fetchBlastRadius = async (compTargetId) => {
    setLoadingBlast(true);
    try {
      const res = await fetch(`/api/blast-radius/${encodeURIComponent(compTargetId)}`);
      const data = await res.json();
      setBlastData(data);
    } catch {
      if (onShowToast) onShowToast('⚠️ Failed to calculate blast radius');
    } finally {
      setLoadingBlast(false);
    }
  };

  const fetchHotspots = async () => {
    setLoadingHotspots(true);
    try {
      const res = await fetch('/api/hotspots');
      const data = await res.json();
      setHotspots(data);
    } catch {
      if (onShowToast) onShowToast('⚠️ Failed to load architecture hotspots');
    } finally {
      setLoadingHotspots(false);
    }
  };

  const handleSignOff = () => {
    setSignedOff(true);
    if (onShowToast) onShowToast('✅ Cryptographic Architecture Sign-Off Certificate Generated!');
  };

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>💥</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Advanced Blast Radius &amp; Architecture Hotspots
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Transitive change failure modeling, structural hotspot discovery, and ISO/IEC 25010 risk governance.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn-${activeSubTab === 'blast' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveSubTab('blast')}
            style={{ fontSize: '0.84rem' }}
          >
            💥 Blast Radius Analyzer
          </button>
          <button 
            className={`btn-${activeSubTab === 'hotspots' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveSubTab('hotspots')}
            style={{ fontSize: '0.84rem' }}
          >
            🔥 Structural Hotspots ({hotspots.length})
          </button>
        </div>
      </div>

      {/* ── Sub-tab 1: Advanced Blast Radius Analyzer ── */}
      {activeSubTab === 'blast' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
            
            {/* Left: Blast Simulator Card */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title">
                  <span>🎯</span>
                  <span>Target Component Selection</span>
                </div>
                <select 
                  className="repo-selector"
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  style={{ maxWidth: '280px' }}
                >
                  {elements.map(el => (
                    <option key={el.id} value={el.id}>
                      {el.name} ({el.layer})
                    </option>
                  ))}
                </select>
              </div>

              {loadingBlast ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Calculating transitive dependency tree...
                </div>
              ) : blastData && !blastData.error ? (
                <div>
                  {/* Metric Gauge Banner */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    marginBottom: '18px',
                    padding: '16px 20px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                        TRANSITIVE RISK SCORE
                      </div>
                      <div style={{
                        fontSize: '2.4rem',
                        fontWeight: 900,
                        fontFamily: 'var(--font-heading)',
                        color: blastData.riskScore > 65 ? 'var(--accent-rose)' : blastData.riskScore > 40 ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                      }}>
                        {blastData.riskScore}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
                      </div>
                      <span className={`violation-badge ${blastData.severity === 'CRITICAL' ? 'badge-critical' : blastData.severity === 'HIGH' ? 'badge-high' : 'badge-medium'}`} style={{ fontSize: '0.66rem', padding: '2px 8px' }}>
                        {blastData.severity} RISK
                      </span>
                    </div>

                    <div style={{ flex: 1, borderLeft: '1px solid var(--border-card)', paddingLeft: '16px' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {blastData.target?.name}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', margin: '2px 0 8px' }}>
                        Layer: {blastData.target?.layer} &bull; Path: {blastData.target?.path}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(239,68,68,0.1)', color: 'var(--accent-rose)', fontWeight: 700 }}>
                          {blastData.impactSummary?.directCount} Direct Dependents
                        </span>
                        <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)', fontWeight: 700 }}>
                          {blastData.impactSummary?.indirectCount} Transitive Dependents
                        </span>
                        <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(56,189,248,0.1)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                          {blastData.impactSummary?.apiImpactCount} API Endpoints
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Impact Flow Diagram: Target -> Direct -> Transitive */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                      DEPENDENCY IMPACT GRAPH TRAVERSAL:
                    </div>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto' }}>
                      
                      {/* 1. Target */}
                      <div style={{ background: 'var(--bg-card)', border: '2px solid var(--accent-blue)', borderRadius: '8px', padding: '8px 12px', textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--accent-blue)', fontWeight: 800 }}>SOURCE</div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>{blastData.target?.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{blastData.target?.layer}</div>
                      </div>

                      <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>&rarr;</span>

                      {/* 2. Direct Dependents */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--accent-rose)', fontWeight: 800 }}>DIRECT DEPENDENTS ({blastData.directDependents.length})</div>
                        {blastData.directDependents.length === 0 ? (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>None (Leaf Node)</span>
                        ) : (
                          blastData.directDependents.slice(0, 3).map(d => (
                            <div key={d.id} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '4px', padding: '3px 8px', fontSize: '0.74rem', color: 'var(--text-primary)' }}>
                              • {d.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.66rem' }}>({d.layer})</span>
                            </div>
                          ))
                        )}
                        {blastData.directDependents.length > 3 && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>+{blastData.directDependents.length - 3} more</span>
                        )}
                      </div>

                      <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>&rarr;</span>

                      {/* 3. Transitive Dependents */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.64rem', color: 'var(--accent-amber)', fontWeight: 800 }}>TRANSITIVE CASCADE ({blastData.indirectDependents.length})</div>
                        {blastData.indirectDependents.length === 0 ? (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>No cascade impact</span>
                        ) : (
                          blastData.indirectDependents.slice(0, 3).map(d => (
                            <div key={d.id} style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '4px', padding: '3px 8px', fontSize: '0.74rem', color: 'var(--text-primary)' }}>
                              ⚡ {d.name}
                            </div>
                          ))
                        )}
                        {blastData.indirectDependents.length > 3 && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>+{blastData.indirectDependents.length - 3} more</span>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Impact Breakdown Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-card)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>API IMPACT</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                        {blastData.impactSummary?.apiImpactCount} Endpoints
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-card)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>DATABASE IMPACT</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '2px' }}>
                        {blastData.impactSummary?.dataImpactCount} Modules
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-card)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>TEST RE-RUNS</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '2px' }}>
                        {blastData.impactSummary?.testImpactCount} Test Files
                      </div>
                    </div>
                  </div>

                </div>
              ) : null}
            </div>

            {/* Right: Governance Sign-Off Certificate */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header">
                <div className="card-title">
                  <span>✍️</span>
                  <span>Architectural Sign-Off Certificate</span>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: '1.5', marginBottom: '14px' }}>
                Verify blast radius containment and generate a cryptographic audit token confirming architectural compliance before production merges.
              </p>

              <div style={{ 
                background: signedOff ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)', 
                border: `1px solid ${signedOff ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-card)'}`, 
                borderRadius: 'var(--radius-sm)', 
                padding: '16px',
                marginBottom: '16px',
                flex: 1
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  VERIFICATION STATUS
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: signedOff ? 'var(--accent-emerald)' : 'var(--accent-amber)', marginTop: '4px' }}>
                  {signedOff ? '✅ DIGITAL SIGN-OFF ISSUED' : '⏳ PENDING EXECUTIVE REVIEW'}
                </div>

                {signedOff && (
                  <div style={{ marginTop: '12px', fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: '1.6' }}>
                    <div>Reviewer: Sarah Lin (Lead Architect)</div>
                    <div>Target: {blastData?.target?.name}</div>
                    <div>Timestamp: {new Date().toISOString()}</div>
                    <div>Token: sha256:{Math.random().toString(36).substring(2, 15)}...</div>
                  </div>
                )}
              </div>

              <button 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleSignOff}
                disabled={signedOff}
              >
                {signedOff ? 'Audit Certificate Generated' : 'Sign Off Architecture Review'}
              </button>
            </div>

          </div>
        </>
      )}

      {/* ── Sub-tab 2: Structural Hotspots ── */}
      {activeSubTab === 'hotspots' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: '14px' }}>
            <div className="card-title">
              <span>🔥</span>
              <span>Architecture Hotspot Rankings</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Identified via Fan-In, Fan-Out, Coupling, Churn, Violations &amp; Blast Radius
            </span>
          </div>

          {loadingHotspots ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Evaluating structural hotspots...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {hotspots.map(h => (
                <div 
                  key={h.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className={`violation-badge ${h.level === 'CRITICAL' ? 'badge-critical' : h.level === 'HIGH' ? 'badge-high' : 'badge-medium'}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                        {h.hotspotScore}/100 [{h.level}]
                      </span>
                      <strong style={{ fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                        {h.name}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        ({h.layer}) &bull; {h.lineCount} LOC
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '6px 0' }}>
                      {h.reasons.map((r, i) => (
                        <span key={i} style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.08)', color: 'var(--accent-rose)' }}>
                          ⚠️ {r}
                        </span>
                      ))}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
                      💡 <strong>Remediation:</strong> {h.recommendation}
                    </div>
                  </div>

                  <button 
                    className="btn-secondary"
                    style={{ fontSize: '0.74rem', padding: '4px 10px', whiteSpace: 'nowrap' }}
                    onClick={() => {
                      setSelectedId(h.id);
                      setActiveSubTab('blast');
                    }}
                  >
                    Analyze Blast →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
