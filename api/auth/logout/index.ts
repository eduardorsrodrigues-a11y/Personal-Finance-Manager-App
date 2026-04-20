import { clearSessionCookie } from '../../_lib/session.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  clearSessionCookie(res);

  res.writeHead(302, { Location: '/login' }).end();
}

