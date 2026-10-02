/**
 * ARCHGUARD AI — Evidence-Grounded AI Architect Copilot Engine
 * 
 * Provides natural-language answers, violation explanations, and refactoring guidance
 * strictly grounded in the verified static analysis graph and evidence telemetry.
 */

export function queryAICopilot(queryText, scanData) {
  const query = queryText.toLowerCase();
  const { violations, health, graph, elements, dependencies } = scanData;

  // 1. Query about Health & Unhealthy Modules
  if (query.includes('health') || query.includes('unhealthy') || query.includes('score')) {
    const topViolations = violations.slice(0, 3);
    const evidenceList = topViolations.flatMap(v => v.evidence).join('\n• ');

    return {
      query: queryText,
      answer: `The system Architecture Health Score is **${health.overallHealth}/100** (Architecture Debt Index: **${health.architectureDebtIndex}**).\n\nThe main drivers lowering the score are:\n1. **${health.counts.criticalCount} Critical Violations** (such as circular dependencies)\n2. **${health.counts.highCount} High Layer Violations** (such as presentation layer directly accessing infrastructure).`,
      evidence: evidenceList || 'No critical evidence violations found.',
      recommendation: 'Prioritize resolving circular dependency cycles first to decouple modules, followed by introducing service interfaces between Presentation and Infrastructure.'
    };
  }

  // 2. Query about Circular Dependencies / Cycles
  if (query.includes('cycle') || query.includes('circular') || query.includes('loop')) {
    const cycleViolations = violations.filter(v => v.category === 'CIRCULAR_DEPENDENCY');
    if (cycleViolations.length === 0) {
      return {
        query: queryText,
        answer: 'No circular dependencies detected in the current architecture graph.',
        evidence: 'Graph is an Acyclic Directed Graph (DAG).',
        recommendation: 'Maintain acyclic module boundaries.'
      };
    }

    const firstCycle = cycleViolations[0];
    return {
      query: queryText,
      answer: `Detected **${cycleViolations.length} circular dependency loop(s)** in your domain architecture. ${firstCycle.actual}.`,
      evidence: firstCycle.evidence.join('\n• '),
      recommendation: `Apply the Dependency Inversion Principle (DIP). Extract common interface models into a shared domain contracts file or use event-driven messaging to decouple ${firstCycle.source} and ${firstCycle.target}.`
    };
  }

  // 3. Query about Coupling / God Components
  if (query.includes('coupling') || query.includes('god') || query.includes('hotspot')) {
    const godViolations = violations.filter(v => v.category === 'GOD_COMPONENT');
    return {
      query: queryText,
      answer: `Found **${godViolations.length} highly coupled component(s)** acting as architectural hotspots. Highly coupled modules increase regression risk during refactoring.`,
      evidence: godViolations.map(g => `Hotspot Component: ${g.source} (${g.actual})`).join('\n• '),
      recommendation: 'Decompose hotspot modules into smaller, single-responsibility services.'
    };
  }

  // 4. Default / General Architecture Query
  const sampleViolation = violations[0];
  return {
    query: queryText,
    answer: `ARCHGUARD AI analysis completed across **${elements.length} components** and **${dependencies.length} dependency edges**. Found **${violations.length} total architecture drift violations**.`,
    evidence: sampleViolation ? sampleViolation.evidence.join('\n• ') : 'Architecture clean.',
    recommendation: sampleViolation ? sampleViolation.recommendation : 'Continue monitoring pull requests for architectural drift.'
  };
}
