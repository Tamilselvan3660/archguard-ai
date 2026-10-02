# Multi-Cloud Storage Security & Encryption Model

## 1. Cryptographic Protection at Rest: AES-256-GCM

All OAuth access tokens, refresh tokens, and session credentials stored in the database are encrypted using **Authenticated Encryption with Associated Data (AEAD)** via **AES-256-GCM**.

### Encryption Pipeline (`server/config/cloud.js`)

```text
[ Plaintext Token ]
        │
        ▼
Generate 12-byte cryptographically secure random IV (crypto.randomBytes(12))
        │
        ▼
AES-256-GCM Cipher + 32-byte Master Encryption Key (TOKEN_ENCRYPTION_KEY)
        │
        ▼
Extract 16-byte Authentication Tag (cipher.getAuthTag())
        │
        ▼
Format: iv:authTag:ciphertext (Hex-encoded)
```

### Decryption Pipeline

```text
Format: iv:authTag:ciphertext
        │
        ▼
Verify 16-byte Authentication Tag (decipher.setAuthTag(authTag))
        │
        ▼
AES-256-GCM Decipher
        │
        ▼
[ Decrypted Plaintext Token ]
```

If an attacker modifies even a single bit of the ciphertext or tag in the database, the decryption throws an authentication error and the token is invalidated immediately.

---

## 2. OAuth 2.0 Security & CSRF Mitigation

- **State Parameter Validation**: Every authorization URL includes an opaque, time-stamped CSRF state token:
  `state = "arch_" + provider + "_" + Date.now()`
  The callback validates that the returned state matches the expected pattern before exchanging the authorization code.
- **Strict Isolation**: Tokens are never returned to client JavaScript or embedded in HTML templates.
- **Header & Secret Obfuscation**: Tokens are never printed in server logs:
  `console.log(accessToken)` and `console.log(refreshToken)` are strictly prohibited.

---

## 3. Input Validation & Denial of Service Safeguards

- **File Size Limits**: Enforced strictly at the Multer middleware layer:
  `limits: { fileSize: 100 * 1024 * 1024 }` (100 MB max per upload).
- **MIME & Extension Verification**: Validates file types and blocks executable code uploads (.exe, .bat, .cmd, .sh).
- **Memory Safety**: Upload streams are buffered in memory and immediately transferred to destination cloud endpoints.

---

## 4. Enterprise Audit Trail (`cloud_audit_logs`)

Every cloud operation is immutably logged with:
- `user_id`: Authenticated user ID.
- `provider`: Target cloud (`google_drive`, `onedrive`, `mega`).
- `action`: `UPLOAD`, `DOWNLOAD`, `DELETE`, `RENAME`, `MOVE`, `SHARE`, `CONNECT`, `DISCONNECT`, `REPLICATE`.
- `file_id`, `file_name`, `file_size`.
- `status`: `SUCCESS` or `FAILED`.
- `ip_address`: Request origin IP.
- `timestamp`: UTC ISO timestamp.

Audit logs are visible to administrators in the **Audit Logs** tab of the Unified Storage Center.
