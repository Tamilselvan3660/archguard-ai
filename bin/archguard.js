#!/usr/bin/env node

/**
 * ARCHGUARD AI — Command Line Interface (CLI)
 * 
 * Usage:
 *   archguard scan [path]
 *   archguard drift [path]
 *   archguard test [--ci] [path]
 *   archguard blast-radius [path]
 */

import path from 'path';
import fs from 'fs';
import { parseRepository } from '../server/engine/parser.js';
import { DependencyGraph } from '../server/engine/graph.js';
import { detectArchitectureDrift } from '../server/engine/driftDetector.js';
import { calculateArchitectureHealth } from '../server/engine/healthCalculator.js';
import { runArchitectureTests } from '../server/engine/regressionTests.js';
import { calculateSystemBlastRadiusRanking } from '../server/engine/blastRadius.js';
import { defaultFitnessFunctions } from '../server/engine/fitnessFunctions.js';

const args = process.argv.slice(2);
const command = args[0] || 'test';
const isCi = args.includes('--ci');
const rawTarget = args.find(a => !a.startsWith('-') && a !== command) || '.';
const targetPath = fs.existsSync(path.resolve(rawTarget)) 
  ? path.resolve(rawTarget)
  : (fs.existsSync(path.resolve('sample-ecommerce')) ? path.resolve('sample-ecommerce') : path.resolve('.'));

console.log(`\n🛡️  ARCHGUARD AI CLI — Enterprise Architecture Engine\n`);
console.log(`Target Repository: ${targetPath}`);

try {
  const { elements, dependencies, techStack } = parseRepository(targetPath);
  const graph = new DependencyGraph(elements, dependencies);
  
  const intendedSpec = {
    rules: [
      { id: 'RULE-001', name: 'no-ui-database-access', severity: 'HIGH', category: 'LAYER_VIOLATION', source: 'presentation', forbidden: ['infrastructure'] },
      { id: 'RULE-002', name: 'no-domain-infrastructure-coupling', severity: 'CRITICAL', category: 'BOUNDARY_VIOLATION', source: 'domain', forbidden: ['infrastructure'] }
    ]
  };

  const violations = detectArchitectureDrift(elements, dependencies, graph, intendedSpec);
  const health = calculateArchitectureHealth(elements, dependencies, violations, graph);

  if (command === 'scan') {
    console.log(`\n📦 Files Analyzed:     ${elements.length}`);
    console.log(`🔗 Dependencies:       ${dependencies.length}`);
    console.log(`⚙️  Tech Stack:         ${techStack.framework} / ${techStack.language}`);
    console.log(`📊 Health Score:       ${health.overallHealth}/100 (Grade ${health.healthGrade})`);
    console.log(`⚠️  Drift Violations:   ${violations.length}`);
    process.exit(0);
  }

  if (command === 'drift') {
    console.log(`\n⚠️  Architecture Drift Violations (${violations.length} Detected):\n`);
    violations.forEach((v, i) => {
      console.log(`[${v.severity}] #${i + 1} ${v.ruleName || v.category}: ${v.actual}`);
      console.log(`   Recommendation: ${v.recommendation}\n`);
    });
    process.exit(violations.length > 0 ? 1 : 0);
  }

  if (command === 'blast-radius') {
    const ranking = calculateSystemBlastRadiusRanking(elements, dependencies, graph, violations);
    console.log(`\n💥 Top Component Blast Radius Ranking:\n`);
    ranking.slice(0, 5).forEach((r, i) => {
      console.log(`#${i + 1} ${r.name} (${r.layer}) — Risk Score: ${r.riskScore}/100 [${r.severity}]`);
      console.log(`   Direct: ${r.directCount} | Transitive: ${r.indirectCount} | Total Affected: ${r.totalAffected}\n`);
    });
    process.exit(0);
  }

  if (command === 'test') {
    const suite = runArchitectureTests(elements, dependencies, graph, violations, defaultFitnessFunctions);
    
    if (isCi) {
      console.log(JSON.stringify({
        status: suite.status,
        tests: suite.summary.total,
        passed: suite.summary.passed,
        failed: suite.summary.failed,
        passRate: `${suite.summary.passRate}%`,
        durationMs: suite.durationMs
      }, null, 2));
      process.exit(suite.status === 'PASSED' ? 0 : 1);
    }

    console.log(`\n🧪 Architecture Regression Test Results:\n`);
    suite.tests.forEach(t => {
      const icon = t.status === 'PASSED' ? '✅' : '❌';
      console.log(`${icon} [${t.status}] ${t.name}`);
      console.log(`   Evidence: ${t.evidence}`);
    });

    console.log(`\n-----------------------------------------------------`);
    console.log(`Result: ${suite.status} | Passed: ${suite.summary.passed}/${suite.summary.total} (${suite.summary.passRate}%) | Time: ${suite.durationMs}ms\n`);
    process.exit(suite.status === 'PASSED' ? 0 : 1);
  }

  console.log(`Unknown command: ${command}`);
  console.log(`Available commands: scan, drift, blast-radius, test`);
  process.exit(1);

} catch (err) {
  console.error(`❌ ARCHGUARD Analysis Failed: ${err.message}`);
  process.exit(1);
}
