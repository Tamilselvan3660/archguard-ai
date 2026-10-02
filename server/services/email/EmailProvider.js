/**
 * Base abstract class for Email Providers
 */
export default class EmailProvider {
  /**
   * Send an email. Must be implemented by subclasses.
   * @param {string} toEmail 
   * @param {string} subject 
   * @param {string} textContent 
   * @param {string} htmlContent 
   * @returns {Promise<{success: boolean, messageId?: string, previewUrl?: string}>}
   */
  async sendMail(toEmail, subject, textContent, htmlContent) {
    throw new Error('sendMail() must be implemented by concrete EmailProvider');
  }

  /**
   * Health check to ensure provider is configured
   */
  async isHealthy() {
    return false;
  }
}
