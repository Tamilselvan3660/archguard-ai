/**
 * ARCHGUARD AI — Advanced Blast Radius & Architectural Impact Engine
 * 
 * Computes direct, transitive, API, database, and test impact for any component
 * via graph traversal over the AST dependency graph.
 */

export function calculateBlastRadius(componentId, elements, dependencies, graph, violations = []) {
  const node = elements.find(e => e.id === componentId);
  if (!node) {
    return {
      error: `Component '${componentId}' not found in repository elements`
    };
  }

  // 1. Direct Dependents (Immediate incoming edges)
  const directDependents = [];
  dependencies.forEach(dep => {
    if (dep.target === componentId) {
      const srcElem = elements.find(e => e.id === dep.source);
      if (srcElem && !directDependents.some(d => d.id === srcElem.id)) {
        directDependents.push({
          id: srcElem.id,
          name: srcElem.name,
          layer: srcElem.layer,
          path: srcElem.path,
          importLine: dep.lineNumber || 1
        });
      }
    }
  });

  // 2. Transitive Dependents (BFS Traversal on Reverse Adjacency / InEdges)
  const visited = new Set([componentId]);
  const queue = [...directDependents.map(d => d.id)];
  const indirectDependents = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);

    if (current !== componentId && !directDependents.some(d => d.id === current)) {
      const elem = elements.find(e => e.id === current);
      if (elem) {
        indirectDependents.push({
          id: elem.id,
          name: elem.name,
          layer: elem.layer,
          path: elem.path
        });
      }
    }

    // Find who depends on current
    dependencies.forEach(dep => {
      if (dep.target === current && !visited.has(dep.source)) {
        queue.push(dep.source);
      }
    });
  }

  const allAffected = [...directDependents, ...indirectDependents];

  // 3. API Impact: Any presentation layer controller/route affected
  const apiImpact = allAffected.filter(d => 
    d.layer === 'presentation' || /controller|route|api|view/i.test(d.name)
  );

  // 4. Data / Storage Impact: Any infrastructure layer module affected
  const dataImpact = allAffected.filter(d => 
    d.layer === 'infrastructure' || /db|database|repository|dao|store|sql/i.test(d.name)
  );

  // 5. Test Impact: Inferred test modules that need re-running
  const testImpact = allAffected.map(d => ({
    name: `${d.name}.test.js`,
    targetModule: d.name,
    layer: d.layer
  }));
  testImpact.unshift({
    name: `${node.name}.test.js`,
    targetModule: node.name,
    layer: node.layer
  });

  // 6. Architectural Rules / Violations Impact
  const relatedViolations = violations.filter(v => 
    v.source === componentId || v.target === componentId ||
    allAffected.some(a => a.id === v.source || a.id === v.target)
  );

  // 7. Blast Radius Severity & Risk Score (0 - 100)
  const totalSystemNodes = Math.max(elements.length, 1);
  const impactRatio = (allAffected.length + 1) / totalSystemNodes;
  const isCoreDomain = node.layer === 'domain';
  
  let riskScore = Math.round(
    (impactRatio * 50) + 
    (directDependents.length * 5) + 
    (apiImpact.length * 6) + 
    (isCoreDomain ? 20 : 5)
  );
  riskScore = Math.min(Math.max(riskScore, 10), 99);

  let severity = 'LOW';
  if (riskScore >= 75) severity = 'CRITICAL';
  else if (riskScore >= 50) severity = 'HIGH';
  else if (riskScore >= 30) severity = 'MEDIUM';

  return {
    target: {
      id: node.id,
      name: node.name,
      layer: node.layer,
      path: node.path,
      lineCount: node.lineCount
    },
    riskScore,
    severity,
    impactSummary: {
      directCount: directDependents.length,
      indirectCount: indirectDependents.length,
      totalAffectedCount: allAffected.length,
      apiImpactCount: apiImpact.length,
      dataImpactCount: dataImpact.length,
      testImpactCount: testImpact.length,
      affectedRulesCount: relatedViolations.length
    },
    directDependents,
    indirectDependents,
    apiImpact,
    dataImpact,
    testImpact,
    relatedViolations,
    calculatedAt: new Date().toISOString()
  };
}

/**
 * Calculates blast radius for every element in the system and ranks them
 */
export function calculateSystemBlastRadiusRanking(elements, dependencies, graph, violations = []) {
  return elements.map(elem => {
    const radius = calculateBlastRadius(elem.id, elements, dependencies, graph, violations);
    return {
      id: elem.id,
      name: elem.name,
      layer: elem.layer,
      riskScore: radius.riskScore || 0,
      severity: radius.severity || 'LOW',
      directCount: radius.impactSummary?.directCount || 0,
      indirectCount: radius.impactSummary?.indirectCount || 0,
      totalAffected: radius.impactSummary?.totalAffectedCount || 0
    };
  }).sort((a, b) => b.riskScore - a.riskScore);
}
