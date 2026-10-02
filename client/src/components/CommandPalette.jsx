import React, { useState, useEffect } from 'react';

export default function CommandPalette({ isOpen, onClose, onNavigate, onTriggerScan, onOpenExport, onOpenBoard }) {
  const [query, setQuery] = useState('');

  const commands = [
    { id: 'overview', title: 'Go to Executive Dashboard', category: 'Navigation', icon: '📊', action: () => onNavigate('overview') },
    { id: 'board', title: 'Open Enterprise Architecture Governance Board (ARB)', category: 'Governance', icon: '👥', action: () => onOpenBoard ? onOpenBoard() : onNavigate('adrs') },
    { id: 'sandbox', title: 'Open "What-If" Refactoring Sandbox', category: 'Architecture', icon: '🧪', action: () => onNavigate('sandbox') },
    { id: 'matrix', title: 'Open DSM Coupling Matrix & Heatmap', category: 'Architecture', icon: '📐', action: () => onNavigate('matrix') },
    { id: 'diagrams', title: 'Open Diagram Studio (Mermaid & C4)', category: 'Architecture', icon: '🗺️', action: () => onNavigate('diagrams') },
    { id: 'domain-modeler', title: 'Open Domain Modeler (DDD Microservices)', category: 'Architecture', icon: '🧩', action: () => onNavigate('domain-modeler') },
    { id: 'security', title: 'Open Blast Radius & Security Auditor', category: 'Security & Risk', icon: '💥', action: () => onNavigate('security') },
    { id: 'linters', title: 'Generate ArchUnit & ESLint Configs', category: 'Toolchain', icon: '⚡', action: () => onNavigate('linters') },
    { id: 'map', title: 'View Architecture Swimlanes Map', category: 'Navigation', icon: '🕸️', action: () => onNavigate('map') },
    { id: 'drift', title: 'Inspect Architecture Drift Violations', category: 'Governance', icon: '⚠️', action: () => onNavigate('drift') },
    { id: 'rules', title: 'Open Architecture Policy & Rule Studio', category: 'Policy', icon: '⚙️', action: () => onNavigate('rules') },
    { id: 'portfolio', title: 'View Enterprise Portfolio Benchmark', category: 'Portfolio', icon: '🏢', action: () => onNavigate('portfolio') },
    { id: 'evolution', title: 'View Git Evolution Time Machine', category: 'History', icon: '⏱️', action: () => onNavigate('evolution') },
    { id: 'adrs', title: 'Browse Architecture Decision Records (ADRs)', category: 'Policy', icon: '📜', action: () => onNavigate('adrs') },
    { id: 'prguard', title: 'Simulate PR Architecture CI/CD Guard', category: 'CI/CD', icon: '🛡️', action: () => onNavigate('prguard') },
    { id: 'copilot', title: 'Ask AI Architect Copilot', category: 'AI Intelligence', icon: '🤖', action: () => onNavigate('copilot') },
    { id: 'scan', title: 'Trigger Static Architecture AST Scan', category: 'Actions', icon: '⚡', action: () => onTriggerScan() },
    { id: 'export', title: 'Generate Executive Compliance Audit Report', category: 'Actions', icon: '📋', action: () => onOpenExport() }
  ];

  const filteredCommands = commands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(true);
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="cmd-palette-backdrop" onClick={() => onClose()}>
      <div className="cmd-palette-box" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-wrap">
          <span style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)' }}>🔍</span>
          <input 
            type="text" 
            className="cmd-input" 
            placeholder="Type a command or jump to feature (e.g. 'diagrams', 'modeler', 'linters', 'blast')..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <span style={{ 
            fontSize: '0.72rem', 
            background: 'rgba(255,255,255,0.06)', 
            border: '1px solid var(--border-card)', 
            padding: '2px 8px', 
            borderRadius: '4px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)' 
          }}>
            ESC to close
          </span>
        </div>

        <div className="cmd-list">
          {filteredCommands.map(cmd => (
            <div 
              key={cmd.id} 
              className="cmd-item"
              onClick={() => {
                cmd.action();
                onClose();
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.1rem' }}>{cmd.icon}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{cmd.title}</span>
              </div>
              <span style={{ 
                fontSize: '0.72rem', 
                color: 'var(--text-muted)', 
                background: 'var(--bg-surface-elevated)', 
                border: '1px solid var(--border-card)',
                padding: '2px 8px', 
                borderRadius: '3px',
                fontFamily: 'var(--font-mono)' 
              }}>
                {cmd.category}
              </span>
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              No commands matching "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
