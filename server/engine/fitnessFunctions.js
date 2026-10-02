/**
 * ARCHGUARD AI — Architecture Fitness Function Engine
 * 
 * Evaluates architectural fitness functions against source AST elements,
 * dependency graphs, and structural metrics.
 */

import fs from 'fs';
import path from 'path';

// Default built-in fitness functions aligned with enterprise architecture governance
export const defaultFitnessFunctions = [
  {
    id: 'FIT-001',
    name: 'Domain Must Not Depend on Presentation (UI)',
    description: 'Domain core business logic must never import UI or presentation controllers.',
    type: 'dependency',
    severity: 'CRITICAL',
    enabled: true,
    spec: {
      sourceLayer: 'domain',
      forbiddenLayer: 'presentation'
    }
  },
  {
    id: 'FIT-002',
    name: 'Controllers Cannot Directly Access Database',
    description: 'HTTP presentation controllers must mediate database operations through application services.',
    type: 'dependency',
    severity: 'HIGH',
    enabled: true,
    spec: {
      sourceLayer: 'presentation',
      forbiddenLayer: 'infrastructure'
    }
  },
  {
    id: 'FIT-003',
    name: 'Strict Acyclic Graph (No Circular Dependencies)',
    description: 'System module topology must remain a Directed Acyclic Graph (DAG) with zero cycles.',
    type: 'graph',
    severity: 'CRITICAL',
    enabled: true,
    spec: {
      metric: 'cycles',
      operator: '==',
      threshold: 0
    }
  },
  {
    id: 'FIT-004',
    name: 'Maximum Component Coupling Limit',
    description: 'No component should exceed an efferent coupling (Ce) threshold of 6 dependencies.',
    type: 'metric',
    severity: 'MEDIUM',
    enabled: true,
    spec: {
      metric: 'efferentCoupling',
      operator: '<=',
      threshold: 6
    }
  },
  {
    id: 'FIT-005',
    name: 'Service Naming Convention Compliance',
    description: 'Components named *Service must belong to the Application or Domain layers.',
    type: 'naming',
    severity: 'LOW',
    enabled: true,
    spec: {
      pattern: '.*Service$',
      allowedLayers: ['application', 'domain']
    }
  },
  {
    id: 'FIT-006',
    name: 'Presentation Direct Model Mutation Prohibition',
    description: 'Presentation layer components must not directly import domain entity state mutators.',
    type: 'boundary',
    severity: 'HIGH',
    enabled: true,
    spec: {
      sourceLayer: 'presentation',
      forbiddenTargetPatterns: ['.*Entity.*', '.*Model.*']
    }
  }
];

let fitnessFunctionsStore = [...defaultFitnessFunctions];

export function getFitnessFunctions() {
  return fitnessFunctionsStore;
}

export function saveFitnessFunction(fn) {
  const existingIdx = fitnessFunctionsStore.findIndex(f => f.id === fn.id);
  if (existingIdx >= 0) {
    fitnessFunctionsStore[existingIdx] = { ...fitnessFunctionsStore[existingIdx], ...fn, updatedAt: new Date().toISOString() };
    return fitnessFunctionsStore[existingIdx];
  } else {
    const newFn = {
      id: fn.id || `FIT-${String(fitnessFunctionsStore.length + 1).padStart(3, '0')}`,
      enabled: fn.enabled !== undefined ? fn.enabled : true,
      createdAt: new Date().toISOString(),
      ...fn
    };
    fitnessFunctionsStore.push(newFn);
    return newFn;
  }
}

export function deleteFitnessFunction(id) {
  fitnessFunctionsStore = fitnessFunctionsStore.filter(f => f.id !== id);
  return true;
}

export function resetDefaultFitnessFunctions() {
  fitnessFunctionsStore = [...defaultFitnessFunctions];
  return fitnessFunctionsStore;
}

/**
 * Evaluates all active fitness functions against current scan data
 */
