/**
 * ARCHGUARD AI — Architecture Health & Debt Calculator
 * 
 * Computes transparent, explainable 0-100 Architecture Health Scores 
 * and Architecture Debt Indices grounded in static analysis metrics.
 */

export function calculateArchitectureHealth(elements, dependencies, violations, graph) {
  const totalElements = elements.length || 1;
  const couplingMetrics = graph.getCouplingMetrics();
  
  // Count violation severities
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  violations.forEach((v) => {
    if (v.severity === 'CRITICAL') criticalCount++;
    else if (v.severity === 'HIGH') highCount++;
    else if (v.severity === 'MEDIUM') mediumCount++;
    else lowCount++;
  });

  // 1. Layer Integrity Score (100 - penalties for layer breaches)
  const layerViolations = violations.filter(v => v.category === 'LAYER_VIOLATION').length;
  const layerIntegrity = Math.max(0, 100 - layerViolations * 18);

  // 2. Cycle Safety Score (100 - penalties for circular dependencies)
  const cycleViolations = violations.filter(v => v.category === 'CIRCULAR_DEPENDENCY').length;
  const cycleSafety = Math.max(0, 100 - cycleViolations * 25);

  // 3. Boundary Safety Score
  const boundaryViolations = violations.filter(v => v.category === 'BOUNDARY_VIOLATION').length;
  const boundarySafety = Math.max(0, 100 - boundaryViolations * 15);

  // 4. Coupling Score (based on average instability)
  let totalInstability = 0;
  Object.values(couplingMetrics).forEach(m => totalInstability += m.instability);
  const avgInstability = totalInstability / totalElements;
  const coupling = Math.round(Math.max(40, 100 - avgInstability * 40));

  // 5. Cohesion & Hygiene
  const godComponents = Object.values(couplingMetrics).filter(m => m.isGodComponent).length;
  const cohesion = Math.max(0, 100 - godComponents * 12);
  const dependencyHygiene = Math.max(50, Math.round(100 - (dependencies.length / totalElements) * 10));

  // 6. Drift Stability
  const totalPenalty = criticalCount * 20 + highCount * 12 + mediumCount * 6 + lowCount * 2;
  const driftStability = Math.max(0, 100 - Math.round(totalPenalty / 1.5));

  // Overall Weighted Health Score
  const overallHealth = Math.round(
    layerIntegrity * 0.25 +
    cycleSafety * 0.25 +
    boundarySafety * 0.15 +
    coupling * 0.15 +
    cohesion * 0.10 +
    driftStability * 0.10
  );

  // Architecture Debt Index (Points)
  const debtIndex = criticalCount * 10 + highCount * 5 + mediumCount * 2 + lowCount * 1 + cycleViolations * 8;

  return {
    overallHealth,
    architectureDebtIndex: debtIndex,
    metrics: {
      layerIntegrity,
      coupling,
      cohesion,
      cycleSafety,
      boundarySafety,
      dependencyHygiene,
      driftStability
    },
    counts: {
      totalElements,
      totalDependencies: dependencies.length,
      totalViolations: violations.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      cycleCount: cycleViolations
    }
  };
}
