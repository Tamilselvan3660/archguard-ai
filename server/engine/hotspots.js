/**
 * ARCHGUARD AI — Architecture Hotspot Detection Engine
 * 
 * Automatically identifies structural hotspots based on fan-in, fan-out,
 * coupling, violations, complexity, and blast radius.
 */

import { calculateBlastRadius } from './blastRadius.js';

export function detectArchitectureHotspots(elements, dependencies, graph, violations = []) {
  const couplingMap = graph.getCouplingMetrics();

  const hotspots = elements.map(elem => {
    const metrics = couplingMap[elem.id] || { afferentCoupling: 0, efferentCoupling: 0, instability: 0 };
    const fanIn = metrics.afferentCoupling;
    const fanOut = metrics.efferentCoupling;
    const coupling = Math.round(((fanIn + fanOut) / Math.max(elements.length, 1)) * 100) / 100;
    
    // Violation count on this element
    const elemViolations = violations.filter(v => v.source === elem.id || v.target === elem.id);
    
    // Blast radius calculation
    const blast = calculateBlastRadius(elem.id, elements, dependencies, graph, violations);
    const blastAffected = blast.impactSummary?.totalAffectedCount || 0;
    
    // Simulated churn based on complexity and position
    const loc = elem.lineCount || 120;
    const estimatedChurn = Math.round((fanIn * 4) + (loc / 15) + (elemViolations.length * 7));

    // Hotspot score formula (0 - 100)
    let hotspotScore = Math.round(
      (fanIn * 3.5) +
      (fanOut * 3.0) +
      (elemViolations.length * 8) +
      (blastAffected * 2.5) +
      (loc > 200 ? 15 : 5)
    );
    hotspotScore = Math.min(Math.max(hotspotScore, 10), 99);

    const reasons = [];
    if (fanIn >= 3) reasons.push(`High Fan-In (${fanIn} callers depend on this module)`);
    if (fanOut >= 3) reasons.push(`High Fan-Out (depends on ${fanOut} outgoing modules)`);
    if (elemViolations.length > 0) reasons.push(`Active Architecture Violations (${elemViolations.length} breaches)`);
    if (blastAffected >= 3) reasons.push(`Wide Blast Radius (${blastAffected} downstream components affected)`);
    if (loc > 200) reasons.push(`Large Module Footprint (${loc} lines of code)`);
    if (metrics.isGodComponent) reasons.push('Identified as God / Hub Component Anti-pattern');

    let level = 'LOW';
    if (hotspotScore >= 70) level = 'CRITICAL';
    else if (hotspotScore >= 45) level = 'HIGH';
    else if (hotspotScore >= 25) level = 'MEDIUM';

    return {
      id: elem.id,
      name: elem.name,
      layer: elem.layer,
      path: elem.path,
      hotspotScore,
      level,
      fanIn,
      fanOut,
      coupling,
      lineCount: loc,
      violationCount: elemViolations.length,
      blastRadiusCount: blastAffected,
      estimatedChurn,
      reasons,
      recommendation: getHotspotRemediation(elem, fanIn, fanOut, elemViolations.length)
    };
  });

  return hotspots.sort((a, b) => b.hotspotScore - a.hotspotScore);
}

function getHotspotRemediation(elem, fanIn, fanOut, violations) {
  if (fanIn > 5 && fanOut > 4) {
    return `Decompose ${elem.name} using the Facade or Mediator pattern to separate incoming dispatch from outgoing integrations.`;
  }
  if (violations > 0) {
    return `Address the direct layer breaches in ${elem.name} to decouple it from forbidden infrastructure modules.`;
  }
  if (fanIn > 5) {
    return `Extract stable interface abstractions from ${elem.name} to insulate dependents against implementation changes.`;
  }
  return `Apply Single Responsibility Principle (SRP) to keep ${elem.name} focused and maintainable.`;
}
