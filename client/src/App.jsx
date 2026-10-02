import React, { useState, useEffect, useRef } from 'react';
import SplashScreen from './components/SplashScreen';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import ArchitectureMap from './components/ArchitectureMap';
import DriftDetector from './components/DriftDetector';
import TimeMachine from './components/TimeMachine';
import ADRManager from './components/ADRManager';
import PRGuard from './components/PRGuard';
import AICopilot from './components/AICopilot';
import RefactoringSandbox from './components/RefactoringSandbox';
import CouplingMatrix from './components/CouplingMatrix';
import PolicyStudio from './components/PolicyStudio';
import PortfolioBenchmark from './components/PortfolioBenchmark';
import CommandPalette from './components/CommandPalette';
import DiagramStudio from './components/DiagramStudio';
import DomainModeler from './components/DomainModeler';
import LinterGenerator from './components/LinterGenerator';
import SecurityCompliance from './components/SecurityCompliance';
import CloudDashboard from './components/cloud/CloudDashboard';
import CloudAuthGate from './components/cloud/CloudAuthGate';
import RepositoryManager from './components/RepositoryManager';
import ArchitectureModelEditor from './components/ArchitectureModelEditor';
import FitnessFunctions from './components/FitnessFunctions';
import ArchitectureTests from './components/ArchitectureTests';
import './styles/archguard.css';

