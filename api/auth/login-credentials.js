export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, username, role } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const isTamil = cleanEmail.includes('selvan') || cleanEmail.includes('tamil') || cleanEmail === 'selvantamil84786@gmail.com';
  const isSiva = cleanEmail.includes('sivakumar') || cleanEmail === 'sivakumar463703@gmail.com';

  const user = {
    id: `user-${Date.now()}`,
    name: username || (isSiva ? 'Sivakumar' : (isTamil ? 'Tamil Selvan' : cleanEmail.split('@')[0])),
    username: username || (isSiva ? 'Sivakumar' : (isTamil ? 'Tamil Selvan' : cleanEmail.split('@')[0])),
    email: cleanEmail,
    role: role || ((isSiva || isTamil) ? 'Chief Software Architect' : 'Staff Architect'),
    avatar: isSiva ? 'SK' : (isTamil ? 'TS' : cleanEmail.slice(0, 2).toUpperCase()),
    color: isSiva ? '#0284c7' : '#2563eb',
    authProvider: 'Account Credentials',
    roles: ['SUPER_ADMIN', 'CHIEF_ARCHITECT']
  };

  return res.status(200).json({
    success: true,
    message: 'Authenticated successfully',
    user
  });
}
