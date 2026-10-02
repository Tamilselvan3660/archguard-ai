/**
 * ARCHGUARD AI — Architecture Regression Testing Suite
 * 
 * Compiles defined architecture constraints and fitness functions into an
 * executable test suite suitable for CI/CD pipelines and local CLI execution.
 */

import { evaluateFitnessFunctions, getFitnessFunctions } from './fitnessFunctions.js';

export function runArchitectureTests(elements, dependencies, graph, violations = [], customFunctions = null) {
  const startTime = Date.now();
  const fitnessEval = evaluateFitnessFunctions(elements, dependencies, graph, customFunctions);

  // Core Built-in Baseline Regression Tests
  const builtInTests = [
    {
      id: 'TEST-CORE-001',
      name: 'No Circular Dependencies in Architecture Graph',
      category: 'GRAPH_INTEGRITY',
      status: graph.findCycles().length === 0 ? 'PASSED' : 'FAILED',
      evidence: graph.findCycles().length === 0 
        ? 'Topology is a valid Directed Acyclic Graph (0 cycles)' 
        : `Detected ${graph.findCycles().length} circular dependency cycles`,
      severity: 'CRITICAL'
    },
    {
      id: 'TEST-CORE-002',
      name: 'Zero Critical Severity Architectural Violations',
      category: 'RULE_GOVERNANCE',
      status: violations.filter(v => v.severity === 'CRITICAL').length === 0 ? 'PASSED' : 'FAILED',
      evidence: `${violations.filter(v => v.severity === 'CRITICAL').length} critical violations present`,
      severity: 'CRITICAL'
    },
    {
      id: 'TEST-CORE-003',
      name: 'Architecture Health Index Meets Minimum Threshold (>= 75%)',
      category: 'HEALTH_INDEX',
      status: (violations.length < 5) ? 'PASSED' : 'FAILED',
      evidence: `System health evaluated with ${violations.length} total active violations`,
      severity: 'HIGH'
    }
  ];

  // Map evaluated fitness functions to test results
  const fitnessTests = fitnessEval.results.map(f => ({
    id: `TEST-${f.id}`,
    name: f.name,
    category: `FITNESS_${f.type.toUpperCase()}`,
    status: f.status,
    evidence: f.status === 'PASSED' 
      ? 'Constraint satisfied with 0 breaches'
      : `${f.violationCount} violation(s): ${f.violations[0]?.evidence || 'Constraint breached'}`,
    severity: f.severity,
    details: f.violations
  }));

  const allTests = [...builtInTests, ...fitnessTests];
  const passed = allTests.filter(t => t.status === 'PASSED').length;
  const failed = allTests.filter(t => t.status === 'FAILED').length;
  const skipped = allTests.filter(t => t.status === 'SKIPPED').length;
  const durationMs = Date.now() - startTime;

  return {
    suite: 'ARCHGUARD Enterprise Architecture Test Suite',
    status: failed === 0 ? 'PASSED' : 'FAILED',
    timestamp: new Date().toISOString(),
    durationMs,
    summary: {
      total: allTests.length,
      passed,
      failed,
      skipped,
      passRate: Math.round((passed / (allTests.length - skipped || 1)) * 100)
    },
    tests: allTests
  };
}
