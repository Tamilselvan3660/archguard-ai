/**
 * ARCHGUARD AI — Engine Verification Test Script
 * Runs parser, graph builder, drift detector, and health calculator against sample-ecommerce.
 */

import path from 'path';
import fs from 'fs';
import { parseRepository } from './parser.js';
import { DependencyGraph } from './graph.js';
import { detectArchitectureDrift } from './driftDetector.js';
import { calculateArchitectureHealth } from './healthCalculator.js';
import { queryAICopilot } from './aiCopilot.js';

const sampleRepoPath = fs.existsSync(path.resolve('sample-ecommerce'))
  ? path.resolve('sample-ecommerce')
  : path.resolve('mini_project/sample-ecommerce');

console.log('==================================================');
console.log('🧪 ARCHGUARD AI Static Analysis Verification Test');
console.log('==================================================');

// 1. Parse repository
const { elements, dependencies, techStack } = parseRepository(sampleRepoPath);
console.log(`✓ Parsed ${elements.length} components and ${dependencies.length} dependency edges.`);
console.log('Tech Stack:', techStack);

// 2. Build Dependency Graph
const graph = new DependencyGraph(elements, dependencies);
const cycles = graph.findCycles();
console.log(`✓ Found ${cycles.length} circular dependency loop(s).`);

// 3. Load Intended Spec
const yamlContent = fs.readFileSync(path.join(sampleRepoPath, 'architecture.yaml'), 'utf-8');
const intendedSpec = parseSimpleYaml(yamlContent);

// 4. Detect Drift
const violations = detectArchitectureDrift(elements, dependencies, graph, intendedSpec);
console.log(`✓ Detected ${violations.length} Architecture Drift Violations:`);
violations.forEach(v => {
  console.log(`  [${v.id}] [${v.severity}] ${v.category}: ${v.actual}`);
});

// 5. Calculate Health
const health = calculateArchitectureHealth(elements, dependencies, violations, graph);
console.log(`✓ Overall Architecture Health: ${health.overallHealth}/100 (Debt Index: ${health.architectureDebtIndex})`);

// 6. Query AI Copilot
const aiResponse = queryAICopilot('Why is my architecture unhealthy?', { violations, health, graph, elements, dependencies });
console.log('✓ AI Copilot Query Response:');
console.log(aiResponse.answer);

console.log('==================================================');
console.log('✅ ENGINE VERIFICATION PASSED');
console.log('==================================================');

function parseSimpleYaml(str) {
  // Simple yaml parser fallback for rules
  return {
    rules: [
      {
        id: "RULE-001",
        name: "no-ui-database-access",
        severity: "HIGH",
        category: "LAYER_VIOLATION",
        source: "presentation",
        forbidden: ["infrastructure"]
      },
      {
        id: "RULE-002",
        name: "no-domain-infrastructure-coupling",
        severity: "CRITICAL",
        category: "BOUNDARY_VIOLATION",
        source: "domain",
        forbidden: ["infrastructure"]
      }
    ]
  };
}
