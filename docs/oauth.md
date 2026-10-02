# OAuth 2.0 Configuration Guide (Google Cloud & Microsoft Azure)

This guide walks you step-by-step through creating the OAuth 2.0 credentials for Google Drive and Microsoft OneDrive.

---

## 1. Google Drive Setup (Google Cloud Console)

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one (e.g. `ArchGuard Multi-Cloud`).
3. Navigate to **APIs & Services > Library**.
4. Search for **Google Drive API** and click **Enable**.
5. Navigate to **APIs & Services > OAuth consent screen**:
   - User Type: Select **External** (or Internal for Google Workspace organizations).
   - App Information: Enter App name (`ArchGuard Cloud`), User support email, and Developer contact information.
   - Scopes: Add `https://www.googleapis.com/auth/drive.file` and `https://www.googleapis.com/auth/userinfo.email`.
   - Test Users: Add the email address of your test account.
6. Navigate to **APIs & Services > Credentials**:
   - Click **Create Credentials > OAuth client ID**.
   - Application type: **Web application**.
   - Name: `ArchGuard Drive Integration`.
   - Authorized redirect URIs:
     `http://localhost:3001/api/cloud/callback/google_drive`
7. Copy the generated **Client ID** and **Client Secret** into your `.env` file:
   ```env
   GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-secret
   GOOGLE_REDIRECT_URI=http://localhost:3001/api/cloud/callback/google_drive
   ```

---

## 2. Microsoft OneDrive Setup (Microsoft Entra ID / Azure Portal)

1. Open the [Microsoft Azure Portal](https://portal.azure.com/) or [Microsoft Entra admin center](https://entra.microsoft.com/).
2. Navigate to **Microsoft Entra ID > App registrations**.
3. Click **New registration**:
   - Name: `ArchGuard OneDrive Integration`.
   - Supported account types: Select **"Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"**.
   - Redirect URI (optional): Platform = **Web**, URI = `http://localhost:3001/api/cloud/callback/onedrive`.
   - Click **Register**.
4. Copy the **Application (client) ID** into `MICROSOFT_CLIENT_ID` in your `.env`.
5. Under **Certificates & secrets**:
   - Click **New client secret**.
   - Add a description (e.g. `ArchGuard Secret`) and choose an expiration period.
   - Copy the secret **Value** immediately into `MICROSOFT_CLIENT_SECRET` in your `.env`.
6. Under **API permissions**:
   - Click **Add a permission > Microsoft Graph > Delegated permissions**.
   - Search for and select:
     - `Files.ReadWrite`
     - `User.Read`
     - `offline_access`
   - Click **Add permissions**.

---

## 3. Instant Sandbox Testing (Zero External Setup Required)

If you wish to test the complete platform locally before registering Google or Microsoft API consoles:
1. Open the ArchGuard Multi-Cloud Storage Center.
2. Click **Connect** on Google Drive, OneDrive, or MEGA.
3. Select **"⚡ Instant Sandbox Mode"**.
4. The system immediately initializes a sandboxed storage engine that supports real uploads, downloads, folder creation, search, replication, duplicate detection, and quota tracking without requiring external API keys.
