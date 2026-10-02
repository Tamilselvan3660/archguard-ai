# Google Drive Integration Guide

## 1. Overview
The `GoogleDriveProvider` implements official OAuth 2.0 and Google Drive v3 REST API specifications for secure, production-grade cloud file management.

## 2. Minimum Required Permissions & Scopes
In accordance with the principle of least privilege, the integration requests only the minimum required scopes:
- `https://www.googleapis.com/auth/drive.file`: Allows creation, reading, modification, and deletion of files opened or created by this application only (protects existing unassociated personal Drive files).
- `https://www.googleapis.com/auth/userinfo.email`: Fetches the connected user's primary Google account email for connection card identification.
- `openid`: OpenID Connect token identity.

## 3. Environment Configuration
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/cloud/callback/google_drive
```

## 4. Token Lifecycle & Automatic Refresh
1. **Access Token Expiration**: Google access tokens typically expire in 3600 seconds (1 hour).
2. **Pre-flight Expiration Check**: Prior to executing any Google Drive v3 API call, `GoogleDriveProvider.getValidAccessToken(userId)` compares `Date.now()` with `token_expires_at`.
3. **Automatic Refresh**:
   If the token is expired (or expires within 5 minutes), the adapter calls:
   ```text
   POST https://oauth2.googleapis.com/token
   grant_type=refresh_token
   refresh_token={decrypted_token}
   ```
4. **Encrypted Storage Update**: The newly issued access token is re-encrypted with AES-256-GCM and stored.
5. **Re-authentication Catch**: If the refresh token has been revoked by the user, the connection status transitions to `reauth_required`.

## 5. API Endpoints Used
- `GET https://www.googleapis.com/drive/v3/files`: File listing and search queries with `q='...' and trashed=false`.
- `POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`: Stream upload with metadata.
- `GET https://www.googleapis.com/drive/v3/files/{fileId}?alt=media`: Binary stream download.
- `POST https://www.googleapis.com/drive/v3/files/{fileId}/permissions`: Generate public or domain viewable share links (`role: 'reader'`, `type: 'anyone'`).
- `GET https://www.googleapis.com/drive/v3/about?fields=storageQuota,user`: Quota inspection (15 GB standard free tier limit).
