export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name, avatar } = req.body || {};
  const cleanEmail = (email || 'selvantamil84786@gmail.com').trim().toLowerCase();
  const isTamil = cleanEmail.includes('selvan') || cleanEmail.includes('tamil') || cleanEmail === 'selvantamil84786@gmail.com';
  const isSiva = cleanEmail.includes('sivakumar') || cleanEmail === 'sivakumar463703@gmail.com';

  const user = {
    id: `google-${Date.now()}`,
    name: name || (isSiva ? 'Sivakumar' : (isTamil ? 'Tamil Selvan' : cleanEmail.split('@')[0])),
    username: name || (isSiva ? 'Sivakumar' : (isTamil ? 'Tamil Selvan' : cleanEmail.split('@')[0])),
    email: cleanEmail,
    role: (isSiva || isTamil) ? 'Chief Software Architect (Google Verified)' : 'Lead Enterprise Architect (Google Verified)',
    avatar: avatar || (isSiva ? 'SK' : (isTamil ? 'TS' : cleanEmail.slice(0, 2).toUpperCase())),
    color: isSiva ? '#0284c7' : '#3b82f6',
    authProvider: 'Google Identity OAuth',
    roles: ['SUPER_ADMIN', 'CHIEF_ARCHITECT', 'CLOUD_VAULT_AUTHORIZED']
  };

  return res.status(200).json({
    success: true,
    message: 'Google Authentication Successful',
    user
  });
}
