import nodemailer from 'nodemailer';
import EmailProvider from './EmailProvider.js';

export default class SmtpProvider extends EmailProvider {
  constructor() {
    super();
    this.transporter = null;
    this.fromAddress = process.env.SMTP_FROM || 
      (process.env.GMAIL_USER ? `"ARCHGUARD AI Security" <${process.env.GMAIL_USER}>` : '"ARCHGUARD AI Security" <security@archguard.ai>');
  }

  async initialize() {
    const {
      SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE,
      GMAIL_USER, GMAIL_APP_PASSWORD
    } = process.env;

    if (GMAIL_USER && (GMAIL_APP_PASSWORD || SMTP_PASS)) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD || SMTP_PASS
        }
      });
      return true;
    }

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      const port = Number(SMTP_PORT) || 587;
      const secure = SMTP_SECURE === 'true' || port === 465;
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST, port, secure,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        tls: { rejectUnauthorized: false }
      });
      return true;
    }

    return false;
  }

  async sendMail(toEmail, subject, textContent, htmlContent) {
    if (!this.transporter) await this.initialize();
    if (!this.transporter) throw new Error('SMTP Transport not initialized');

    const mailOptions = {
      from: this.fromAddress,
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent
    };

    const info = await this.transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId
    };
  }

  async isHealthy() {
    if (!this.transporter) {
      const init = await this.initialize();
      if (!init) return false;
    }
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
