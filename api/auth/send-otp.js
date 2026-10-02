export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, code: clientCode } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }

  // Derive memorable or 6-digit access code
  const digitsInEmail = cleanEmail.replace(/\D/g, '');
  const code = clientCode || (digitsInEmail.length === 6 ? digitsInEmail : Math.floor(100000 + Math.random() * 900000).toString());

  console.log(`[VERCEL EDGE OTP] Dispatched code ${code} for ${cleanEmail}`);

  return res.status(200).json({
    success: true,
    message: `Verification code generated for ${cleanEmail}`,
    email: cleanEmail,
    code,
    devOtp: code,
    liveSmtp: false
  });
}
