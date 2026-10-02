import React, { useState } from 'react';

export default function RefactoringSandbox({ scanData, onShowToast }) {
  const [refactorings, setRefactorings] = useState([
    {
      id: 'event-bus',
      title: 'Decouple PaymentService & OrderService via Domain Events',
      target: 'DRIFT-003 (Circular Dependency)',
      benefit: '+9 Health Pts • -15h Debt',
      description: 'Replace direct reciprocal class instantiation between PaymentService and OrderService with asynchronous event publishing (e.g. OrderCreatedEvent, PaymentProcessedEvent).',
      pointsDelta: 9,
      debtDelta: 15,
      resolvedViolationId: 'DRIFT-003',
      enabled: false,
      codeBefore: `// PaymentService.ts
import { OrderService } from './OrderService';
export class PaymentService {
  private orders = new OrderService();
}`,
      codeAfter: `// PaymentService.ts
import { EventPublisher } from '../application/EventPublisher';
export class PaymentService {
  constructor(private bus: EventPublisher) {}
  publishPaymentCompleted(event: PaymentCompletedEvent) {
    this.bus.emit(event);
  }
}`
    },
    {
      id: 'app-service',
      title: 'Extract Application Service Facade for UserController',
      target: 'DRIFT-001 (Presentation Layer Breach)',
      benefit: '+5 Health Pts • -10h Debt',
      description: 'Isolate UserController from direct DatabaseRepository SQL querying by creating GetUserProfileUseCase in the Application layer.',
      pointsDelta: 5,
      debtDelta: 10,
      resolvedViolationId: 'DRIFT-001',
      enabled: false,
      codeBefore: `// UserController.ts
import { DatabaseRepository } from '../infrastructure/DatabaseRepository';
export class UserController {
  private db = new DatabaseRepository();
}`,
      codeAfter: `// UserController.ts
import { GetUserProfileUseCase } from '../application/GetUserProfileUseCase';
export class UserController {
  constructor(private getUserProfile: GetUserProfileUseCase) {}
}`
    },
    {
      id: 'infra-interface',
      title: 'Invert InfrastructureConfig dependency via Domain Interface',
      target: 'DRIFT-002 (Domain Boundary Leak)',
      benefit: '+4 Health Pts • -8h Debt',
      description: 'Apply Dependency Inversion Principle (DIP). Define IConfigProvider interface inside the Domain layer, with InfrastructureConfig implementing it from infrastructure.',
      pointsDelta: 4,
      debtDelta: 8,
      resolvedViolationId: 'DRIFT-002',
      enabled: false,
      codeBefore: `// UserService.ts
import { InfrastructureConfig } from '../infrastructure/InfrastructureConfig';`,
      codeAfter: `// UserService.ts
import { IConfigProvider } from './IConfigProvider'; // Domain Port`
    }
  ]);

  const toggleRefactoring = (id) => {
    setRefactorings(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const baselineHealth = scanData?.health?.overallHealth || 81;
  const baselineDebt = scanData?.health?.architectureDebtIndex || 33;
  const baselineViolations = scanData?.violations?.length || 3;

  const addedPoints = refactorings.filter(r => r.enabled).reduce((acc, r) => acc + r.pointsDelta, 0);
  const reducedDebt = refactorings.filter(r => r.enabled).reduce((acc, r) => acc + r.debtDelta, 0);
  const resolvedCount = refactorings.filter(r => r.enabled).length;

  const projectedHealth = Math.min(100, baselineHealth + addedPoints);
  const projectedDebt = Math.max(0, baselineDebt - reducedDebt);
  const projectedViolations = Math.max(0, baselineViolations - resolvedCount);

  const handleExportRoadmap = () => {
    const activePlans = refactorings.filter(r => r.enabled);
    if (activePlans.length === 0) {
      if (onShowToast) onShowToast('⚠️ Enable at least one refactoring in the sandbox first!');
      return;
    }

    const md = `# ARCHGUARD AI — Software Architecture Refactoring Roadmap
Target System: ${scanData?.repoName || 'sample-ecommerce'}
Projected Health: ${projectedHealth}/100 (From baseline: ${baselineHealth}/100)
Projected Debt Reduction: -${reducedDebt} engineering hours

## Active Planned Refactorings (${activePlans.length})

${activePlans.map((p, i) => `### ${i + 1}. ${p.title}
- **Resolves**: ${p.target}
- **Impact**: +${p.pointsDelta} Health Score pts, -${p.debtDelta}h Tech Debt
- **Description**: ${p.description}

\`\`\`typescript
// Before
${p.codeBefore}

// After Refactoring
${p.codeAfter}
\`\`\`
`).join('\n---\n\n')}

*Generated automatically by ARCHGUARD AI Refactoring Sandbox Simulator.*`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `REFACTORING_ROADMAP_${scanData?.repoName || 'system'}.md`;
    a.click();
    if (onShowToast) onShowToast('Downloaded REFACTORING_ROADMAP.md!');
  };

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">"What-If" Architecture Refactoring Sandbox</h1>
          <div className="page-subtitle">
            Simulate decoupled designs and calculate real-time projected health score gains before modifying production code.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => setRefactorings(prev => prev.map(r => ({ ...r, enabled: true })))}>
            ⚡ Simulate All (100% Clean)
          </button>
          <button className="btn-secondary" onClick={() => setRefactorings(prev => prev.map(r => ({ ...r, enabled: false })))}>
            Reset to Baseline
          </button>
          <button className="btn-primary" onClick={handleExportRoadmap}>
            📥 Export Migration Roadmap (.md)
          </button>
        </div>
      </div>

      {/* Real-time Projected Health vs Baseline Comparison Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {/* Health Score Projected */}
        <div className="card" style={{ borderLeft: '4px solid var(--accent-emerald)', background: 'radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.08), transparent 70%), var(--bg-card)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            PROJECTED HEALTH SCORE
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: projectedHealth >= 90 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
              {projectedHealth}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span>
            {addedPoints > 0 && (
              <span style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                ▲ +{addedPoints} pts
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Baseline: <strong>{baselineHealth}/100</strong>
          </div>
        </div>

        {/* Technical Debt Projected */}
        <div className="card" style={{ borderLeft: '4px solid var(--accent-purple)', background: 'radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.08), transparent 70%), var(--bg-card)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            PROJECTED ARCHITECTURE DEBT
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--accent-purple)' }}>
              {projectedDebt}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>hrs</span>
            {reducedDebt > 0 && (
              <span style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                ▼ -{reducedDebt} hrs
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Baseline: <strong>{baselineDebt} engineering hours</strong>
          </div>
        </div>

        {/* Violations Projected */}
        <div className="card" style={{ borderLeft: '4px solid var(--accent-rose)', background: 'radial-gradient(circle at 10% 20%, rgba(244, 63, 94, 0.08), transparent 70%), var(--bg-card)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            REMAINING DRIFT VIOLATIONS
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: projectedViolations === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {projectedViolations}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>active</span>
            {resolvedCount > 0 && (
              <span style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                {resolvedCount} resolved
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Baseline: <strong>{baselineViolations} breaches</strong>
          </div>
        </div>
      </div>

      {/* Interactive Refactoring Options List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {refactorings.map(r => (
          <div 
            key={r.id} 
            className={`sandbox-card ${r.enabled ? 'active' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <label className="switch-toggle">
                  <input 
                    type="checkbox" 
                    checked={r.enabled} 
                    onChange={() => toggleRefactoring(r.id)} 
                  />
                  <span className="slider-round"></span>
                </label>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{r.title}</strong>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      background: 'rgba(56, 189, 248, 0.1)', 
                      color: 'var(--accent-cyan)', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)' 
                    }}>
                      {r.target}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px', lineHeight: '1.5' }}>
                    {r.description}
                  </p>
                </div>
              </div>

              <span style={{ 
                fontSize: '0.8rem', 
                fontWeight: 700, 
                color: r.enabled ? 'var(--accent-emerald)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
                background: r.enabled ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface-elevated)',
                border: `1px solid ${r.enabled ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-card)'}`,
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)'
              }}>
                {r.benefit}
              </span>
            </div>

            {/* Code Diff Preview Accordion */}
            {r.enabled && (
              <div style={{ 
                marginTop: '16px', 
                paddingTop: '16px', 
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--accent-rose)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    CURRENT IMPLEMENTATION (BREACH)
                  </div>
                  <pre className="code-box" style={{ color: '#f87171' }}>
                    {r.codeBefore}
                  </pre>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--accent-emerald)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    PROJECTED REFACTORED ARCHITECTURE
                  </div>
                  <pre className="code-box" style={{ color: '#34d399' }}>
                    {r.codeAfter}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
