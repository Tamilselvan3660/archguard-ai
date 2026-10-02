/**
 * ARCHGUARD AI — Email Notification & Authentication Service
 * 
 * Provides automated email delivery for:
 * - Enterprise OTP Authentication Codes
 * - Architecture Drift Alert Notifications
 * - Security & Compliance Violation Alerts
 * 
 * Configurable via .env:
 * - GMAIL_USER & GMAIL_APP_PASSWORD
 * - or SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE
 * - Automatic Ethereal test inbox fallback for local dev when no credentials provided
 */

import nodemailer from 'nodemailer';

/**
 * Validates whether an email string meets standard RFC syntax.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  // Standard RFC 5322 compliant regex for web applications
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

let cachedTransporter = null;
let etherealAccount = null;

/**
 * Creates or retrieves the active Nodemailer transporter.
 */
export async function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
    GMAIL_USER,
    GMAIL_APP_PASSWORD
  } = process.env;

  // 1. Gmail Dedicated Configuration
  if (GMAIL_USER && (GMAIL_APP_PASSWORD || SMTP_PASS)) {
    try {
      cachedTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD || SMTP_PASS
        }
      });
      console.log(`📧 [EMAIL SERVICE] Initialized with Gmail SMTP account: ${GMAIL_USER}`);
      return cachedTransporter;
    } catch (err) {
      console.error('❌ [EMAIL SERVICE] Failed to initialize Gmail transport:', err.message);
    }
  }

  // 2. Custom Enterprise SMTP Server
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const port = Number(SMTP_PORT) || 587;
      const secure = SMTP_SECURE === 'true' || port === 465;

      cachedTransporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      console.log(`📧 [EMAIL SERVICE] Initialized with SMTP: ${SMTP_HOST}:${port} (${SMTP_USER})`);
      return cachedTransporter;
    } catch (err) {
      console.error('❌ [EMAIL SERVICE] Failed to initialize custom SMTP transport:', err.message);
    }
  }

  // 3. Fallback: Ethereal Mail for Instant Zero-Config Dev Testing
  console.log('ℹ️  [EMAIL SERVICE] No live SMTP credentials found in .env.');
  console.log('ℹ️  [EMAIL SERVICE] Provisioning Ethereal development mail transport...');

  try {
    etherealAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: etherealAccount.smtp.host,
      port: etherealAccount.smtp.port,
      secure: etherealAccount.smtp.secure,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass
      }
    });
    console.log(`✅ [EMAIL SERVICE] Ethereal Dev Mailbox ready: ${etherealAccount.user}`);
    return cachedTransporter;
  } catch (err) {
    console.warn('⚠️  [EMAIL SERVICE] Ethereal offline, falling back to console logger transport:', err.message);
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true
    });
    return cachedTransporter;
  }
}

/**
 * Sends a 6-digit OTP verification code to the specified user email address.
 * 
 * @param {string} toEmail - Recipient email
 * @param {string} otpCode - 6-digit one-time passcode
 * @returns {Promise<{ success: boolean, messageId?: string, previewUrl?: string }>}
 */
export async function sendOtpEmail(toEmail, otpCode) {
  if (!isValidEmail(toEmail)) {
    throw new Error(`Invalid recipient email address: "${toEmail}"`);
  }

  const transporter = await getTransporter();

  const fromAddress = process.env.SMTP_FROM || 
    (process.env.GMAIL_USER ? `"ARCHGUARD AI Security" <${process.env.GMAIL_USER}>` : '"ARCHGUARD AI Security" <security@archguard.ai>');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARCHGUARD AI Security Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #050b14; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width: 560px; width: 100%; background: #0c1524; border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 36px 24px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-bottom: 1px solid rgba(56, 189, 248, 0.2);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; font-size: 26px; font-weight: 800; letter-spacing: 0.05em; color: #ffffff;">
                      <span style="color: #38bdf8; margin-right: 6px;">🛡️</span>ARCHGUARD <span style="color: #38bdf8;">AI</span>
                    </div>
                    <div style="font-size: 12px; color: #94a3b8; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px; font-weight: 600;">
                      Software Architecture Drift Intelligence &amp; Governance
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #ffffff;">
                Your Portal Verification Code
              </h1>
              
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Hello,
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                You requested a One-Time Passcode (OTP) to authenticate into the <strong>ARCHGUARD AI Enterprise Portal</strong>. Please use the verification code below to complete your login:
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="background: rgba(15, 23, 42, 0.85); border: 2px solid #38bdf8; border-radius: 12px; padding: 24px 16px; text-align: center; box-shadow: inset 0 0 20px rgba(56, 189, 248, 0.15);">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #94a3b8; margin-bottom: 8px; font-weight: 700;">
                      One-Time Login Code
                    </div>
                    <div style="font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #38bdf8; margin: 6px 0 6px 12px; text-shadow: 0 0 12px rgba(56, 189, 248, 0.5);">
                      ${otpCode}
                    </div>
                    <div style="font-size: 12px; color: #fbbf24; margin-top: 8px; font-weight: 600;">
                      ⏱️ Valid for 5 minutes only
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Instructions -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(30, 41, 59, 0.5); border-left: 3px solid #38bdf8; border-radius: 4px; padding: 14px 16px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 12px; line-height: 1.6; color: #94a3b8;">
                    <strong style="color: #e2e8f0;">Security Notice:</strong> Do not share this 6-digit code with anyone. ARCHGUARD AI engineers or administrators will never ask for your verification code.
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                If you did not initiate this authentication request, someone may be attempting to sign in with your email address. You can safely ignore this email or review your enterprise identity settings.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 28px; background: #070e1b; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <p style="margin: 0 0 6px; font-size: 11px; color: #64748b; font-weight: 500;">
                ARCHGUARD AI Autonomous Architecture Intelligence &amp; Governance Platform
              </p>
              <p style="margin: 0; font-size: 10px; color: #475569;">
                This is an automated system notification. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const textContent = `
ARCHGUARD AI — Portal Authentication Code

Your 6-digit verification code is: ${otpCode}

This code is valid for 5 minutes.
Never share this code with anyone.

If you did not request this login code, you can safely ignore this email.
ARCHGUARD AI Enterprise Governance Platform
  `.trim();

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: `🛡️ Your ARCHGUARD AI Verification Code: ${otpCode}`,
    text: textContent,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(`✅ [EMAIL DISPATCHED] Sent OTP to <${toEmail}> | MessageId: ${info.messageId}`);
    if (previewUrl) {
      console.log(`🔗 [ETHEREAL PREVIEW URL] View sent email online: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null
    };
  } catch (sendErr) {
    console.error(`❌ [EMAIL DISPATCH ERROR] Failed to send email to <${toEmail}>:`, sendErr.message);
    throw sendErr;
  }
}

export default {
  isValidEmail,
  getTransporter,
  sendOtpEmail
};
