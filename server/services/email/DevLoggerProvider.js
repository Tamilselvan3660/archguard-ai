import nodemailer from 'nodemailer';
import EmailProvider from './EmailProvider.js';

export default class DevLoggerProvider extends EmailProvider {
  constructor() {
    super();
    this.transporter = null;
    this.etherealAccount = null;
  }

  async initialize() {
    try {
      this.etherealAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: this.etherealAccount.smtp.host,
        port: this.etherealAccount.smtp.port,
        secure: this.etherealAccount.smtp.secure,
        auth: {
          user: this.etherealAccount.user,
          pass: this.etherealAccount.pass
        }
      });
      console.log(`✅ [DEV EMAIL] Ethereal Sandbox ready: ${this.etherealAccount.user}`);
      return true;
    } catch (err) {
      console.warn('⚠️ Ethereal offline, falling back to console logger.');
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      return true;
    }
  }

  async sendMail(toEmail, subject, textContent, htmlContent) {
    if (!this.transporter) await this.initialize();
    
    const mailOptions = {
      from: '"ARCHGUARD AI Dev" <dev@archguard.local>',
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent
    };

    const info = await this.transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(`\n📧 [DEV EMAIL INTERCEPTED]`);
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    if (previewUrl) {
      console.log(`🔗 Preview: ${previewUrl}`);
    } else {
      console.log(`Content:\n${textContent}`);
    }
    console.log(`-----------------------------------------\n`);

    return {
      success: true,
      messageId: info.messageId,
      previewUrl
    };
  }

  async isHealthy() {
    return true; // Dev logger is always healthy
  }
}
