import React, { useState } from 'react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  healthScore = 85, 
  violationCount = 4, 
  currentUser,
  onLogout,
  cloudAuthenticated = false
}) {
  const userName = currentUser?.name || 'Sarah Lin';
  const userEmail = currentUser?.email || 'sarah.lin@enterprise.io';

  // Helper for expanding/collapsing sections
  const [expandedSections, setExpandedSections] = useState({
    repo: true,
    arch: true,
    drift: true,
    evo: false,
    gov: false,
    ai: true,
    cloud: true,
    reports: false,
    settings: false
  });

  const toggleSection = (sec) => {
    setExpandedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
      {/* Brand Header */}
      <div className="brand-container">
        <div className="brand-icon-shield">🛡️</div>
        <div>
          <div className="brand-title">ARCHGUARD<span>.AI</span></div>
          <div className="brand-subtitle">ENTERPRISE GOVERNANCE</div>
        </div>
      </div>

      <div className="sidebar-scroll-area" style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
        {/* Dashboard */}
        <nav className="nav-menu">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <div className="nav-item-content">
              <span className="nav-icon" style={{ color: activeTab === 'overview' ? '#fff' : '#2563eb' }}>📊</span>
              <span>Dashboard</span>
            </div>
          </button>
        </nav>

        {/* Repository Intelligence */}
        <div className="nav-section-title" onClick={() => toggleSection('repo')} style={{cursor: 'pointer', display: 'flex', justifyContent: 'space-between', marginTop: '14px'}}>
          <span>Repository Intelligence</span>
          <span>{expandedSections.repo ? '▼' : '▶'}</span>
        </div>
        {expandedSections.repo && (
          <nav className="nav-menu">
            <button className={`nav-item ${activeTab === 'repositories' ? 'active' : ''}`} onClick={() => setActiveTab('repositories')}>
              <div className="nav-item-content"><span className="nav-icon">📁</span><span>Repositories</span></div>
            </button>
            <button className={`nav-item ${activeTab === 'upload-repo' ? 'active' : ''}`} onClick={() => setActiveTab('upload-repo')}>
              <div className="nav-item-content"><span className="nav-icon">📤</span><span>Upload Repository</span></div>
            </button>
          </nav>
        )}

        {/* Architecture */}
        <div className="nav-section-title" onClick={() => toggleSection('arch')} style={{cursor: 'pointer', display: 'flex', justifyContent: 'space-between', marginTop: '14px'}}>
          <span>Architecture</span>
          <span>{expandedSections.arch ? '▼' : '▶'}</span>
        </div>
        {expandedSections.arch && (
          <nav className="nav-menu">
            <button className={`nav-item ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
              <div className="nav-item-content"><span className="nav-icon" style={{ color: '#0284c7' }}>🕸️</span><span>Architecture Map</span></div>
            </button>
            <button className={`nav-item ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>
              <div className="nav-item-content"><span className="nav-icon" style={{ color: 'var(--accent-indigo)' }}>⚙️</span><span>Architecture Rules</span></div>
            </button>
            <button className={`nav-item ${activeTab === 'fitness' ? 'active' : ''}`} onClick={() => setActiveTab('fitness')}>
              <div className="nav-item-content"><span className="nav-icon" style={{ color: '#10b981' }}>⚖️</span><span>Fitness Functions</span></div>
            </button>
            <button className={`nav-item ${activeTab === 'model' ? 'active' : ''}`} onClick={() => setActiveTab('model')}>
              <div className="nav-item-content"><span className="nav-icon" style={{ color: '#d97706' }}>📝</span><span>Architecture Model</span></div>
            </button>
          </nav>
        )}

        {/* Drift Intelligence */}
        <div className="nav-section-title" onClick={() => toggleSection('drift')} style={{cursor: 'pointer', display: 'flex', justifyContent: 'space-between', marginTop: '14px'}}>
          <span>Drift Intelligence</span>
          <span>{expandedSections.drift ? '▼' : '▶'}</span>
        </div>
        {expandedSections.drift && (
          <nav className="nav-menu">
            <button className={`nav-item ${activeTab === 'drift' ? 'active' : ''}`} onClick={() => setActiveTab('drift')}>
              <div className="nav-item-content"><span className="nav-icon" style={{ color: '#ef4444' }}>⚠️</span><span>Violations</span></div>
              {violationCount > 0 && <span className="nav-badge-pill warning" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>{violationCount} DRIFT</span>}
            </button>
            <button className={`nav-item ${activeTab === 'matrix' ? 'active' : ''}`} onClick={() => setActiveTab('matrix')}>
              <div className="nav-item-content"><span className="nav-icon" style={{ color: '#7e22ce' }}>📐</span><span>Dependency Analysis</span></div>
            </button>
            <button className={`nav-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
              <div className="nav-item-content"><span className="nav-icon" style={{ color: '#e11d48' }}>💥</span><span>Blast Radius &amp; Hotspots</span></div>
            </button>
          </nav>
        )}

        {/* Evolution */}
        <div className="nav-section-title" onClick={() => toggleSection('evo')} style={{cursor: 'pointer', display: 'flex', justifyContent: 'space-between', marginTop: '14px'}}>
          <span>Evolution</span>
          <span>{expandedSections.evo ? '▼' : '▶'}</span>
        </div>
        {expandedSections.evo && (
          <nav className="nav-menu">
            <button className={`nav-item ${activeTab === 'evolution' ? 'active' : ''}`} onClick={() => setActiveTab('evolution')}>
              <div className="nav-item-content"><span className="nav-icon" style={{ color: '#10b981' }}>⏱️</span><span>Git History</span></div>
            </button>
            <button className={`nav-item ${activeTab === 'sandbox' ? 'active' : ''}`} onClick={() => setActiveTab('sandbox')}>
              <div className="nav-item-content"><span className="nav-icon" style={{ color: '#059669' }}>🧪</span><span>Refactoring Sandbox</span></div>
            </button>
          </nav>
        )}

        {/* Governance */}
        <div className="nav-section-title" onClick={() => toggleSection('gov')} style={{cursor: 'pointer', display: 'flex', justifyContent: 'space-between', marginTop: '14px'}}>
          <span>Governance</span>
          <span>{expandedSections.gov ? '▼' : '▶'}</span>
        </div>
        {expandedSections.gov && (
          <nav className="nav-menu">
            <button className={`nav-item ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')}>
              <div className="nav-item-content"><span className="nav-icon" style={{ color: '#0ea5e9' }}>🧪</span><span>Architecture Tests</span></div>
            </button>
            <button className={`nav-item ${activeTab === 'adrs' ? 'active' : ''}`} onClick={() => setActiveTab('adrs')}>
              <div className="nav-item-content"><span className="nav-icon" style={{ color: '#b45309' }}>📜</span><span>ADR Manager</span></div>
            </button>
            <button className={`nav-item ${activeTab === 'prguard' ? 'active' : ''}`} onClick={() => setActiveTab('prguard')}>
              <div className="nav-item-content"><span className="nav-icon" style={{ color: '#059669' }}>🛡️</span><span>PR Architecture Guard</span></div>
            </button>
          </nav>
        )}

        {/* AI */}
        <div className="nav-section-title" onClick={() => toggleSection('ai')} style={{cursor: 'pointer', display: 'flex', justifyContent: 'space-between', marginTop: '14px'}}>
          <span>AI</span>
          <span>{expandedSections.ai ? '▼' : '▶'}</span>
        </div>
        {expandedSections.ai && (
          <nav className="nav-menu">
            <button className={`nav-item ${activeTab === 'copilot' ? 'active' : ''}`} onClick={() => setActiveTab('copilot')}>
              <div className="nav-item-content"><span className="nav-icon" style={{ color: '#7e22ce' }}>🤖</span><span>AI Architect</span></div>
            </button>
          </nav>
        )}

        {/* Cloud Vault */}
        <div className="nav-section-title" onClick={() => toggleSection('cloud')} style={{cursor: 'pointer', display: 'flex', justifyContent: 'space-between', marginTop: '14px'}}>
          <span>Cloud Vault</span>
          <span>{expandedSections.cloud ? '▼' : '▶'}</span>
        </div>
        {expandedSections.cloud && (
          <nav className="nav-menu">
            <button className={`nav-item ${activeTab === 'cloud-storage' ? 'active' : ''}`} onClick={() => setActiveTab('cloud-storage')}>
              <div className="nav-item-content"><span className="nav-icon" style={{ color: activeTab === 'cloud-storage' ? '#fff' : '#0284c7' }}>☁️</span><span>Multi-Cloud Storage</span></div>
              {cloudAuthenticated ? (
                <span className="nav-badge-pill" style={{ fontSize: '0.64rem', padding: '1px 6px', background: 'rgba(37,99,235,0.12)', color: '#2563eb', fontWeight: 700 }}>3 CLOUDS</span>
              ) : (
                <span className="nav-badge-pill" style={{ fontSize: '0.64rem', padding: '1px 6px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700 }}>🔒 LOCKED</span>
              )}
            </button>
          </nav>
        )}
      </div>

      {/* Logged in User Profile Footer */}
      <div className="sidebar-user-footer" style={{ marginTop: 'auto' }}>
        <div className="sidebar-user-name">{userName}</div>
        <div className="sidebar-user-email">{userEmail}</div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
          <button type="button" className="sidebar-logout-btn" style={{ flex: 1, padding: '5px 8px', fontSize: '0.74rem' }} onClick={() => { if (onLogout) onLogout(); }}>
            <span>↳</span><span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
