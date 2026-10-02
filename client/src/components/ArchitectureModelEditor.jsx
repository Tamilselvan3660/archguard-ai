import React, { useState } from 'react';

export default function ArchitectureModelEditor({ onShowToast }) {
  const [yamlContent, setYamlContent] = useState(
`name: ArchGuard Application Model
version: 1.0.0

layers:
  - name: Presentation
    match: src/controllers/**
    allowed_dependencies:
      - Application
      - Domain
  - name: Application
    match: src/usecases/**
    allowed_dependencies:
      - Domain
  - name: Domain
    match: src/domain/**
    allowed_dependencies: []
  - name: Infrastructure
    match: src/infrastructure/**
    allowed_dependencies:
      - Application
      - Domain

rules:
  - id: no-circular-dependencies
    type: cycle
    severity: CRITICAL
  - id: enforce-layers
    type: allowed_dependencies
    severity: HIGH
`
  );

  const handleSave = () => {
    if (onShowToast) onShowToast('Architecture Model saved successfully.');
  };

  return (
    <div className="content-body" style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Architecture Model</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Define layers, boundaries, and rules as code (YAML).</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="secondary-btn" onClick={() => setYamlContent(yamlContent)}>Reset</button>
          <button className="primary-btn" onClick={handleSave}>💾 Save Model</button>
        </div>
      </div>

      <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', background: '#1e1e1e' }}>
        {/* Simple textarea pretending to be a code editor */}
        <textarea 
          value={yamlContent}
          onChange={(e) => setYamlContent(e.target.value)}
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            color: '#d4d4d4',
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            lineHeight: '1.5',
            padding: '20px',
            border: 'none',
            outline: 'none',
            resize: 'none',
            whiteSpace: 'pre'
          }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
