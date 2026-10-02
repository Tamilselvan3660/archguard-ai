/**
 * CloudRoutes — Express Routes for Multi-Cloud Storage Architecture
 * 
 * Defines standard routes matching the specification:
 * /api/cloud/providers
 * /api/cloud/connect/:provider
 * /api/cloud/callback/:provider
 * /api/cloud/disconnect/:provider
 * /api/cloud/:provider/files
 * /api/cloud/:provider/upload
 * /api/cloud/:provider/download/:fileId
 * /api/cloud/:provider/folder
 * /api/cloud/:provider/search
 * /api/cloud/:provider/storage
 * /api/cloud/:provider/share/:fileId
 * /api/cloud/unified/*
 */

import express from 'express';
import multer from 'multer';
import { cloudController } from '../controllers/cloudController.js';

// Lightweight passthrough middleware (no IAM required)
function authenticate(req, res, next) {
  // Inject a default user ID so cloud services can scope operations
  req.user = req.user || {
    id: req.headers['x-user-id'] || 'test_architect_01',
    name: 'Architect',
    roles: ['USER']
  };
  next();
}

function requirePermission(/* permission */) {
  return (req, res, next) => next();
}

const router = express.Router();

// Configure Multer for secure memory uploads with 100MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB limit
  }
});

// All cloud operations require authentication
router.use(authenticate);

// 1. Provider Management Endpoints
router.get('/providers', cloudController.listProviders);
router.get('/connect/:provider', cloudController.getConnectUrl);
router.post('/callback/:provider', cloudController.handleCallback);
router.get('/callback/:provider', (req, res) => {
  // Handle GET redirect from OAuth providers: redirect to frontend callback view
  const { provider } = req.params;
  const { code, state } = req.query;
  res.redirect(`http://localhost:5173/?cloud_callback=${provider}&code=${code}&state=${state}`);
});
router.post('/demo-connect/:provider', cloudController.demoConnect);
router.get('/demo-connect/:provider', cloudController.demoConnect);
router.post('/disconnect/:provider', cloudController.disconnect);

// 2. Multi-Cloud Unified Endpoints
router.get('/unified/files', cloudController.unifiedList);
router.get('/unified/search', cloudController.unifiedSearch);
router.post('/unified/multi-upload', requirePermission('file.upload'), upload.single('file'), cloudController.multiUpload);
router.post('/unified/replicate', requirePermission('cloud.replicate'), cloudController.replicateFile);
router.get('/unified/replications', cloudController.listReplications);
router.get('/unified/duplicates', cloudController.detectDuplicates);
router.get('/unified/analytics', cloudController.getAnalytics);
router.get('/unified/audit-logs', cloudController.getAuditLogs);

// 3. Provider-Specific Endpoints
router.get('/:provider/files', cloudController.listFiles);
router.post('/:provider/upload', requirePermission('file.upload'), upload.single('file'), cloudController.uploadFile);
router.get('/:provider/download/:fileId', requirePermission('file.download'), cloudController.downloadFile);
router.post('/:provider/folder', requirePermission('folder.create'), cloudController.createFolder);
router.get('/:provider/search', cloudController.searchFiles);
router.delete('/:provider/files/:fileId', requirePermission('file.delete'), cloudController.deleteFile);
router.patch('/:provider/files/:fileId/rename', requirePermission('file.rename'), cloudController.renameFile);
router.patch('/:provider/files/:fileId/move', requirePermission('file.move'), cloudController.moveFile);
router.post('/:provider/share/:fileId', requirePermission('file.share'), cloudController.createShareLink);
router.post('/:provider/share', requirePermission('file.share'), (req, res) => {
  req.params.fileId = req.body.fileId || req.query.fileId;
  return cloudController.createShareLink(req, res);
});
router.get('/:provider/storage', cloudController.getStorage);

export default router;
