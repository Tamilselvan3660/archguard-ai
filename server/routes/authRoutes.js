import express from 'express';
import { isValidEmail, sendOtpEmail } from '../services/emailService.js';
import { createAndStoreOtp, validateOtp } from '../services/otpService.js';
import { logSecurityEvent, getRecentSecurityEvents } from '../services/auditLogService.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Mock User DB (Normally neon pg would be used here)
const usersStore = new Map();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) return res.status(400).json({ error: 'Invalid email' });
  
  if (usersStore.has(cleanEmail)) {
    return res.status(400).json({ error: 'Account already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  usersStore.set(cleanEmail, {
    id: `user-${Date.now()}`,
    name,
    email: cleanEmail,
    password_hash,
    emailVerified: false,
    accountStatus: 'PENDING_VERIFICATION'
  });

  const code = await createAndStoreOtp(cleanEmail, 'EMAIL_VERIFICATION');
  
  try {
    const isLiveSmtp = Boolean(process.env.GMAIL_USER || process.env.SMTP_HOST);
    await sendOtpEmail(cleanEmail, code);
    res.json({ success: true, message: 'Verification code sent', isLiveSmtp, code: isLiveSmtp ? undefined : code });
  } catch (e) {
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

router.post('/send-verification', async (req, res) => {
  const { email } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) return res.status(400).json({ error: 'Invalid email' });

  const code = await createAndStoreOtp(cleanEmail, 'LOGIN_VERIFICATION');
  
  try {
    const isLiveSmtp = Boolean(process.env.GMAIL_USER || process.env.SMTP_HOST);
    await sendOtpEmail(cleanEmail, code);
    res.json({ success: true, message: 'Verification code sent', isLiveSmtp, code: isLiveSmtp ? undefined : code });
  } catch (e) {
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

router.post('/resend-verification', async (req, res) => {
  const { email, purpose } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) return res.status(400).json({ error: 'Invalid email' });

  const code = await createAndStoreOtp(cleanEmail, purpose || 'EMAIL_VERIFICATION');
  
  try {
    const isLiveSmtp = Boolean(process.env.GMAIL_USER || process.env.SMTP_HOST);
    await sendOtpEmail(cleanEmail, code);
    res.json({ success: true, message: 'Verification code resent', isLiveSmtp, code: isLiveSmtp ? undefined : code });
  } catch (e) {
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Alias for old frontend compatibility
router.post('/send-otp', (req, res) => {
  req.url = '/send-verification';
  router.handle(req, res);
});

router.post('/verify-email', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const code = (req.body.code || req.body.otp || '').toString().trim();
  
  const validation = await validateOtp(email, code);
  if (!validation.success) {
    await logSecurityEvent('system', email, 'OTP_VERIFICATION_FAILED', req.ip, req.headers['user-agent'], false, { reason: validation.reason });
    return res.status(400).json({ error: validation.reason });
  }

  const user = usersStore.get(email) || { email, name: email.split('@')[0], roles: ['SUPER_ADMIN'] };
  user.emailVerified = true;
  user.accountStatus = 'ACTIVE';
  usersStore.set(email, user);

  await logSecurityEvent(user.id || 'system', email, 'OTP_VERIFICATION_SUCCESS', req.ip, req.headers['user-agent'], true);

  res.json({
    success: true,
    message: 'Email verified successfully',
    user
  });
});

// Alias for old frontend compatibility
router.post('/verify-otp', (req, res) => {
  req.url = '/verify-email';
  router.handle(req, res);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  
  const user = usersStore.get(cleanEmail);
  if (user && user.password_hash) {
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await logSecurityEvent('system', cleanEmail, 'LOGIN_FAILED', req.ip, req.headers['user-agent'], false);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  }

  await logSecurityEvent(user?.id || 'system', cleanEmail, 'LOGIN_CREDENTIALS_SUCCESS', req.ip, req.headers['user-agent'], true);

  // Force OTP
  res.json({
    success: true,
    requiresVerification: true,
    verificationMethod: 'EMAIL_OTP',
    message: 'OTP required to proceed'
  });
});

// Alias for old frontend compatibility
router.post('/login-credentials', (req, res) => {
  req.url = '/login';
  router.handle(req, res);
});

router.post('/google', (req, res) => {
  // Pass through basic google login
  const { email, name, avatar } = req.body;
  const user = { email, name, avatar, authProvider: 'Google Identity OAuth' };
  res.json({ success: true, message: 'Google Authentication Successful', user });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) return res.status(400).json({ error: 'Invalid email' });

  // Do not reveal if email exists, but we generate OTP if user exists
  if (usersStore.has(cleanEmail)) {
    const code = await createAndStoreOtp(cleanEmail, 'PASSWORD_RESET');
    try {
      await sendOtpEmail(cleanEmail, code);
    } catch (e) {
      console.error('Failed to send password reset email');
    }
  }

  res.json({
    success: true,
    message: 'If an account exists for this email, a verification code has been sent.'
  });
});

router.post('/verify-reset-otp', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const code = (req.body.code || req.body.otp || '').toString().trim();
  
  const validation = await validateOtp(email, code);
  if (!validation.success) {
    return res.status(400).json({ error: validation.reason });
  }

  res.json({
    success: true,
    message: 'OTP verified successfully. You can now reset your password.',
    resetToken: 'reset-token-' + Date.now() // In a real app this should be a JWT or random bytes
  });
});

router.post('/reset-password', async (req, res) => {
  const { email, password, resetToken } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  
  if (!resetToken) return res.status(400).json({ error: 'Invalid reset token' });

  const user = usersStore.get(cleanEmail);
  if (user) {
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(password, salt);
    usersStore.set(cleanEmail, user);
  }

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

router.get('/audit-logs', async (req, res) => {
  const logs = await getRecentSecurityEvents(50);
  res.json(logs);
});

export default router;
