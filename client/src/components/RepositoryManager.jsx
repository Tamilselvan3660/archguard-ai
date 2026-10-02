import React, { useState } from 'react';

export default function RepositoryManager({ onScan, scanData }) {
  const [repoType, setRepoType] = useState('upload');
  
  return (
    <div className="content-body" style={{ paddingTop: '8px' }}>
      <h2 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Repository Intelligence</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Connect, upload, or select a repository to perform architecture drift analysis.
      </p>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Left Side: Repo Selection */}
        <div style={{ flex: 1 }}>
          <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-primary)' }}>Connect Repository</h3>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button 
                className={`secondary-btn ${repoType === 'upload' ? 'active' : ''}`}
                style={{ background: repoType === 'upload' ? 'var(--bg-secondary)' : 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                onClick={() => setRepoType('upload')}
              >
                ZIP Upload
              </button>
              <button 
                className={`secondary-btn ${repoType === 'git' ? 'active' : ''}`}
                style={{ background: repoType === 'git' ? 'var(--bg-secondary)' : 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                onClick={() => setRepoType('git')}
              >
                Git Repository
              </button>
            </div>

            {repoType === 'upload' && (
              <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '30px', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem' }}>📤</span>
                <p style={{ color: 'var(--text-secondary)', marginTop: '10px', marginBottom: '16px' }}>Drag and drop repository ZIP or click to browse.</p>
                <button className="primary-btn">Browse Files</button>
              </div>
            )}

            {repoType === 'git' && (
              <div>
                <input 
                  type="text" 
                  placeholder="https://github.com/org/repo.git" 
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginBottom: '16px' }}
                />
                <button className="primary-btn" style={{ width: '100%' }}>Connect & Clone</button>
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-primary)' }}>Available Repositories</h3>
            
            <div 
              style={{ padding: '12px', border: '1px solid var(--accent-indigo)', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>sample-ecommerce</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Local directory analysis</div>
              </div>
              <button 
                className="primary-btn" 
                onClick={() => onScan('sample-ecommerce')}
              >
                Scan Now
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Scan History */}
        <div style={{ flex: 1 }}>
          <div className="glass-panel" style={{ padding: '20px', height: '100%' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-primary)' }}>Recent Scans</h3>
            
            {scanData ? (
              <div style={{ padding: '12px', borderLeft: '3px solid #10b981', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>sample-ecommerce</strong>
                  <span style={{ fontSize: '0.8rem', color: '#10b981' }}>COMPLETED</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Health: {scanData.health?.overallHealth || 85}/100 • Violations: {scanData.violations?.length || 4}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Just now
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No recent scans available. Trigger a scan to see history.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
