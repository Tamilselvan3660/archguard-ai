import SmtpProvider from './email/SmtpProvider.js';
import ResendProvider from './email/ResendProvider.js';
import DevLoggerProvider from './email/DevLoggerProvider.js';

let activeProvider = null;

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

export function getProvider() {
  if (activeProvider) return activeProvider;

  if (process.env.RESEND_API_KEY) {
    activeProvider = new ResendProvider();
    console.log('📧 [EMAIL SERVICE] Initialized with ResendProvider');
  } else if (process.env.SMTP_HOST || process.env.GMAIL_USER) {
    activeProvider = new SmtpProvider();
    console.log('📧 [EMAIL SERVICE] Initialized with SmtpProvider');
  } else {
    activeProvider = new DevLoggerProvider();
    console.log('📧 [EMAIL SERVICE] Initialized with DevLoggerProvider');
  }

  return activeProvider;
}

export async function sendOtpEmail(toEmail, otpCode) {
  const provider = getProvider();
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="background-color: #050b14; color: #f1f5f9; font-family: sans-serif; padding: 20px;">
  <h2>ARCHGUARD AI Security Code</h2>
  <p>Your 6-digit verification code is:</p>
  <div style="font-size: 32px; font-weight: bold; color: #38bdf8;">${otpCode}</div>
  <p>Valid for 5 minutes. Do not share.</p>
</body>
</html>
  `.trim();

  const textContent = `Your ARCHGUARD AI code is: ${otpCode}. Valid for 5 mins.`;

  return provider.sendMail(
    toEmail,
    `🛡️ Your ARCHGUARD AI Verification Code: ${otpCode}`,
    textContent,
    htmlContent
  );
}

export default {
  isValidEmail,
  sendOtpEmail
};
