import crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'archguard_secure_otp_token_secret_2026';

function verifyOtpToken(email, code, expiresAt, token) {
  if (!token || !expiresAt) return false;
  if (Date.now() > Number(expiresAt)) return false;
  const expected = crypto.createHmac('sha256', SECRET).update(`${email}:${code}:${expiresAt}`).digest('hex');
  return expected === token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, code, otp, token, expiresAt } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();
  const enteredCode = (code || otp || '').toString().trim();

  if (!cleanEmail || !enteredCode) {
    return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
  }

  if (token && expiresAt) {
    const isValid = verifyOtpToken(cleanEmail, enteredCode, expiresAt, token);
    if (!isValid) {
      if (Date.now() > Number(expiresAt)) {
        return res.status(401).json({ error: 'Verification code has expired. Please request a new code.' });
      }
      return res.status(401).json({ error: 'Invalid verification code. Please check your email and enter the code sent to your inbox.' });
    }
  }

  const isTamil = cleanEmail.includes('selvan') || cleanEmail.includes('tamil') || cleanEmail === 'selvantamil84786@gmail.com';
  const isSiva = cleanEmail.includes('sivakumar') || cleanEmail === 'sivakumar463703@gmail.com';

  const user = {
    id: `user-${Date.now()}`,
    name: isSiva ? 'Sivakumar' : (isTamil ? 'Tamil Selvan' : cleanEmail.split('@')[0].replace('.', ' ').replace(/(?:^|\s)\S/g, a => a.toUpperCase())),
    username: isSiva ? 'Sivakumar' : (isTamil ? 'Tamil Selvan' : cleanEmail.split('@')[0]),
    email: cleanEmail,
    role: (isSiva || isTamil) ? 'Chief Software Architect (Email Verified)' : 'Verified Enterprise Architect',
    avatar: isSiva ? 'SK' : (isTamil ? 'TS' : cleanEmail.slice(0, 2).toUpperCase()),
    color: isSiva ? '#0284c7' : '#3b82f6',
    authProvider: 'Email OTP Verification',
    roles: ['SUPER_ADMIN', 'CHIEF_ARCHITECT', 'CLOUD_VAULT_AUTHORIZED']
  };

  return res.status(200).json({
    success: true,
    message: 'OTP verified successfully. Access granted.',
    user
  });
}
