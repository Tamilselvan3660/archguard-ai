import EmailProvider from './EmailProvider.js';

export default class ResendProvider extends EmailProvider {
  constructor() {
    super();
    this.apiKey = process.env.RESEND_API_KEY;
    this.fromAddress = process.env.RESEND_FROM || 'security@archguard.ai';
  }

  async sendMail(toEmail, subject, textContent, htmlContent) {
    if (!this.apiKey) throw new Error('RESEND_API_KEY is not configured');

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: this.fromAddress,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Resend API Error: ${data.message || JSON.stringify(data)}`);
    }

    return {
      success: true,
      messageId: data.id
    };
  }

  async isHealthy() {
    return !!this.apiKey;
  }
}
