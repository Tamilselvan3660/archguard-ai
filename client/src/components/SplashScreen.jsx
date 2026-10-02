import React, { useEffect } from 'react';

export default function SplashScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000); // Exactly 2 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="splash-container">
      <div className="splash-content">
        <div className="splash-logo-shield">
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
      </div>
    </div>
  );
}
