/**
 * ARCHGUARD AI — Server & REST/WebSocket API
 * 
 * Production backend API providing repository scanning, architecture graph extraction,
 * drift detection, health score calculation, ADR management, and static client serving.
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { parseRepository } from './engine/parser.js';
import { DependencyGraph } from './engine/graph.js';
import { detectArchitectureDrift } from './engine/driftDetector.js';
import { calculateArchitectureHealth } from './engine/healthCalculator.js';
import { queryAICopilot } from './engine/aiCopilot.js';
import { 
  getFitnessFunctions, 
  saveFitnessFunction, 
  deleteFitnessFunction, 
  evaluateFitnessFunctions, 
  resetDefaultFitnessFunctions 
} from './engine/fitnessFunctions.js';
import { runArchitectureTests } from './engine/regressionTests.js';
import { calculateBlastRadius, calculateSystemBlastRadiusRanking } from './engine/blastRadius.js';
import { detectArchitectureHotspots } from './engine/hotspots.js';
import { isValidEmail, sendOtpEmail } from './services/emailService.js';
import { initDatabase, isDbConnected } from './db/neon.js';
import { ArchRepository } from './db/repository.js';
import cloudRoutes from './routes/cloudRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mount Unified Multi-Cloud Storage API
app.use('/api/cloud', cloudRoutes);

// Mount Authentication API
app.use('/api/auth', authRoutes);

// In-Memory Repository Scan Cache
const scanCache = new Map();

// Default Sample ADRs with Cloud Storage Persistence
const initialSampleAdrs = [
  {
    id: 'ADR-001',
    title: 'Presentation Layer Direct Database Access Prohibition',
    status: 'ACCEPTED',
    decision: 'All HTTP controllers and UI components must access data strictly via Application Services.',
    rationale: 'Decouple presentation controllers from SQL schema details and maintain layer isolation.',
    ruleId: 'RULE-001',
    violationCount: 1
  },
  {
    id: 'ADR-002',
    title: 'Acyclic Domain Dependency Mandate',
    status: 'ACCEPTED',
    decision: 'Domain services must never introduce circular dependency loops.',
    rationale: 'Avoid tight coupling, recursion risks, and un-testable unit components.',
    ruleId: 'RULE-003',
    violationCount: 1
  }
];

let adrList = [...initialSampleAdrs];

// Historical Git Commit Snapshots
const commitHistory = [
  { commit: 'c1a90f', date: '2026-09-15', author: 'Sarah Lin', health: 96, violations: 0, debt: 0, message: 'Initial clean hexagonal domain layout' },
  { commit: 'b48e21', date: '2026-09-18', author: 'Mark Dev', health: 91, violations: 1, debt: 5, message: 'Added Order and Payment domain services' },
  { commit: 'e92f14', date: '2026-09-22', author: 'DevOps Bot', health: 84, violations: 2, debt: 15, message: 'Refactored UserController and added direct DB queries' },
  { commit: 'f87a32', date: '2026-09-28', author: 'Alex Chen', health: 76, violations: 4, debt: 28, message: 'Introduced Payment-Order circular reference' },
];

// Execute Analysis Pipeline for a Repository
function runScanPipeline(repoPath) {
  const { elements, dependencies, techStack } = parseRepository(repoPath);
  const graph = new DependencyGraph(elements, dependencies);
  
  // Intended Rules
  const intendedSpec = {
    rules: [
      { id: 'RULE-001', name: 'no-ui-database-access', severity: 'HIGH', category: 'LAYER_VIOLATION', source: 'presentation', forbidden: ['infrastructure'] },
      { id: 'RULE-002', name: 'no-domain-infrastructure-coupling', severity: 'CRITICAL', category: 'BOUNDARY_VIOLATION', source: 'domain', forbidden: ['infrastructure'] }
    ]
  };

  const violations = detectArchitectureDrift(elements, dependencies, graph, intendedSpec);
  const health = calculateArchitectureHealth(elements, dependencies, violations, graph);
  const flowGraph = graph.toReactFlowFormat();

  const scanResult = {
    id: `scan-${Date.now()}`,
    repoName: path.basename(repoPath),
    repoPath,
    scannedAt: new Date().toISOString(),
    techStack,
    elements,
    dependencies,
    graph: flowGraph,
    violations,
    health,
    commitHistory
  };

  scanCache.set('default', scanResult);
  return scanResult;
}

// Automatically scan sample-ecommerce on startup
const defaultRepoPath = fs.existsSync(path.resolve('sample-ecommerce'))
  ? path.resolve('sample-ecommerce')
  : path.resolve('mini_project/sample-ecommerce');

runScanPipeline(defaultRepoPath);

// REST API Endpoints

app.get('/api/repositories', (req, res) => {
  res.json([
    { id: 'sample-ecommerce', name: 'eCommerce Enterprise System', path: defaultRepoPath, language: 'TypeScript', status: 'SCANNED' },
    { id: 'archguard-core', name: 'ARCHGUARD AI Core (Self-Analysis)', path: path.resolve('.'), language: 'JavaScript', status: 'READY' }
  ]);
});

app.post('/api/repositories/scan', (req, res) => {
  let targetPath = req.body.repoPath || defaultRepoPath;
  if (!fs.existsSync(targetPath)) {
    const stripped = targetPath.replace(/^mini_project[\\/]/, '');
    if (fs.existsSync(path.resolve(stripped))) {
      targetPath = path.resolve(stripped);
    }
  }
  const result = runScanPipeline(targetPath);
  res.json(result);
});

app.get('/api/scans/latest', (req, res) => {
  const scan = scanCache.get('default');
  res.json(scan);
});

// Health Check Endpoint for Render & Public Monitoring
app.get('/api/health', async (req, res) => {
  const dbConnected = await isDbConnected();
  res.json({
    status: 'HEALTHY',
    service: 'ARCHGUARD AI Platform',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      provider: 'Neon PostgreSQL',
      connected: dbConnected,
      mode: dbConnected ? 'CLOUD_POSTGRESQL' : 'LOCAL_REPLICA_FALLBACK'
    }
  });
});

app.get('/api/adrs', async (req, res) => {
  const adrs = await ArchRepository.getAdrs(adrList);
  res.json(adrs);
});

app.post('/api/adrs', async (req, res) => {
  const newAdr = {
    id: `ADR-00${adrList.length + 1}`,
    title: req.body.title,
    status: 'ACCEPTED',
    decision: req.body.decision,
    rationale: req.body.rationale,
    ruleId: `RULE-00${adrList.length + 1}`,
    violationCount: 0
  };
  adrList.push(newAdr);
  await ArchRepository.saveAdr(newAdr);
  res.json(newAdr);
});

// Enterprise Architecture Governance Board API
app.get('/api/board', (req, res) => {
  const scan = scanCache.get('default');
  res.json({
    status: 'ACTIVE_SESSION',
    boardName: 'Enterprise Architecture Governance Board (ARB)',
    connectedAt: new Date().toISOString(),
    quorum: {
      required: 3,
      present: 4,
      status: 'QUORUM_MET'
    },
    members: [
      { name: 'Sarah Lin', role: 'Chief Enterprise Architect (Chair)', status: 'ONLINE', avatar: 'SL' },
      { name: 'Marcus Vance', role: 'Principal Security Architect', status: 'ONLINE', avatar: 'MV' },
      { name: 'Elena Rostova', role: 'VP Platform Engineering', status: 'ONLINE', avatar: 'ER' },
      { name: 'Alex Chen', role: 'Staff Domain Architect', status: 'ONLINE', avatar: 'AC' }
    ],
    reviewStats: {
      repoName: scan?.repoName || 'sample-ecommerce',
      overallHealth: scan?.health?.overallHealth || 82,
      healthGrade: scan?.health?.healthGrade || 'B',
      activeDrifts: scan?.violations?.length || 4,
      debtHours: scan?.health?.architectureDebtIndex || 28,
      acceptedAdrs: adrList.length
    },
    agendaItems: (scan?.violations || []).map((v, i) => ({
      id: `ARB-ITEM-${i + 1}`,
      ruleId: v.ruleId || `RULE-00${i + 1}`,
      message: v.message || 'Architectural boundary violation',
      severity: v.severity || 'CRITICAL',
      source: v.source || 'Domain Layer',
      target: v.target || 'Infrastructure Layer',
      status: 'PENDING_REVIEW'
    }))
  });
});

// ─── Fitness Functions Endpoints ───
app.get('/api/fitness-functions', (req, res) => {
  res.json(getFitnessFunctions());
});

app.post('/api/fitness-functions', (req, res) => {
  const saved = saveFitnessFunction(req.body);
  res.json({ success: true, fitnessFunction: saved });
});

app.delete('/api/fitness-functions/:id', (req, res) => {
  deleteFitnessFunction(req.params.id);
  res.json({ success: true, message: `Fitness function ${req.params.id} deleted` });
});

app.post('/api/fitness-functions/evaluate', (req, res) => {
  const scan = scanCache.get('default');
  if (!scan) return res.status(404).json({ error: 'No repository scan available' });
  const graph = new DependencyGraph(scan.elements, scan.dependencies);
  const evaluation = evaluateFitnessFunctions(scan.elements, scan.dependencies, graph, req.body.functions);
  res.json(evaluation);
});

// ─── Architecture Regression Tests Endpoints ───
app.get('/api/tests', (req, res) => {
  const scan = scanCache.get('default');
  if (!scan) return res.status(404).json({ error: 'No repository scan available' });
  const graph = new DependencyGraph(scan.elements, scan.dependencies);
  const testResults = runArchitectureTests(scan.elements, scan.dependencies, graph, scan.violations);
  res.json(testResults);
});

app.post('/api/tests/run', (req, res) => {
  const scan = scanCache.get('default');
  if (!scan) return res.status(404).json({ error: 'No repository scan available' });
  const graph = new DependencyGraph(scan.elements, scan.dependencies);
  const testResults = runArchitectureTests(scan.elements, scan.dependencies, graph, scan.violations, req.body.functions);
  res.json(testResults);
});

// ─── Advanced Blast Radius Endpoints ───
app.get('/api/blast-radius', (req, res) => {
  const scan = scanCache.get('default');
  if (!scan) return res.status(404).json({ error: 'No repository scan available' });
  const graph = new DependencyGraph(scan.elements, scan.dependencies);
  const ranking = calculateSystemBlastRadiusRanking(scan.elements, scan.dependencies, graph, scan.violations);
  res.json(ranking);
});

app.get('/api/blast-radius/:componentId', (req, res) => {
  const scan = scanCache.get('default');
  if (!scan) return res.status(404).json({ error: 'No repository scan available' });
  const graph = new DependencyGraph(scan.elements, scan.dependencies);
  const blast = calculateBlastRadius(req.params.componentId, scan.elements, scan.dependencies, graph, scan.violations);
  res.json(blast);
});

// ─── Architecture Hotspots Endpoint ───
app.get('/api/hotspots', (req, res) => {
  const scan = scanCache.get('default');
  if (!scan) return res.status(404).json({ error: 'No repository scan available' });
  const graph = new DependencyGraph(scan.elements, scan.dependencies);
  const hotspots = detectArchitectureHotspots(scan.elements, scan.dependencies, graph, scan.violations);
  res.json(hotspots);
});

// Serve Static Production Frontend Bundle if present
const distCandidates = [path.resolve('dist'), path.resolve('client/dist')];
const activeDist = distCandidates.find(d => fs.existsSync(d) && fs.existsSync(path.join(d, 'index.html')));
if (activeDist) {
  app.use(express.static(activeDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(activeDist, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`⚡ ARCHGUARD AI Platform running on http://localhost:${PORT}`);
  try {
    await initDatabase();
  } catch (err) {
    console.warn('⚠️ [STARTUP] Database connection notice:', err.message);
  }
});
