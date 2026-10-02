# Unified Multi-Cloud Storage Platform Architecture

## Executive Overview

The **Unified Multi-Cloud Storage Platform** provides a vendor-neutral, provider-independent abstraction layer connecting:
- **Google Drive** (via Google Identity OAuth 2.0 & Google Drive v3 REST API)
- **Microsoft OneDrive** (via Microsoft Identity Platform & Microsoft Graph v1.0 API)
- **MEGA** (via cryptographic session key derivation & MEGA SDK adapter)

The platform enables users to connect multiple cloud storage providers simultaneously, view unified or provider-partitioned file trees, execute parallel smart multi-uploads, automate cross-cloud replication, and mitigate redundant storage costs via SHA-256 content deduplication.

---

## 1. System Architecture

```text
                               ┌────────────────────────────────────────┐
                               │           ARCHGUARD FRONTEND           │
                               │      (Multi-Cloud Storage Center)      │
                               └───────────────────┬────────────────────┘
                                                   │
                                                   │ REST API (/api/cloud/*)
                                                   │ Header: x-user-id
                                                   ▼
                               ┌────────────────────────────────────────┐
                               │          CloudStorageManager           │
                               │     (Orchestration & Abstraction)      │
                               └───────┬───────────┼───────────┬────────┘
                                       │           │           │
                 ┌─────────────────────┘           │           └─────────────────────┐
                 ▼                                 ▼                                 ▼
      ┌─────────────────────┐           ┌─────────────────────┐           ┌─────────────────────┐
      │ GoogleDriveProvider │           │    OneDriveProvider │           │     MegaProvider    │
      └──────────┬──────────┘           └──────────┬──────────┘           └──────────┬──────────┘
                 │                                 │                                 │
                 │ Google OAuth 2.0                │ Microsoft Graph v1.0            │ Encrypted Session
                 ▼                                 ▼                                 ▼
         [Google Drive API]               [Microsoft OneDrive]                [MEGA Storage]
```

### Core Abstraction Components

1. **`CloudStorageProvider` (`server/services/cloud/CloudStorageProvider.js`)**:
   Abstract base class defining the provider contract:
   - `getAuthUrl(state)`: Produces secure OAuth 2.0 redirect URL.
   - `authenticate(userId, payload)`: Exchanges authorization code for encrypted tokens.
   - `listFiles(userId, folderId)`: Returns normalized file models.
   - `uploadFile(userId, buffer, meta)`: Streams file payload to target provider.
   - `downloadFile(userId, fileId)`: Streams binary file payload.
   - `createFolder(userId, name, parentId)`: Creates hierarchical folder.
   - `deleteFile(userId, fileId)`: Deletes file/folder on provider.
   - `renameFile(userId, fileId, newName)`: Updates file/folder label.
   - `moveFile(userId, fileId, newParentId)`: Moves item to target folder.
   - `searchFiles(userId, query)`: Queries provider by keyword.
   - `getStorageInfo(userId)`: Queries storage quota and utilization.
   - `createShareLink(userId, fileId)`: Generates shareable read/view URLs.
   - `disconnect(userId)`: Revokes credentials and purges tokens.

2. **`CloudStorageManager` (`server/services/cloud/CloudStorageManager.js`)**:
   Central orchestrator:
   - Maintains registered provider adapters in an extensible map (`Map<string, CloudStorageProvider>`).
   - Powers **Smart Multi-Upload**: dispatches upload streams to multiple selected clouds in parallel.
   - Powers **Cross-Cloud Replication**: streams a file directly from source provider to one or more backup destinations.
   - Powers **SHA-256 Duplicate Detection**: detects cross-provider identical files to prevent wasted quota.
   - Aggregates storage analytics across all active connections.

---

## 2. Normalized Unified File Model

All providers return a consistent normalized model. Frontend components never interact with provider-specific schemas:

```json
{
  "id": "provider-specific-file-id",
  "name": "enterprise-architecture-spec.pdf",
  "type": "file",
  "mimeType": "application/pdf",
  "size": 10485760,
  "provider": "google_drive",
  "parentId": "folder-id-or-null",
  "createdAt": "2026-10-01T10:00:00.000Z",
  "modifiedAt": "2026-10-01T12:00:00.000Z",
  "downloadAvailable": true,
  "shareAvailable": true,
  "sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a"
}
```

For folders:
```json
{
  "id": "folder-id",
  "name": "Architecture Backups",
  "type": "folder",
  "mimeType": "application/vnd.google-apps.folder",
  "size": 0,
  "provider": "onedrive",
  "parentId": null,
  "downloadAvailable": false,
  "shareAvailable": false
}
```

---

## 3. Extensibility: Adding Future Providers

To add a new provider (e.g. Dropbox, AWS S3, or Cloudflare R2):
1. Subclass `CloudStorageProvider`:
   ```javascript
   export class S3Provider extends CloudStorageProvider {
     constructor() {
       super('aws_s3', 'Amazon S3', { replication: true, shareLink: true });
     }
     // Implement the contract methods
   }
   ```
2. Register the adapter in `CloudStorageManager`:
   ```javascript
   import { S3Provider } from './S3Provider.js';
   this.registerProvider(new S3Provider());
   ```
No frontend modifications or controller rewrites are required.