export function evaluateFitnessFunctions(elements, dependencies, graph, functionsToRun = null) {
  const fns = functionsToRun || fitnessFunctionsStore;
  const cycles = graph.findCycles();
  const couplingMap = graph.getCouplingMetrics();

  const results = fns.map(fn => {
    if (!fn.enabled) {
      return {
        id: fn.id,
        name: fn.name,
        type: fn.type,
        severity: fn.severity,
        status: 'SKIPPED',
        reason: 'Function disabled by user',
        violations: []
      };
    }

    const violations = [];

    switch (fn.type) {
      case 'dependency': {
        const { sourceLayer, forbiddenLayer } = fn.spec;
        dependencies.forEach(dep => {
          const sElem = elements.find(e => e.id === dep.source);
          const tElem = elements.find(e => e.id === dep.target);
          if (sElem && tElem) {
            if (sElem.layer === sourceLayer && tElem.layer === forbiddenLayer) {
              violations.push({
                source: dep.source,
                target: dep.target,
                file: sElem.path,
                line: dep.lineNumber || 1,
                evidence: `${sElem.name} (${sElem.layer}) imports ${tElem.name} (${tElem.layer})`
              });
            }
          }
        });
        break;
      }

      case 'graph': {
        if (fn.spec.metric === 'cycles') {
          if (cycles.length > fn.spec.threshold) {
            cycles.forEach(c => {
              violations.push({
                source: c[0],
                target: c[1] || c[0],
                evidence: `Cycle: ${c.join(' ⇄ ')}`
              });
            });
          }
        }
        break;
      }

      case 'metric': {
        const { metric, operator, threshold } = fn.spec;
        for (const [nodeId, nodeMetrics] of Object.entries(couplingMap)) {
          const val = nodeMetrics[metric] !== undefined ? nodeMetrics[metric] : 0;
          let failed = false;
          if (operator === '<=' && val > threshold) failed = true;
          if (operator === '<' && val >= threshold) failed = true;
          if (operator === '>=' && val < threshold) failed = true;
          if (operator === '==' && val !== threshold) failed = true;

          if (failed) {
            violations.push({
              source: nodeId,
              evidence: `${nodeId} metric '${metric}' was ${val} (expected ${operator} ${threshold})`
            });
          }
        }
        break;
      }

      case 'naming': {
        const reg = new RegExp(fn.spec.pattern);
        elements.forEach(elem => {
          if (reg.test(elem.name)) {
            if (!fn.spec.allowedLayers.includes(elem.layer)) {
              violations.push({
                source: elem.id,
                file: elem.path,
                evidence: `${elem.name} is in layer '${elem.layer}', but must reside in [${fn.spec.allowedLayers.join(', ')}]`
              });
            }
          }
        });
        break;
      }

      case 'boundary': {
        const { sourceLayer, forbiddenTargetPatterns } = fn.spec;
        const regexes = (forbiddenTargetPatterns || []).map(p => new RegExp(p));
        dependencies.forEach(dep => {
          const sElem = elements.find(e => e.id === dep.source);
          const tElem = elements.find(e => e.id === dep.target);
          if (sElem && tElem && sElem.layer === sourceLayer) {
            const matchesForbidden = regexes.some(r => r.test(tElem.name));
            if (matchesForbidden) {
              violations.push({
                source: dep.source,
                target: dep.target,
                evidence: `${sElem.name} in layer '${sourceLayer}' breaches boundary by importing ${tElem.name}`
              });
            }
          }
        });
        break;
      }

      default:
        break;
    }

    const passed = violations.length === 0;

    return {
      id: fn.id,
      name: fn.name,
      type: fn.type,
      severity: fn.severity,
      status: passed ? 'PASSED' : 'FAILED',
      violationCount: violations.length,
      violations
    };
  });

  const total = results.filter(r => r.status !== 'SKIPPED').length;
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;

  return {
    summary: {
      status: failed === 0 ? 'PASSED' : 'FAILED',
      total,
      passed,
      failed,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 100,
      evaluatedAt: new Date().toISOString()
    },
    results
  };
}
