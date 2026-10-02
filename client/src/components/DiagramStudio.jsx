import React, { useState } from 'react';

export default function DiagramStudio({ scanData, onShowToast }) {
  const [activeMode, setActiveMode] = useState('as-built'); // 'as-built', 'target', 'c4'

  const mermaidAsBuilt = `flowchart TD
    subgraph Presentation ["💻 Presentation Layer"]
      UC["UserController.ts"]
      OC["OrderController.ts"]
      PC["PaymentController.ts"]
    end

    subgraph Domain ["🏛️ Domain Layer"]
      US["UserService.ts"]
      OS["OrderService.ts"]
      PS["PaymentService.ts"]
      UM["UserModel.ts"]
    end

    subgraph Infrastructure ["🗄️ Infrastructure Layer"]
      DB["DatabaseRepository.ts"]
      IC["InfrastructureConfig.ts"]
    end

    %% Conforming Flows
    UC --> US
    OC --> OS
    PC --> PS
    US --> UM

    %% Drift Violations (Highlighted in Red / Purple)
    UC -.->|⚠️ DRIFT-001 Direct DB Access| DB
    US -.->|⚠️ DRIFT-002 Boundary Leak| IC
    PS <===>|⚠️ DRIFT-003 Circular Loop| OS

    classDef violation stroke:#f43f5e,stroke-width:2px,fill:#2b0e14;
    classDef cycle stroke:#a855f7,stroke-width:2px,fill:#240e2b;
    class UC,US,PS,OS violation;`;

  const mermaidTarget = `flowchart TD
    subgraph Presentation ["💻 Presentation Layer"]
      UC["UserController"]
      OC["OrderController"]
      PC["PaymentController"]
    end

    subgraph Application ["⚙️ Application Layer (Use Cases)"]
      UUC["GetUserProfileUseCase"]
      OUC["CreateOrderUseCase"]
      PUC["ProcessPaymentUseCase"]
      EB["DomainEventBus"]
    end

    subgraph Domain ["🏛️ Pure Domain Layer"]
      US["UserService"]
      OS["OrderService"]
      PS["PaymentService"]
      UM["UserEntity"]
      IPort["IRepositoryPort (Interface)"]
    end

    subgraph Infrastructure ["🗄️ Infrastructure Layer (Adapters)"]
      DB["PostgresRepositoryAdapter"]
      IC["EnvConfigAdapter"]
    end

    UC --> UUC
    OC --> OUC
    PC --> PUC

    UUC --> US
    OUC --> OS
    PUC --> PS

    %% Event-Driven Decoupling
    PS -.->|OrderCompletedEvent| EB
    EB -.->|Async Consumer| OS

    %% Dependency Inversion Principle (DIP)
    US --> IPort
    DB -.->|Implements| IPort`;

  const mermaidC4 = `C4Context
    title C4 System Context — eCommerce Enterprise Platform

    Person(customer, "Online Customer", "Purchases products and manages checkout.")
    
    System_Boundary(c1, "eCommerce Enterprise System") {
      Container(spa, "Web SPA Portal", "React, TypeScript", "Delivers client dashboard UI.")
      Container(api, "API Gateway / HTTP Controllers", "Express, Node.js", "Handles HTTP endpoints & auth routing.")
      Container(app_service, "Core Domain Services", "TypeScript Hexagonal", "Executes business logic and workflows.")
      ContainerDb(db, "PostgreSQL Database", "Relational SQL", "Stores customer profiles, orders, and payment records.")
    }

    Rel(customer, spa, "Uses", "HTTPS")
    Rel(spa, api, "Calls REST APIs", "JSON/HTTPS")
    Rel(api, app_service, "Invokes Use Cases", "In-Process")
    Rel(app_service, db, "Reads & Writes Data", "SQL / TCP 5432")`;

  const getCurrentMermaid = () => {
    if (activeMode === 'as-built') return mermaidAsBuilt;
    if (activeMode === 'target') return mermaidTarget;
    return mermaidC4;
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(getCurrentMermaid());
    if (onShowToast) onShowToast('Copied Mermaid Diagram Code to clipboard!');
  };

  const handleDownloadMermaid = () => {
    const blob = new Blob([getCurrentMermaid()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architecture-diagram-${activeMode}.mmd`;
    a.click();
    if (onShowToast) onShowToast(`Downloaded architecture-diagram-${activeMode}.mmd!`);
  };

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Interactive Architecture Diagram Studio</h1>
          <div className="page-subtitle">
            Generate and export Mermaid.js and C4 model diagrams representing as-built drift vs target clean architecture.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={activeMode === 'as-built' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveMode('as-built')}
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            ⚠️ As-Built Reality (with Drift)
          </button>
          <button 
            className={activeMode === 'target' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveMode('target')}
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            ✨ Target Clean Architecture
          </button>
          <button 
            className={activeMode === 'c4' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveMode('c4')}
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            🏛️ C4 System Context
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' }}>
        {/* Visual Diagram Canvas */}
        <div className="diagram-canvas-box">
          <div className="card-header" style={{ marginBottom: '14px' }}>
            <div className="card-title">
              <span>🗺️</span>
              <span>
                {activeMode === 'as-built' ? 'As-Built Dependency Topology (AST Extracted)' :
                 activeMode === 'target' ? 'Target Hexagonal & Event-Driven Architecture' :
                 'C4 Enterprise Context Model'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={handleCopyCode}>
                📋 Copy Code
              </button>
              <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '4px 12px' }} onClick={handleDownloadMermaid}>
                📥 Download .mmd
              </button>
            </div>
          </div>

          {/* Interactive Flow Visualizer Representation */}
          <div className="diagram-viewport">
            {activeMode === 'as-built' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', maxWidth: '640px' }}>
                {/* Layer 1: Presentation */}
                <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                    💻 PRESENTATION LAYER (HTTP CONTROLLERS)
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, background: 'rgba(244,63,94,0.12)', border: '1px solid var(--accent-rose)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>UserController</strong>
                      <div style={{ fontSize: '0.68rem', color: 'var(--accent-rose)', fontWeight: 700, marginTop: '2px' }}>⚠️ Direct DB Access</div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-card)', padding: '10px', borderRadius: '6px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>OrderController</strong>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>Conforming</div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-card)', padding: '10px', borderRadius: '6px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>PaymentController</strong>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>Conforming</div>
                    </div>
                  </div>
                </div>

                {/* Layer Flow Arrows */}
                <div style={{ display: 'flex', justifyContent: 'space-around', color: 'var(--accent-cyan)', fontSize: '1.2rem' }}>
                  <span>↓ clean</span>
                  <span>↓ clean</span>
                  <span>↓ clean</span>
                </div>

                {/* Layer 2: Domain */}
                <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                    🏛️ DOMAIN LAYER (BUSINESS SERVICES & ENTITIES)
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, background: 'rgba(244,63,94,0.12)', border: '1px solid var(--accent-rose)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>UserService</strong>
                      <div style={{ fontSize: '0.68rem', color: 'var(--accent-rose)', fontWeight: 700, marginTop: '2px' }}>⚠️ Infra Coupled</div>
                    </div>
                    <div style={{ flex: 2, background: 'rgba(168,85,247,0.12)', border: '1px solid var(--accent-purple)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>PaymentService</strong>
                        <span style={{ color: 'var(--accent-purple)', fontWeight: 800 }}>⇄</span>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>OrderService</strong>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--accent-purple)', fontWeight: 700, marginTop: '2px' }}>⚠️ Circular Dependency Loop</div>
                    </div>
                  </div>
                </div>

                {/* Direct Leak Arrow to Infrastructure */}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-rose)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                  <span>❌ UserController directly calls DatabaseRepository ───────────────────┐</span>
                </div>

                {/* Layer 3: Infrastructure */}
                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                    🗄️ INFRASTRUCTURE LAYER (PERSISTENCE & CONFIG)
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-card)', padding: '10px', borderRadius: '6px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>DatabaseRepository</strong>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>PostgreSQL Client</div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-card)', padding: '10px', borderRadius: '6px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>InfrastructureConfig</strong>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>Env Secrets</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeMode === 'target' && (
              <div style={{ textAlign: 'center', width: '100%', maxWidth: '600px' }}>
                <div style={{ 
                  background: 'rgba(16, 185, 129, 0.08)', 
                  border: '1px solid rgba(16, 185, 129, 0.3)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '24px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '8px' }}>
                    ✨ Clean Hexagonal Architecture (Ports & Adapters)
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6' }}>
                    Presentation controllers communicate exclusively through Application Layer Use Cases. Domain layer utilizes <code>IRepositoryPort</code> interfaces, with Postgres implementations injected via Dependency Inversion. Circular loops are eliminated via Domain Event pub/sub.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '0.8rem' }}>
                  <div style={{ background: 'rgba(56,189,248,0.1)', padding: '12px', borderRadius: '4px', color: 'var(--accent-cyan)' }}>
                    <strong>Presentation</strong>
                    <div>HTTP Only</div>
                  </div>
                  <div style={{ background: 'rgba(168,85,247,0.1)', padding: '12px', borderRadius: '4px', color: 'var(--accent-purple)' }}>
                    <strong>Application</strong>
                    <div>Use Cases</div>
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.1)', padding: '12px', borderRadius: '4px', color: 'var(--accent-emerald)' }}>
                    <strong>Pure Domain</strong>
                    <div>No Infra Deps</div>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.1)', padding: '12px', borderRadius: '4px', color: 'var(--accent-amber)' }}>
                    <strong>Adapters</strong>
                    <div>PostgreSQL</div>
                  </div>
                </div>
              </div>
            )}

            {activeMode === 'c4' && (
              <div style={{ width: '100%', maxWidth: '580px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid var(--accent-cyan)', padding: '16px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>Customer / Web Browser</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SPA Client on Port 5173</div>
                </div>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↓ HTTPS / JSON</div>
                <div style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid var(--accent-purple)', padding: '16px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <strong style={{ color: 'var(--accent-purple)', fontSize: '0.95rem' }}>ARCHGUARD & API Gateway Container</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Node.js / Express Server on Port 3001</div>
                </div>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↓ SQL Connection</div>
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid var(--accent-amber)', padding: '16px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <strong style={{ color: 'var(--accent-amber)', fontSize: '0.95rem' }}>PostgreSQL 16 Database</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Relational Storage on Port 5432</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mermaid Code Inspector */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title">
              <span>💻</span>
              <span>Mermaid.js Source</span>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '12px' }}>
            Copy and paste this definition into GitHub Markdown, Notion, or any Mermaid-compatible documentation tool.
          </p>

          <pre className="code-box" style={{ flex: 1, minHeight: '340px', fontSize: '0.76rem', color: 'var(--accent-cyan)' }}>
            {getCurrentMermaid()}
          </pre>
        </div>
      </div>
    </div>
  );
}
