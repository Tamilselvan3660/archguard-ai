/**
 * CloudStorageProvider — Unified Provider Abstraction Interface
 * 
 * All provider adapters (Google Drive, MEGA, Microsoft OneDrive) MUST implement
 * this abstract interface. The frontend and application controllers communicate
 * solely via this contract.
 */

export class CloudStorageProvider {
  /**
   * @param {string} providerName - Unique provider identifier ('google_drive', 'mega', 'onedrive')
   * @param {string} displayName - Human-readable label ('Google Drive', 'MEGA', 'OneDrive')
   * @param {object} capabilities - Feature support matrix
   */
  constructor(providerName, displayName, capabilities = {}) {
    if (new.target === CloudStorageProvider) {
      throw new TypeError('Cannot construct abstract CloudStorageProvider instances directly.');
    }
    this.name = providerName;
    this.displayName = displayName;
    this.capabilities = {
      upload: true,
      download: true,
      search: true,
      createFolder: true,
      shareLink: true,
      move: true,
      rename: true,
      delete: true,
      replication: true,
      ...capabilities
    };
  }

  /**
   * Returns provider capabilities matrix
   */
  getCapabilities() {
    return { ...this.capabilities };
  }

  /**
   * Generate OAuth authorization URL or credentials challenge
   * @param {string} state - CSRF state token
   * @returns {Promise<{ authUrl: string, state: string }>}
   */
  async getAuthUrl(state) {
    throw new Error(`getAuthUrl() not implemented on ${this.name}`);
  }

  /**
   * Complete authentication by exchanging auth code or session tokens
   * @param {string} userId
   * @param {object} authPayload - { code, redirectUri, credentials, etc. }
   * @returns {Promise<{ success: boolean, accountEmail: string, providerUserId: string }>}
   */
  async authenticate(userId, authPayload) {
    throw new Error(`authenticate() not implemented on ${this.name}`);
  }

  /**
   * Get connected user account metadata
   * @param {string} userId
   * @returns {Promise<{ email: string, name: string, id: string }>}
   */
  async getUserInfo(userId) {
    throw new Error(`getUserInfo() not implemented on ${this.name}`);
  }

  /**
   * List files and folders in normalized format
   * @param {string} userId
   * @param {string|null} folderId
   * @returns {Promise<Array<NormalizedFile>>}
   */
  async listFiles(userId, folderId = null) {
    throw new Error(`listFiles() not implemented on ${this.name}`);
  }

  /**
   * Upload file to provider
   * @param {string} userId
   * @param {Buffer|ReadableStream} fileBuffer
   * @param {object} metadata - { name, mimeType, size, parentId, sha256 }
   * @returns {Promise<NormalizedFile>}
   */
  async uploadFile(userId, fileBuffer, metadata) {
    throw new Error(`uploadFile() not implemented on ${this.name}`);
  }

  /**
   * Download file content stream
   * @param {string} userId
   * @param {string} fileId
   * @returns {Promise<{ stream: ReadableStream|Buffer, mimeType: string, filename: string, size: number }>}
   */
  async downloadFile(userId, fileId) {
    throw new Error(`downloadFile() not implemented on ${this.name}`);
  }

  /**
   * Create folder
   * @param {string} userId
   * @param {string} folderName
   * @param {string|null} parentId
   * @returns {Promise<NormalizedFile>}
   */
  async createFolder(userId, folderName, parentId = null) {
    throw new Error(`createFolder() not implemented on ${this.name}`);
  }

  /**
   * Delete file or folder
   * @param {string} userId
   * @param {string} fileId
   * @returns {Promise<{ success: boolean, fileId: string }>}
   */
  async deleteFile(userId, fileId) {
    throw new Error(`deleteFile() not implemented on ${this.name}`);
  }

  /**
   * Rename file or folder
   * @param {string} userId
   * @param {string} fileId
   * @param {string} newName
   * @returns {Promise<NormalizedFile>}
   */
  async renameFile(userId, fileId, newName) {
    throw new Error(`renameFile() not implemented on ${this.name}`);
  }

  /**
   * Move file or folder to new parent
   * @param {string} userId
   * @param {string} fileId
   * @param {string|null} newParentId
   * @returns {Promise<NormalizedFile>}
   */
  async moveFile(userId, fileId, newParentId) {
    throw new Error(`moveFile() not implemented on ${this.name}`);
  }

  /**
   * Search files matching query
   * @param {string} userId
   * @param {string} query
   * @returns {Promise<Array<NormalizedFile>>}
   */
  async searchFiles(userId, query) {
    throw new Error(`searchFiles() not implemented on ${this.name}`);
  }

  /**
   * Get storage usage metrics
   * @param {string} userId
   * @returns {Promise<{ usedBytes: number, totalBytes: number, availableBytes: number, percentUsed: number }>}
   */
  async getStorageInfo(userId) {
    throw new Error(`getStorageInfo() not implemented on ${this.name}`);
  }

  /**
   * Generate a shareable link
   * @param {string} userId
   * @param {string} fileId
   * @returns {Promise<{ shareLink: string, permission: string }>}
   */
  async createShareLink(userId, fileId) {
    throw new Error(`createShareLink() not implemented on ${this.name}`);
  }

  /**
   * Disconnect and revoke tokens
   * @param {string} userId
   * @returns {Promise<{ success: boolean }>}
   */
  async disconnect(userId) {
    throw new Error(`disconnect() not implemented on ${this.name}`);
  }
}
