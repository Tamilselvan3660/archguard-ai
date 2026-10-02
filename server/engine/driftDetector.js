/**
 * ARCHGUARD AI — Architecture Drift & Violation Detector
 * 
 * Compares Intended Architecture Specs against Implemented Dependency Graph,
 * identifying Layer Violations, Circular Dependencies, Boundary Breaches, and God Components.
 */

export function detectArchitectureDrift(elements, dependencies, graph, intendedSpec) {
  const violations = [];
  const cycles = graph.findCycles();
  const couplingMap = graph.getCouplingMetrics();

  // 1. Evaluate Explicit Intended Rules
  if (intendedSpec && intendedSpec.rules) {
    intendedSpec.rules.forEach((rule) => {
      if (rule.category === 'LAYER_VIOLATION' || rule.category === 'BOUNDARY_VIOLATION') {
        dependencies.forEach((dep) => {
          const sourceElem = elements.find(e => e.id === dep.source);
          const targetElem = elements.find(e => e.id === dep.target);

          if (sourceElem && targetElem) {
            const isSourceForbidden = rule.source === sourceElem.layer;
            const isTargetForbidden = rule.forbidden.includes(targetElem.layer);

            if (isSourceForbidden && isTargetForbidden) {
              violations.push({
                id: `DRIFT-${String(violations.length + 1).padStart(3, '0')}`,
                severity: rule.severity || 'HIGH',
                category: rule.category,
                ruleName: rule.name,
                source: dep.source,
                target: dep.target,
                expected: `${sourceElem.layer} -> allowed dependencies`,
                actual: `${sourceElem.layer} (${sourceElem.name}) -> ${targetElem.layer} (${targetElem.name})`,
                evidence: [
                  `${dep.source}:${dep.lineNumber || 1} -> imports '${dep.rawImport}'`,
                  `Target File: ${dep.target}`
                ],
                impact: `Bypasses architecture boundary governance. Increases coupling and breaks separation of concerns between ${sourceElem.layer} and ${targetElem.layer}.`,
                recommendation: `Remove direct reference from ${sourceElem.name} to ${targetElem.name}. Introduce a service abstraction or dependency inversion interface.`
              });
            }
          }
        });
      }
    });
  }

  // 2. Evaluate Circular Dependency Violations (Tarjan's SCC output)
  cycles.forEach((cycleNodes) => {
    violations.push({
      id: `DRIFT-${String(violations.length + 1).padStart(3, '0')}`,
      severity: 'CRITICAL',
      category: 'CIRCULAR_DEPENDENCY',
      ruleName: 'no-cyclic-dependencies',
      source: cycleNodes[0],
      target: cycleNodes[1],
      expected: 'Acyclic Directed Dependency Graph (DAG)',
      actual: `Cycle loop detected: ${cycleNodes.join(' <-> ')}`,
      evidence: cycleNodes.map(n => `Cyclic Node: ${n}`),
      impact: 'Prevents independent testing and compilation. Causes memory leaks, recursion stack overflows, and tight architectural coupling.',
      recommendation: 'Break cycle by extracting shared domain models into a common interface module or using asynchronous domain event dispatching.'
    });
  });

  // 3. Evaluate God / Hub Component Anti-patterns
  for (const [nodeId, metrics] of Object.entries(couplingMap)) {
    if (metrics.isGodComponent) {
      violations.push({
        id: `DRIFT-${String(violations.length + 1).padStart(3, '0')}`,
        severity: 'MEDIUM',
        category: 'GOD_COMPONENT',
        ruleName: 'max-coupling-threshold',
        source: nodeId,
        target: 'System',
        expected: 'Efferent Coupling < 5, Afferent Coupling < 8',
        actual: `Efferent Coupling: ${metrics.efferentCoupling}, Afferent Coupling: ${metrics.afferentCoupling}`,
        evidence: [`God Component Path: ${nodeId}`],
        impact: 'High risk single point of failure. Modifying this component risks breaking multiple dependent modules.',
        recommendation: 'Split module responsibilities using Single Responsibility Principle (SRP) into smaller micro-services or adapters.'
      });
    }
  }

  return violations;
}
