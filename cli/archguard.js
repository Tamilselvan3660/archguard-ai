#!/usr/bin/env node

/**
 * ARCHGUARD AI — Command Line Interface (CLI)
 * 
 * Provides local terminal & CI/CD architecture drift evaluation and reporting.
 */

import path from 'path';
import fs from 'fs';
import { parseRepository } from '../server/engine/parser.js';
import { DependencyGraph } from '../server/engine/graph.js';
import { detectArchitectureDrift } from '../server/engine/driftDetector.js';
import { calculateArchitectureHealth } from '../server/engine/healthCalculator.js';

const args = process.argv.slice(2);
const command = args[0] || 'drift';
const targetPath = path.resolve(args[1] || 'mini_project/sample-ecommerce');

console.log(`
 🛡️  ARCHGUARD AI — Architecture Drift Detector v1.0.0
 ====================================================
 Target Directory: ${targetPath}
 Command:          ${command.toUpperCase()}
`);

if (!fs.existsSync(targetPath)) {
  console.error(`❌ Error: Target directory does not exist: ${targetPath}`);
  process.exit(1);
}

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

if (command === 'scan' || command === 'drift') {
  console.log(`📊 ARCHITECTURE HEALTH SCORE: ${health.overallHealth}/100`);
  console.log(`💸 ARCHITECTURE DEBT INDEX:  ${health.architectureDebtIndex}\n`);

  console.log('DETECTED ARCHITECTURE DRIFT VIOLATIONS:');
  console.log('----------------------------------------------------');
  if (violations.length === 0) {
    console.log('✨ No architecture drift violations detected. Architecture is clean!');
  } else {
    violations.forEach((v) => {
      console.log(`[${v.id}] [${v.severity}] ${v.category}`);
      console.log(`  Rule:    ${v.ruleName}`);
      console.log(`  Actual:  ${v.actual}`);
      console.log(`  Evidence:`);
      v.evidence.forEach(e => console.log(`    • ${e}`));
      console.log(`  Fix:     ${v.recommendation}\n`);
    });
  }
} else if (command === 'report') {
  const reportPath = path.join(targetPath, 'archguard-report.json');
  const reportData = {
    generatedAt: new Date().toISOString(),
    targetPath,
    techStack,
    health,
    violations
  };
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`✅ Architecture report exported to: ${reportPath}`);
}

if (violations.some(v => v.severity === 'CRITICAL')) {
  console.log('❌ CI/CD GUARD: Critical architecture drift violations detected!');
  process.exit(1);
} else {
  console.log('✅ ARCHGUARD DRIFT CHECK COMPLETED');
}
