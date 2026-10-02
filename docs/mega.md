# MEGA Integration Guide & Security Architecture

## 1. Overview
The `MegaProvider` provides high-capacity (20 GB baseline free storage) multi-cloud storage integration with MEGA.

## 2. Zero Plaintext Password Architecture
**CRITICAL SECURITY PRINCIPLE**:
- Under no circumstances does ArchGuard store raw, plaintext user passwords for MEGA in any database, session store, memory cache, or log file.
- MEGA authentication utilizes cryptographic derivation:
  1. The master key is derived via PBKDF2 with client-side salt.
  2. The authentication token is hashed with HMAC-SHA256.
  3. The resulting session token is encrypted at rest using AES-256-GCM (`encryptToken()`).

## 3. Dedicated MegaProvider Adapter
The `MegaProvider` implements the identical interface as `GoogleDriveProvider` and `OneDriveProvider`:
```javascript
class MegaProvider extends CloudStorageProvider {
  async authenticate(userId, authPayload) { ... }
  async listFiles(userId, folderId) { ... }
  async uploadFile(userId, fileBuffer, metadata) { ... }
  async downloadFile(userId, fileId) { ... }
  async createFolder(userId, folderName, parentId) { ... }
  async deleteFile(userId, fileId) { ... }
  async renameFile(userId, fileId, newName) { ... }
  async moveFile(userId, fileId, newParentId) { ... }
  async searchFiles(userId, query) { ... }
  async getStorageInfo(userId) { ... }
  async createShareLink(userId, fileId) { ... }
  async disconnect(userId) { ... }
}
```

## 4. Capability Matrix & Graceful Degradation
Per Section 5 & 20 of the architecture specification:
- If a particular operation is unsupported by a provider, the provider declares it in its capability matrix (`getCapabilities()`).
- The frontend dynamically inspects capabilities and disables unsupported action buttons instead of fabricating fake success responses.

```javascript
{
  upload: true,
  download: true,
  search: true,
  createFolder: true,
  shareLink: true,
  move: true,
  rename: true,
  delete: true,
  replication: true
}
```

## 5. Storage Quota Inspection
MEGA accounts provide 20.0 GB of default encrypted storage capacity. Quota usage is accurately reported and converted into normalized bytes for aggregated multi-cloud capacity calculations.
