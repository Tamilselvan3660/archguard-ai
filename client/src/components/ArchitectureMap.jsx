import React, { useState } from 'react';

export default function ArchitectureMap({ graphData, violations = [] }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterLayer, setFilterLayer] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!graphData) {
    return (
      <div className="content-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>Loading Architecture Graph...</h2>
      </div>
    );
  }

  const { nodes = [], edges = [] } = graphData;

  const layers = [
    { id: 'presentation', name: 'Presentation Layer', color: 'var(--accent-cyan)', icon: '💻', desc: 'UI & HTTP Controllers' },
    { id: 'application', name: 'Application Layer', color: 'var(--accent-purple)', icon: '⚙️', desc: 'Use Cases & Orchestration' },
    { id: 'domain', name: 'Domain Layer', color: 'var(--accent-emerald)', icon: '🏛️', desc: 'Business Entities & Core Logic' },
    { id: 'infrastructure', name: 'Infrastructure Layer', color: 'var(--accent-amber)', icon: '🗄️', desc: 'Databases, Repos & External APIs' }
  ];

  const filteredNodes = nodes.filter(n => {
    const matchesLayer = filterLayer === 'ALL' || n.data.layer === filterLayer;
    const matchesSearch = !searchQuery || 
      n.data.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.data.path.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLayer && matchesSearch;
  });

  const isViolatingNode = (nodeId) => {
    return violations.some(v => v.source === nodeId || v.target === nodeId);
  };

  const getInboundEdges = (nodeId) => edges.filter(e => e.target === nodeId);
  const getOutboundEdges = (nodeId) => edges.filter(e => e.source === nodeId);

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Interactive Architecture Map</h1>
          <div className="page-subtitle">
            Reconstructed dependency topology grouped by architectural layer boundaries.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text"
            className="repo-selector"
            placeholder="🔍 Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '220px' }}
          />

          <select 
            className="repo-selector"
            value={filterLayer}
            onChange={(e) => setFilterLayer(e.target.value)}
          >
            <option value="ALL">All Layers (4)</option>
            <option value="presentation">Presentation Only</option>
            <option value="application">Application Only</option>
            <option value="domain">Domain Only</option>
            <option value="infrastructure">Infrastructure Only</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px' }}>
        {/* Architecture Canvas with Swimlanes */}
        <div className="map-canvas-container">
          <div className="map-toolbar">
            <div className="layer-legend">
              {layers.map(l => (
                <span 
                  key={l.id} 
                  className="legend-chip"
                  style={{ 
                    background: `rgba(255,255,255,0.04)`, 
                    border: `1px solid ${l.color}`,
                    color: l.color 
                  }}
                >
                  <span>{l.icon}</span>
                  <span>{l.name.replace(' Layer', '')}</span>
                </span>
              ))}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Showing {filteredNodes.length} of {nodes.length} Components
            </div>
          </div>

          {/* Swimlane Columns Layout */}
          <div className="swimlanes-grid">
            {layers.map(layer => {
              const layerNodes = filteredNodes.filter(n => n.data.layer === layer.id);
              if (filterLayer !== 'ALL' && filterLayer !== layer.id) return null;

              return (
                <div key={layer.id} className="swimlane-col">
                  <div className="swimlane-header" style={{ color: layer.color }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{layer.icon}</span>
                      <span>{layer.name}</span>
                    </div>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      background: 'rgba(255,255,255,0.06)', 
                      padding: '1px 6px', 
                      borderRadius: '4px',
                      color: 'var(--text-secondary)'
                    }}>
                      {layerNodes.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {layerNodes.map(node => {
                      const violating = isViolatingNode(node.id);
                      const isSelected = selectedNode?.id === node.id;
                      const inbound = getInboundEdges(node.id).length;
                      const outbound = getOutboundEdges(node.id).length;

                      return (
                        <div 
                          key={node.id}
                          className={`component-node-card ${isSelected ? 'selected' : ''} ${violating ? 'violating' : ''}`}
                          onClick={() => setSelectedNode(node)}
                          style={{
                            borderLeftWidth: '3px',
                            borderLeftColor: violating ? 'var(--accent-rose)' : layer.color
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.72rem', color: layer.color, fontWeight: 700, textTransform: 'uppercase' }}>
                              {node.data.type || 'CLASS'}
                            </span>
                            {violating && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--accent-rose)', fontWeight: 800, background: 'rgba(244,63,94,0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                                ⚠️ DRIFT
                              </span>
                            )}
                          </div>

                          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                            {node.data.label}
                          </div>

                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {node.data.path}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-card)', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            <span>{node.data.lineCount} LOC</span>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>
                              in: {inbound} | out: {outbound}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {layerNodes.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No components in this layer
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Component Inspector */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ marginBottom: '14px' }}>
            <div className="card-title">
              <span>📌</span>
              <span>Component Inspector</span>
            </div>
          </div>

          {selectedNode ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                background: 'var(--bg-surface-elevated)', 
                border: '1px solid var(--border-card)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '14px', 
                marginBottom: '16px' 
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  MODULE NAME
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                  {selectedNode.data.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px', wordBreak: 'break-all' }}>
                  {selectedNode.data.path}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LAYER</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                    {selectedNode.data.layer}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LINES OF CODE</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    {selectedNode.data.lineCount}
                  </div>
                </div>
              </div>

              {/* Drift Status for Selected Node */}
              {isViolatingNode(selectedNode.id) && (
                <div style={{ 
                  background: 'rgba(244, 63, 94, 0.1)', 
                  border: '1px solid rgba(244, 63, 94, 0.3)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '12px', 
                  marginBottom: '16px' 
                }}>
                  <div style={{ color: 'var(--accent-rose)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚠️</span>
                    <span>Architecture Drift Involved</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    This component breaches intended layer boundaries or participates in a circular reference.
                  </div>
                </div>
              )}

              {/* Edge Connections */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  DEPENDENCY EDGES
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '6px' }}>
                    Outgoing Dependencies ({getOutboundEdges(selectedNode.id).length}):
                  </div>
                  {getOutboundEdges(selectedNode.id).map(e => (
                    <div key={e.id} style={{ 
                      fontSize: '0.76rem', 
                      background: 'rgba(56, 189, 248, 0.06)', 
                      padding: '6px 8px', 
                      borderRadius: '4px', 
                      marginBottom: '4px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      ➜ {e.target}
                    </div>
                  ))}
                  {getOutboundEdges(selectedNode.id).length === 0 && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None</div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: '6px' }}>
                    Incoming Dependents ({getInboundEdges(selectedNode.id).length}):
                  </div>
                  {getInboundEdges(selectedNode.id).map(e => (
                    <div key={e.id} style={{ 
                      fontSize: '0.76rem', 
                      background: 'rgba(16, 185, 129, 0.06)', 
                      padding: '6px 8px', 
                      borderRadius: '4px', 
                      marginBottom: '4px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      ⬅ {e.source}
                    </div>
                  ))}
                  {getInboundEdges(selectedNode.id).length === 0 && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 16px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>👆</div>
              <p style={{ fontSize: '0.88rem' }}>
                Select any component node from the swimlanes to inspect its architectural layer, line count, and bidirectional dependencies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
