import { createAndStoreOtp } from '../services/otpService.js';
import { sendOtpEmail } from '../services/emailService.js';

export const requireRecentVerification = (minutes = 15) => {
  return async (req, res, next) => {
    // In a real app with JWT sessions, req.user would have `last_verified_at`.
    // We mock this by checking a header or standardizing it to false for step-up demo.
    const lastVerified = req.headers['x-last-verified'];
    const email = req.headers['x-user-email'] || req.user?.email || 'sivakumar463703@gmail.com'; // fallback for demo

    if (lastVerified) {
      const verifiedTime = new Date(lastVerified).getTime();
      const now = Date.now();
      if (now - verifiedTime <= minutes * 60 * 1000) {
        return next();
      }
    }

    // Needs step-up verification
    console.log(`[VERIFICATION MIDDLEWARE] Step-up required for ${email}`);
    
    // Auto-generate and send OTP for step-up
    try {
      const code = await createAndStoreOtp(email, 'SENSITIVE_ACTION', minutes);
      await sendOtpEmail(email, code);
    } catch (e) {
      console.warn('Could not send step-up OTP email:', e.message);
    }

    return res.status(403).json({
      error: 'Step-up verification required',
      requiresVerification: true,
      verificationMethod: 'EMAIL_OTP',
      verificationPurpose: 'SENSITIVE_ACTION',
      message: 'Sensitive action requested. An OTP has been sent to your email. Please verify to proceed.',
      email: email
    });
  };
};
