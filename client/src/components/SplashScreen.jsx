import React, { useEffect, useRef } from 'react';

export default function SplashScreen({ onComplete }) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleSkip = () => {
    if (onCompleteRef.current) {
      onCompleteRef.current();
    }
  };

  return (
    <div 
      className="splash-container" 
      onClick={handleSkip} 
      style={{ cursor: 'pointer' }}
      title="Click to enter platform immediately"
    >
      <div className="splash-content" onClick={(e) => e.stopPropagation()}>
        <div className="splash-logo-shield" onClick={handleSkip} style={{ cursor: 'pointer' }}>
          🛡️
        </div>

        <h1 className="splash-title">
          ARCHGUARD<span>.AI</span>
        </h1>

        <div className="splash-subtitle">
          Enterprise Software Architecture Drift & Governance Cloud
        </div>

        <div className="splash-bar-track">
          <div className="splash-bar-fill"></div>
        </div>

        <div className="splash-loading-text">
          <span className="pulse-dot"></span>
          <span>Initializing AST parser & dependency graph engine...</span>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          style={{
            marginTop: '24px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#94a3b8',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
          Enter Platform Now &rarr;
        </button>
      </div>
    </div>
  );
}
