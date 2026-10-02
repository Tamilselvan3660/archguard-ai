# Microsoft OneDrive Integration Guide

## 1. Overview
The `OneDriveProvider` connects to personal and enterprise Microsoft OneDrive accounts via the **Microsoft Identity Platform (OAuth 2.0)** and the official **Microsoft Graph REST API v1.0**.

## 2. Microsoft Graph Permissions
The application requests the following delegate permissions:
- `Files.ReadWrite`: Grants read and write access to files the signed-in user has permission to access in OneDrive.
- `User.Read`: Reads the user's profile and principal name (email).
- `offline_access`: Grants long-lived refresh tokens for persistent background sync and replication without requiring repetitive user sign-in.

## 3. Environment Configuration
```env
MICROSOFT_CLIENT_ID=your-microsoft-app-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3001/api/cloud/callback/onedrive
```

## 4. Microsoft Graph v1.0 Endpoints
- **Drive Root Enumeration**:
  `GET https://graph.microsoft.com/v1.0/me/drive/root/children`
- **Subfolder Enumeration**:
  `GET https://graph.microsoft.com/v1.0/me/drive/items/{folderId}/children`
- **File Upload (Small to Medium < 4MB Direct Upload)**:
  `PUT https://graph.microsoft.com/v1.0/me/drive/items/{folderId}:/{filename}:/content`
- **Resumable Upload Sessions (> 4MB)**:
  `POST https://graph.microsoft.com/v1.0/me/drive/items/{folderId}:/{filename}:/createUploadSession`
- **File Download**:
  `GET https://graph.microsoft.com/v1.0/me/drive/items/{fileId}/content`
- **Folder Creation**:
  `POST https://graph.microsoft.com/v1.0/me/drive/items/{parentId}/children`
  Body: `{ "name": "Architecture", "folder": {}, "@microsoft.graph.conflictBehavior": "rename" }`
- **Sharing Link Creation**:
  `POST https://graph.microsoft.com/v1.0/me/drive/items/{fileId}/createLink`
  Body: `{ "type": "view", "scope": "anonymous" }`
- **Storage Quota**:
  `GET https://graph.microsoft.com/v1.0/me/drive`
  Extracts `quota.total`, `quota.used`, `quota.remaining`.

## 5. Token Refresh Workflow
The adapter checks token expiration prior to each API request:
```text
POST https://login.microsoftonline.com/common/oauth2/v2.0/token
client_id={MICROSOFT_CLIENT_ID}
client_secret={MICROSOFT_CLIENT_SECRET}
grant_type=refresh_token
refresh_token={decrypted_refresh_token}
```
All tokens are stored encrypted using AES-256-GCM.
