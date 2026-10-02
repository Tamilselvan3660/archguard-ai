import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ARCHGUARD Global Interceptor:', error, errorInfo);
  }

  handleClearAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: '#050811',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', -apple-system, sans-serif",
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '540px',
            width: '100%',
            background: '#0d1322',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            padding: '36px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3.2rem', marginBottom: '16px' }}>🛡️</div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 10px', color: '#38bdf8' }}>
              ARCHGUARD AI Recovery
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 20px', lineHeight: '1.5' }}>
              A client-side initialization anomaly occurred. ARCHGUARD intercepted the event to preserve platform state.
            </p>
            {this.state.error && (
              <div style={{
                background: '#070b14',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #334155',
                color: '#f87171',
                fontSize: '0.78rem',
                textAlign: 'left',
                fontFamily: 'monospace',
                overflowX: 'auto',
                marginBottom: '20px',
                maxHeight: '100px'
              }}>
                {this.state.error.toString()}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                🔄 Refresh Portal
              </button>
              <button
                onClick={this.handleClearAndReload}
                style={{
                  background: '#1e293b',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  padding: '10px 22px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                🧹 Reset Session & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
