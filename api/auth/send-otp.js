import crypto from 'crypto';
import nodemailer from 'nodemailer';

const SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'archguard_secure_otp_token_secret_2026';

function createOtpToken(email, code, expiresAt) {
  return crypto.createHmac('sha256', SECRET).update(`${email}:${code}:${expiresAt}`).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // Generate cryptographic 6-digit random code
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity
  const token = createOtpToken(cleanEmail, code, expiresAt);

  // Check if live SMTP credentials exist
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST;

  let emailDelivered = false;
  let deliveryError = null;

  if ((gmailUser && gmailPass) || (smtpHost && process.env.SMTP_USER && gmailPass)) {
    try {
      const transporter = nodemailer.createTransport(
        gmailUser
          ? {
              service: 'gmail',
              auth: { user: gmailUser, pass: gmailPass }
            }
          : {
              host: smtpHost,
              port: Number(process.env.SMTP_PORT) || 587,
              secure: process.env.SMTP_SECURE === 'true',
              auth: { user: process.env.SMTP_USER, pass: gmailPass }
            }
      );

      await transporter.sendMail({
        from: `"ARCHGUARD AI Security" <${gmailUser || process.env.SMTP_FROM || 'security@archguard.ai'}>`,
        to: cleanEmail,
        subject: `🛡️ Your ARCHGUARD AI Verification Code: ${code}`,
        text: `Your ARCHGUARD AI 6-digit login verification code is: ${code}\n\nThis code is valid for 10 minutes. Never share this code with anyone.`,
        html: `
          <div style="background:#0b0f19;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f8fafc;text-align:center;">
            <div style="max-width:480px;margin:0 auto;background:#151d30;border:1px solid rgba(56,189,248,0.3);border-radius:16px;padding:32px 24px;">
              <div style="font-size:3rem;margin-bottom:12px;">🛡️</div>
              <h1 style="color:#38bdf8;font-size:1.4rem;margin:0 0 8px;">ARCHGUARD<span style="color:#818cf8;">.AI</span></h1>
              <p style="color:#94a3b8;font-size:0.9rem;margin:0 0 24px;">Architecture Drift Detection & Governance Platform</p>
              <div style="background:#070b14;border:2px solid #38bdf8;border-radius:12px;padding:20px;margin-bottom:24px;">
                <div style="font-size:0.75rem;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Your 6-Digit One-Time Security Code</div>
                <div style="font-size:2.4rem;font-weight:800;letter-spacing:10px;color:#38bdf8;font-family:monospace;">${code}</div>
                <div style="font-size:0.78rem;color:#fbbf24;margin-top:8px;">⏱️ Valid for 10 minutes only</div>
              </div>
              <p style="color:#64748b;font-size:0.8rem;line-height:1.5;margin:0;">
                If you did not request this login code, you can safely ignore this email. No unauthorized user can enter without this code.
              </p>
            </div>
          </div>
        `
      });

      emailDelivered = true;
      console.log(`✅ [EMAIL SENT] Successfully delivered OTP to ${cleanEmail}`);
    } catch (err) {
      console.error(`❌ [EMAIL ERROR] Failed to send via SMTP to ${cleanEmail}:`, err.message);
      deliveryError = err.message;
    }
  } else {
    console.warn(`⚠️ [SMTP NOTICE] No GMAIL_USER/GMAIL_APP_PASSWORD found. Cannot deliver external email.`);
  }

  // Notice: The plain code is NEVER returned in the response!
  // Only the signed verification token is returned.
  return res.status(200).json({
    success: true,
    message: emailDelivered 
      ? `Verification code dispatched to ${cleanEmail}. Check your inbox.`
      : `OTP generated for ${cleanEmail}.`,
    email: cleanEmail,
    token,
    expiresAt,
    emailDelivered,
    needsSmtpConfig: !emailDelivered && !gmailUser
  });
}
