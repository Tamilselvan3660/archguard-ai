import React, { useState } from 'react';

export default function PRGuard({ scanData, onShowToast }) {
  const presets = [
    {
      id: 'db-breach',
      name: '⚠️ Breach: Presentation imports Database',
      title: 'PR #104 — Refactor Payment Gateway with direct DB query',
      diff: `// File: src/presentation/PaymentController.ts
import { Request, Response } from 'express';
+ import { DatabaseRepository } from '../infrastructure/DatabaseRepository';

export class PaymentController {
+ private db = new DatabaseRepository();
  async handle(req: Request, res: Response) {
+   return this.db.query('SELECT * FROM payments WHERE id = $1', [req.params.id]);
  }
}`
    },
    {
      id: 'cycle-breach',
      name: '🔄 Breach: Cyclic Domain Dependency Loop',
      title: 'PR #108 — Cross-call OrderService inside PaymentService',
      diff: `// File: src/domain/PaymentService.ts
+ import { OrderService } from './OrderService';

export class PaymentService {
+ private orderService = new OrderService();
  verifyPayment(orderId: string) {
+   return this.orderService.getOrder(orderId);
  }
}`
    },
    {
      id: 'clean-pattern',
      name: '✅ Compliant: Use Application Service Facade',
      title: 'PR #112 — Payment processing via Application Layer Facade',
      diff: `// File: src/presentation/PaymentController.ts
import { Request, Response } from 'express';
+ import { ProcessPaymentUseCase } from '../application/ProcessPaymentUseCase';

export class PaymentController {
+ constructor(private useCase: ProcessPaymentUseCase) {}
  async handle(req: Request, res: Response) {
+   const result = await this.useCase.execute(req.body);
+   return res.json(result);
  }
}`
    }
  ];

  const [activePreset, setActivePreset] = useState(presets[0]);
  const [prTitle, setPrTitle] = useState(presets[0].title);
  const [prSource, setPrSource] = useState(presets[0].diff);
  const [analyzed, setAnalyzed] = useState(true);

  const handleSelectPreset = (p) => {
    setActivePreset(p);
    setPrTitle(p.title);
    setPrSource(p.diff);
    setAnalyzed(true);
  };

  const isCompliant = prSource.includes('ProcessPaymentUseCase') && !prSource.includes('DatabaseRepository') && !prSource.includes('OrderService');

  const handleCopyPrComment = () => {
    const comment = `### 🛡️ ARCHGUARD AI — Architecture CI Check Results
${isCompliant 
  ? '✅ **ALL ARCHITECTURAL CONSTRAINTS SATISFIED** (Health Score: 100/100)' 
  : '❌ **MERGE BLOCKED — ARCHITECTURE DRIFT DETECTED**\n- **Violation**: [DRIFT-PR-01] Layer Isolation Breach\n- **Rule**: `RULE-001` (Presentation cannot import Infrastructure)\n- **Remediation**: Route data access through an Application Service Use Case.'}

*Evaluated automatically by ArchGuard AI AST Engine.*`;

    navigator.clipboard?.writeText(comment);
    if (onShowToast) onShowToast('Copied PR Review Comment to clipboard!');
  };

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pull Request Architecture Guard</h1>
          <div className="page-subtitle">
            Simulate CI/CD GitHub Actions / GitLab CI pipeline gatekeeper blocking architecture drift before merging into main.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {presets.map(p => (
            <button
              key={p.id}
              className={activePreset.id === p.id ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              onClick={() => handleSelectPreset(p)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '24px' }}>
        {/* PR Simulator Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>🔀</span>
              <span>Pull Request Diff Simulator</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              CI/CD Pipeline: GitHub Actions
            </span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
              Pull Request Title
            </label>
            <input 
              type="text" 
              className="repo-selector" 
              style={{ width: '100%' }}
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Incoming Code Diff (Unified format)
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                AST Inspector Active
              </span>
            </div>
            <textarea 
              className="code-box" 
              style={{ width: '100%', minHeight: '190px', fontFamily: 'var(--font-mono)', lineHeight: '1.5' }}
              value={prSource}
              onChange={(e) => {
                setPrSource(e.target.value);
                setAnalyzed(false);
              }}
            />
          </div>

          <button 
            className="btn-primary" 
            onClick={() => setAnalyzed(true)} 
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
          >
            🛡️ Evaluate Diff Against Architecture Rules
          </button>
        </div>

        {/* PR Check Output */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title">
              <span>📋</span>
              <span>CI/CD Gatekeeper Status</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: isCompliant ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {isCompliant ? 'EXIT 0 (PASS)' : 'EXIT 1 (FAILED)'}
            </span>
          </div>

          {analyzed ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Verdict Banner */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: '16px', 
                padding: '14px 18px', 
                background: isCompliant ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', 
                border: `1px solid ${isCompliant ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`, 
                borderRadius: 'var(--radius-sm)' 
              }}>
                <div>
                  <strong style={{ color: isCompliant ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{isCompliant ? '✅' : '❌'}</span>
                    <span>{isCompliant ? 'STATUS: APPROVED' : 'STATUS: MERGE BLOCKED'}</span>
                  </strong>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {isCompliant 
                      ? 'Zero architectural boundary breaches detected. Ready to merge.' 
                      : '1 Critical Layer Isolation Breach detected by AST Engine.'}
                  </div>
                </div>

                <span className={`violation-badge ${isCompliant ? 'badge-medium' : 'badge-critical'}`}>
                  {isCompliant ? 'RISK: LOW' : 'RISK: CRITICAL'}
                </span>
              </div>

              {/* Specific finding */}
              {!isCompliant ? (
                <div className="violation-card" style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '6px', fontSize: '0.96rem' }}>
                    [DRIFT-PR-01] Presentation Layer &rarr; Infrastructure Leak
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    The proposed change introduces a direct dependency link from presentation controller to infrastructure database repository, violating governance rule <code style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>RULE-001</code>.
                  </p>

                  <div className="code-box" style={{ marginTop: '12px', fontSize: '0.78rem' }}>
                    + import &#123; DatabaseRepository &#125; from '../infrastructure/DatabaseRepository';
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--accent-amber)', marginTop: '12px', background: 'rgba(245,158,11,0.08)', padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.2)' }}>
                    💡 <strong>Action Required:</strong> Inject an Application Service Use Case instead of instantiating the database connector directly.
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-sm)', padding: '20px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '6px' }}>
                    ✨ Clean Architecture Conformance
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    The proposed PR utilizes clean hexagonal orchestration via <code>ProcessPaymentUseCase</code> in the Application layer, keeping presentation controllers isolated from storage details.
                  </p>
                </div>
              )}

              {/* Bot PR Comment Action */}
              <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                <button 
                  className="btn-secondary" 
                  onClick={handleCopyPrComment}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  📋 Copy Markdown Bot Review Comment for GitHub PR
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 16px' }}>
              Click "Evaluate Diff" to run the PR Guard analysis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
