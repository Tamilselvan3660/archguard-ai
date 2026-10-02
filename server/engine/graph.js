/**
 * ARCHGUARD AI — Directed Dependency Graph Engine
 * 
 * Builds directed architecture graphs, computes node centrality/coupling,
 * and executes Tarjan's Strongly Connected Components (SCC) for cycle detection.
 */

export class DependencyGraph {
  constructor(elements, dependencies) {
    this.nodes = new Map();
    this.adjacencyList = new Map();
    this.inEdges = new Map();

    elements.forEach((elem) => {
      this.nodes.set(elem.id, elem);
      this.adjacencyList.set(elem.id, new Set());
      this.inEdges.set(elem.id, new Set());
    });

    dependencies.forEach((dep) => {
      if (this.nodes.has(dep.source) && this.nodes.has(dep.target)) {
        this.adjacencyList.get(dep.source).add(dep.target);
        this.inEdges.get(dep.target).add(dep.source);
      }
    });
  }

  /**
   * Tarjan's Strongly Connected Components (SCC) Algorithm
   * Detects all circular dependency loops in the graph.
   */
  findCycles() {
    let index = 0;
    const stack = [];
    const indices = new Map();
    const lowlink = new Map();
    const onStack = new Map();
    const sccs = [];

    const strongConnect = (nodeId) => {
      indices.set(nodeId, index);
      lowlink.set(nodeId, index);
      index++;
      stack.push(nodeId);
      onStack.set(nodeId, true);

      const neighbors = this.adjacencyList.get(nodeId) || new Set();
      for (const neighbor of neighbors) {
        if (!indices.has(neighbor)) {
          strongConnect(neighbor);
          lowlink.set(nodeId, Math.min(lowlink.get(nodeId), lowlink.get(neighbor)));
        } else if (onStack.get(neighbor)) {
          lowlink.set(nodeId, Math.min(lowlink.get(nodeId), indices.get(neighbor)));
        }
      }

      if (lowlink.get(nodeId) === indices.get(nodeId)) {
        const scc = [];
        let w;
        do {
          w = stack.pop();
          onStack.set(w, false);
          scc.push(w);
        } while (w !== nodeId);

        if (scc.length > 1) {
          sccs.push(scc);
        }
      }
    };

    for (const nodeId of this.nodes.keys()) {
      if (!indices.has(nodeId)) {
        strongConnect(nodeId);
      }
    }

    return sccs;
  }

  /**
   * Calculate Afferent (Ca) and Efferent (Ce) Coupling for each node
   */
  getCouplingMetrics() {
    const metrics = {};
    for (const nodeId of this.nodes.keys()) {
      const efferent = (this.adjacencyList.get(nodeId) || new Set()).size; // Ce (outgoing)
      const afferent = (this.inEdges.get(nodeId) || new Set()).size;       // Ca (incoming)
      const instability = (efferent + afferent) === 0 ? 0 : efferent / (efferent + afferent);

      metrics[nodeId] = {
        efferentCoupling: efferent,
        afferentCoupling: afferent,
        instability: Math.round(instability * 100) / 100,
        isGodComponent: efferent > 5 || afferent > 8,
        isHubComponent: efferent >= 3 && afferent >= 3
      };
    }
    return metrics;
  }

  /**
   * Export graph for React Flow visualization
   */
  toReactFlowFormat() {
    const nodes = [];
    const edges = [];
    let x = 100;
    let y = 100;

    const layerYOffset = {
      presentation: 80,
      application: 240,
      domain: 400,
      infrastructure: 560,
      general: 700
    };

    const layerXCounters = {};

    for (const [id, elem] of this.nodes.entries()) {
      const layer = elem.layer || 'general';
      const col = layerXCounters[layer] || 0;
      layerXCounters[layer] = col + 1;

      nodes.push({
        id,
        type: 'customNode',
        data: {
          label: elem.name,
          layer: elem.layer,
          type: elem.type,
          path: elem.path,
          lineCount: elem.lineCount
        },
        position: {
          x: 180 + col * 260,
          y: layerYOffset[layer] || 700
        }
      });
    }

    let edgeId = 1;
    for (const [source, targets] of this.adjacencyList.entries()) {
      for (const target of targets) {
        edges.push({
          id: `e-${edgeId++}`,
          source,
          target,
          animated: true,
          style: { stroke: '#38bdf8' }
        });
      }
    }

    return { nodes, edges };
  }
}