export default function App() {
  const [appFlow, setAppFlow] = useState('splash'); // 'splash' -> 'auth' -> 'app'
  const [currentUser, setCurrentUser] = useState(null);
  const [cloudUser, setCloudUser] = useState(null); // separate cloud auth state
  const [activeTab, setActiveTab] = useState('overview');
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState('sample-ecommerce');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('archguard_theme') || 'light';
  });
  const [toastMessage, setToastMessage] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
    const [boardData, setBoardData] = useState(null);
  const [boardLoading, setBoardLoading] = useState(false);
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [copilotInitialQuery, setCopilotInitialQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Circular Dependency Detected',
      description: 'Breach between OrderService and PaymentService violates Layer Boundary Isolation.',
      time: '5m ago',
      severity: 'CRITICAL',
      icon: '🚨',
      unread: true,
      tab: 'drift'
    },
    {
      id: 'notif-2',
      title: 'Architecture Health Evaluated',
      description: 'System health index scored at 82% (Grade B) across 7 structural dimensions.',
      time: '24m ago',
      severity: 'INFO',
      icon: '📊',
      unread: false,
      tab: 'overview'
    },
    {
      id: 'notif-3',
      title: 'ADR Policy Active: ADR-001',
      description: 'Presentation Layer Direct Database Access Prohibition rule active in AST pipeline.',
      time: '1h ago',
      severity: 'SUCCESS',
      icon: '🛡️',
      unread: false,
      tab: 'adr'
    }
  ]);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showNotifications]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    setUnreadCount(0);
    showToast('All notifications marked as read');
  };

  const handleNotificationClick = (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? ({ ...n, unread: false }) : n));
    setUnreadCount(prev => Math.max(0, prev - (notif.unread ? 1 : 0)));
    setActiveTab(notif.tab);
    setShowNotifications(false);
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('archguard_theme', next);
    showToast(`Switched to ${next === 'light' ? 'Light' : 'Dark'} Mode`);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  useEffect(() => {
    fetchLatestScan();

    // Check for multi-cloud OAuth callback
    const searchParams = new URLSearchParams(window.location.search);
    const cloudCallback = searchParams.get('cloud_callback');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (cloudCallback && code) {
      setActiveTab('cloud-storage');
      fetch(`/api/cloud/callback/${cloudCallback}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            showToast(`✅ Successfully connected ${cloudCallback.replace('_', ' ').toUpperCase()}!`);
          } else {
            showToast(`⚠️ ${data.message || 'Connection failed'}`);
          }
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(err => {
          console.error('OAuth callback exchange failed:', err);
          showToast('⚠️ Cloud authentication callback error');
        });
    }
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchLatestScan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scans/latest');
      const data = await res.json();
      setScanData(data);
    } catch (e) {
      console.error('Failed to connect to ARCHGUARD API server:', e);
      showToast('⚠️ Could not connect to ArchGuard Backend');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScan = async (repoName) => {
    const repo = repoName || selectedRepo;
    setLoading(true);
    showToast(`⚡ Running AST Parser on ${repo}...`);
    try {
      const targetRepo = repo === 'sample-ecommerce' 
        ? 'sample-ecommerce' 
        : '.';

      const res = await fetch('/api/repositories/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath: targetRepo })
      });
      const data = await res.json();
      setScanData(data);
      showToast(`✅ Scan Completed (Health: ${data.health.overallHealth}/100, Debt: ${data.health.architectureDebtIndex}h)`);
    } catch (e) {
      console.error(e);
      showToast('❌ Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepository = (repoId) => {
    setSelectedRepo(repoId);
    handleTriggerScan(repoId);
    setActiveTab('overview');
  };

  const handleNavigateToCopilotWithQuery = (query) => {
    setCopilotInitialQuery(query);
    setActiveTab('copilot');
  };

  const handleOpenArchitectureBoard = async () => {
    setShowBoardModal(true);
    setBoardLoading(true);
    try {
      const res = await fetch('/api/board');
      if (res.ok) {
        const data = await res.json();
        setBoardData(data);
      }
    } catch (err) {
      console.error('Failed to connect to Architecture Board API', err);
    } finally {
      setBoardLoading(false);
    }
    showToast('👥 Connected to Enterprise Architecture Governance Board');
  };

  const handleExportJson = () => {
    if (!scanData) return;
    const blob = new Blob([JSON.stringify(scanData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archguard-audit-${scanData.repoName}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Downloaded Architecture Audit JSON Report');
    setShowExportModal(false);
  };

  const handlePrintAuditReport = () => {
    window.print();
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setAppFlow('app');
    // cloudUser stays null — cloud vault requires separate authentication
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCloudUser(null); // also clear cloud auth on logout
    setAppFlow('auth');
    showToast('Logged out of architecture console');
  };

  // 1. Initial 2-second Animated Logo Transition Screen
  if (appFlow === 'splash') {
    return <SplashScreen onComplete={() => setAppFlow('auth')} />;
  }

  // 2. Enterprise Authentication & SSO Portal
  if (appFlow === 'auth') {
    return (
      <>
        {toastMessage && (
          <div className="toast">
            <span>🔔</span>
            <span>{toastMessage}</span>
          </div>
        )}
        <AuthPage onLogin={handleLogin} onShowToast={showToast} />
      </>
    );
  }

  // 3. Main Enterprise Architecture Platform
  return (
    <div className="app-shell" style={{ display: 'flex', height: '100vh', maxHeight: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-dark)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Universal Command Palette (Ctrl+K) */}
      <CommandPalette 
        isOpen={showCmdPalette}
        onClose={() => setShowCmdPalette(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onTriggerScan={() => handleTriggerScan()}
        onOpenExport={() => setShowExportModal(true)}
        onOpenBoard={handleOpenArchitectureBoard}
      />

      {/* Compliance Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div className="card-title">
                <span>📋</span>
                <span>Generate Executive Compliance Audit Report</span>
              </div>
              <button 
                className="btn-secondary" 
                style={{ padding: '4px 10px' }}
                onClick={() => setShowExportModal(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '20px' }}>
              Export an ISO/IEC 25010 aligned architectural compliance report summarizing boundary integrity, technical debt indices, and drift violations.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>TARGET REPOSITORY</span>
                <strong style={{ color: 'var(--text-primary)' }}>{scanData?.repoName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>SYSTEM HEALTH SCORE</span>
                <strong style={{ color: scanData?.health?.overallHealth < 80 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                  {scanData?.health?.overallHealth}/100
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>DRIFT VIOLATIONS</span>
                <strong style={{ color: 'var(--accent-rose)' }}>{scanData?.violations?.length} Violations</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ACCUMULATED DEBT</span>
                <strong style={{ color: 'var(--accent-purple)' }}>{scanData?.health?.architectureDebtIndex} hrs</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={handlePrintAuditReport}>
                🖨️ Print / Save as PDF
              </button>
              <button className="btn-primary" onClick={handleExportJson}>
                📥 Download JSON Audit Report
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Architecture Board Modal */}
      {showBoardModal && (
        <div className="modal-overlay" onClick={() => setShowBoardModal(false)}>
          <div className="modal-content" style={{ maxWidth: '800px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>👥</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                    Enterprise Architecture Governance Board (ARB)
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                    <span>Live Connection Active &bull; Quorum Met (4/4 Members Online)</span>
                  </div>
                </div>
              </div>
              <button 
                className="btn-secondary" 
                style={{ padding: '4px 10px' }}
                onClick={() => setShowBoardModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>System Under Review</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {boardData?.reviewStats?.repoName || scanData?.repoName || selectedRepo}
                </div>
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Health Score</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                  {boardData?.reviewStats?.overallHealth || scanData?.health?.overallHealth || 81}%
                </div>
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Drift Breaches</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '4px' }}>
                  {boardData?.reviewStats?.activeDrifts || scanData?.violations?.length || 3} Breaches
                </div>
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>Architecture Debt</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '4px' }}>
                  {boardData?.reviewStats?.debtHours || scanData?.health?.architectureDebtIndex || 33} hrs
                </div>
              </div>
            </div>

            {/* Board Members Roster */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Board Members &amp; Review Quorum
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
                {(boardData?.members || [
                  { name: 'Sarah Lin', role: 'Chief Architect (Chair)', status: 'ONLINE', avatar: 'SL' },
                  { name: 'Marcus Vance', role: 'Security Architect', status: 'ONLINE', avatar: 'MV' },
                  { name: 'Elena Rostova', role: 'VP Engineering', status: 'ONLINE', avatar: 'ER' },
                  { name: 'Alex Chen', role: 'Domain Architect', status: 'ONLINE', avatar: 'AC' }
                ]).map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-surface-elevated)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {m.avatar}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{m.name}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{m.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Architectural Drifts Requiring Board Decision */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Active Governance Review Agenda ({boardData?.agendaItems?.length || scanData?.violations?.length || 0} Items)
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Board Decision Required</span>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {(boardData?.agendaItems || []).map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`violation-badge ${item.severity === 'CRITICAL' ? 'badge-critical' : 'badge-high'}`} style={{ fontSize: '0.64rem', padding: '1px 6px', flexShrink: 0 }}>
                          {item.severity}
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.ruleId}: {item.message}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        From: <code>{item.source}</code> &rarr; <code>{item.target}</code>
                      </div>
                    </div>
                    <button 
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}
                      onClick={() => {
                        setShowBoardModal(false);
                        handleNavigateToCopilotWithQuery(`Analyze board agenda item ${item.ruleId}: ${item.message} between ${item.source} and ${item.target} and propose an architectural resolution.`);
                      }}
                    >
                      🤖 AI Solution
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap', borderTop: '1px solid var(--border-card)', paddingTop: '16px' }}>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowBoardModal(false);
                  setActiveTab('adrs');
                }}
              >
                📜 Manage Formal ADRs
              </button>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowBoardModal(false);
                  setActiveTab('prguard');
                }}
              >
                🛡️ PR Architecture Guard
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  handleTriggerScan();
                  setShowBoardModal(false);
                  showToast('⚡ Running Live Architecture Audit Scan...');
                }}
              >
                ⚡ Trigger Live Board Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        healthScore={scanData?.health?.overallHealth}
        violationCount={scanData?.violations?.length || 4}
        currentUser={currentUser}
        onLogout={handleLogout}
        cloudAuthenticated={!!cloudUser}
      />

      {/* Main Content Area */}
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100vh', maxHeight: '100vh', overflow: 'hidden', background: 'var(--bg-dark)', minWidth: 0 }}>
        {/* Topbar (Clean Light Theme with ArchGuard AI Content) */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="vault-title-wrap">
              <h1 className="vault-page-title">
                {activeTab === 'overview' ? 'Executive Dashboard' : 
                 activeTab === 'cloud-storage' ? 'Multi-Cloud Storage & Unified File Vault' :
                 activeTab === 'map' ? 'Architecture Map' :
                 activeTab === 'drift' ? 'Architecture Drift Detector' :
                 activeTab === 'evolution' ? 'Git Evolution Timeline' :
                 activeTab === 'sandbox' ? 'Refactoring Sandbox (What-If)' :
                 activeTab === 'matrix' ? 'Coupling Matrix (DSM)' :
                 activeTab === 'diagrams' ? 'Diagram Studio (C4 & Mermaid)' :
                 activeTab === 'domain-modeler' ? 'Domain Modeler (DDD Contexts)' :
                 activeTab === 'portfolio' ? 'Portfolio Architecture Benchmark' :
                 activeTab === 'security' ? 'Blast Radius & Architecture Hotspots' :
                 activeTab === 'fitness' ? 'Architecture Fitness Functions' :
                 activeTab === 'tests' ? 'Architecture Regression Testing' :
                 activeTab === 'rules' ? 'Architecture Policy & Rules' :
                 activeTab === 'adrs' ? 'Architecture Decision Records (ADR)' :
                 activeTab === 'linters' ? 'CI Linters & ArchUnit Rules' :
                 activeTab === 'prguard' ? 'PR Architecture Guard' :
                 activeTab === 'copilot' ? 'AI Architect Copilot' :
                 'Executive Dashboard'}
              </h1>
              <div className="vault-page-subtitle">
                ARCHGUARD ENTERPRISE CLOUD • {selectedRepo}
              </div>
            </div>
          </div>

          <div className="topbar-right vault-topbar-actions">

            {/* 1. Export Compliance Report (Green Pill Button) */}
            <button 
              className="btn-vault-export"
              onClick={() => setShowExportModal(true)}
              title="Generate and export ISO/IEC 25010 compliance audit report"
            >
              <span>📥</span>
              <span>Export Compliance Report</span>
            </button>

            {/* 2. Architecture Board (Soft Purple Pill Button) */}
            <button 
              className="btn-vault-pill-purple"
              onClick={handleOpenArchitectureBoard}
              title="Connect to Enterprise Architecture Review Board"
            >
              <span>👥</span>
              <span>Architecture Board</span>
            </button>

            {/* 3. AI Copilot Bot (Soft Cyan Pill Button) */}
            <button 
              className="btn-vault-pill-cyan"
              onClick={() => {
                setActiveTab('copilot');
                showToast('🤖 AI Architect Copilot Activated');
              }}
            >
              <span>🤖</span>
              <span>@archguard_copilot</span>
            </button>

            {/* 4. Run AST Scan (Dark Pill Button) */}
            <button 
              className="btn-vault-report"
              onClick={() => handleTriggerScan()}
              disabled={loading}
            >
              <span>⚡</span>
              <span>{loading ? 'Scanning AST...' : 'Run AST Scan'}</span>
            </button>

            {/* 5. Search Cmd+K Button */}
            <button 
              className="btn-vault-search"
              onClick={() => setShowCmdPalette(true)}
              title="Quick Jump (Press Ctrl+K or Cmd+K)"
            >
              <span>🔍</span>
              <span>Search</span>
              <kbd style={{ 
                background: 'var(--bg-card-hover)', 
                border: '1px solid var(--border-card)',
                padding: '1px 5px', 
                borderRadius: '4px', 
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)' 
              }}>
                ⌘K
              </kbd>
            </button>

            {/* 6. Theme Toggle (Sun/Moon) */}
            <button 
              className="btn-vault-icon-box"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? '☀️' : '🌙'}
            </button>

            {/* 7. Notification Bell with Interactive Dropdown Flyout */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button 
                className="btn-vault-icon-box"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
                aria-label="Toggle notifications"
              >
                <span>🔔</span>
                {unreadCount > 0 && (
                  <span className="notification-dot-badge">{unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown-menu">
                  <div className="notifications-header">
                    <div className="notifications-title">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="nav-badge-pill warning" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                          {unreadCount} Unread
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button 
                        type="button"
                        onClick={markAllAsRead}
                        className="notification-btn-clear"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="notifications-list">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`notification-item ${n.unread ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div style={{ fontSize: '1.2rem', marginTop: '2px' }}>
                          {n.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {n.title}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {n.time}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 6px' }}>
                            {n.description}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span className={`violation-badge ${n.severity === 'CRITICAL' ? 'badge-critical' : n.severity === 'SUCCESS' ? 'badge-high' : 'badge-medium'}`} style={{ fontSize: '0.64rem', padding: '1px 6px' }}>
                              {n.severity}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>
                              View details →
                            </span>
                          </div>
                        </div>
                        {n.unread && (
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', alignSelf: 'center', flexShrink: 0 }} />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="notification-footer">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('drift');
                        setShowNotifications(false);
                      }}
                      style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Open Architecture Drift Inspector &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* View Switcher */}
        {loading && !scanData ? (
          <div className="content-body" style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div className="pulse-dot" style={{ margin: '0 auto 16px', width: '14px', height: '14px' }}></div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Loading ARCHGUARD Platform...</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
              Parsing repository files, calculating dependency cycles, and computing 7-dimension health indices.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <DashboardOverview 
                scanData={scanData} 
                onNavigateTab={setActiveTab}
                onTriggerAICopilot={handleNavigateToCopilotWithQuery}
              />
            )}
            {activeTab === 'cloud-storage' && (
              cloudUser ? (
                <CloudDashboard
                  currentUser={cloudUser}
                  onShowToast={showToast}
                />
              ) : (
                <CloudAuthGate
                  onAuthenticated={(user) => setCloudUser(user)}
                  onShowToast={showToast}
                />
              )
            )}
            {activeTab === 'map' && (
              <ArchitectureMap 
                graphData={scanData?.graph} 
                violations={scanData?.violations} 
              />
            )}
            {activeTab === 'drift' && (
              <DriftDetector 
                violations={scanData?.violations || []}
                onNavigateToCopilot={handleNavigateToCopilotWithQuery}
                onShowToast={showToast}
              />
            )}
            {activeTab === 'sandbox' && (
              <RefactoringSandbox 
                scanData={scanData}
                onShowToast={showToast}
              />
            )}
            {activeTab === 'matrix' && (
              <CouplingMatrix 
                scanData={scanData}
                onShowToast={showToast}
              />
            )}
            {activeTab === 'diagrams' && (
              <DiagramStudio 
                scanData={scanData}
                onShowToast={showToast}
              />
            )}
            {activeTab === 'domain-modeler' && (
              <DomainModeler 
                onShowToast={showToast}
              />
            )}
            {activeTab === 'model' && (
              <ArchitectureModelEditor 
                onShowToast={showToast}
              />
            )}
            {activeTab === 'fitness' && (
              <FitnessFunctions 
                onShowToast={showToast}
              />
            )}
            {activeTab === 'tests' && (
              <ArchitectureTests 
                onShowToast={showToast}
                onNavigateTab={setActiveTab}
              />
            )}
            {activeTab === 'security' && (
              <SecurityCompliance 
                scanData={scanData}
                onShowToast={showToast}
              />
            )}
            {activeTab === 'portfolio' && (
              <PortfolioBenchmark 
                onSelectRepository={handleSelectRepository}
                onShowToast={showToast}
              />
            )}
            {activeTab === 'rules' && (
              <PolicyStudio 
                onShowToast={showToast}
              />
            )}
            {activeTab === 'linters' && (
              <LinterGenerator 
                onShowToast={showToast}
              />
            )}
            {activeTab === 'evolution' && (
              <TimeMachine 
                commitHistory={scanData?.commitHistory} 
              />
            )}
            {activeTab === 'adrs' && (
              <ADRManager 
                onShowToast={showToast}
              />
            )}
            {activeTab === 'prguard' && (
              <PRGuard 
                scanData={scanData}
                onShowToast={showToast}
              />
            )}
            {activeTab === 'copilot' && (
              <AICopilot 
                scanData={scanData}
                initialPrompt={copilotInitialQuery}
                onShowToast={showToast}
              />
            )}
            {(activeTab === 'repositories' || activeTab === 'upload-repo') && (
              <RepositoryManager 
                scanData={scanData}
                onScan={handleTriggerScan}
              />
            )}
            
            {/* Fallback for tabs not yet implemented in this phase */}
            {['overview', 'cloud-storage', 'map', 'drift', 'sandbox', 'matrix', 'diagrams', 'domain-modeler', 'security', 'fitness', 'tests', 'portfolio', 'rules', 'linters', 'adrs', 'prguard', 'copilot', 'evolution', 'repositories', 'upload-repo'].indexOf(activeTab) === -1 && (
              <div className="content-body" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <span style={{ fontSize: '3rem' }}>🚧</span>
                <h2 style={{ margin: '16px 0', color: 'var(--text-primary)' }}>Coming Soon</h2>
                <p style={{ color: 'var(--text-secondary)' }}>This module is scheduled for a future development phase.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
