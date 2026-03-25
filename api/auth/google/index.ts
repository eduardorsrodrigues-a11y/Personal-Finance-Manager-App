import crypto from 'crypto';
import { serializeCookie } from '../../lib/cookies.js';

function getBaseUrl(req: any) {
  const host = req.headers?.host as string | undefined;
  const proto = (req.headers?.['x-forwarded-proto'] as string | undefined) ?? 'https';
  if (!host) throw new Error('Missing host header');
  return `${proto}://${host}`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ error: 'Missing GOOGLE_CLIENT_ID' });
    return;
  }

  const state = crypto.randomBytes(16).toString('hex');
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const cookie = serializeCookie({
    name: 'oauth_state',
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAgeSeconds: 10 * 60,
  });
  res.setHeader('Set-Cookie', cookie);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.writeHead(302, { Location: url }).end();
}

