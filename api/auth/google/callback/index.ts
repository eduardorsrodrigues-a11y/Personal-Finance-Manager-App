import { getCookieValue } from '../../../lib/cookies.js';
import { createSessionToken } from '../../../lib/session.js';
import { upsertUserByGoogle } from '../../../lib/db.js';

function getBaseUrl(req: any) {
  const host = req.headers?.host as string | undefined;
  const proto = (req.headers?.['x-forwarded-proto'] as string | undefined) ?? 'https';
  if (!host) throw new Error('Missing host header');
  return `${proto}://${host}`;
}

function jsonError(res: any, status: number, message: string) {
  res.status(status).json({ error: message });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const code = req.query?.code as string | undefined;
  const state = req.query?.state as string | undefined;

  const cookieHeader = req.headers?.cookie as string | undefined;
  const savedState = getCookieValue(cookieHeader, 'oauth_state');

  if (!code) {
    jsonError(res, 400, 'Missing code');
    return;
  }
  if (!state || !savedState || state !== savedState) {
    jsonError(res, 400, 'Invalid oauth state');
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    jsonError(res, 500, 'Missing Google OAuth env vars');
    return;
  }

  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  // Exchange authorization code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    jsonError(res, 500, 'Failed to exchange code');
    return;
  }

  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token as string | undefined;
  if (!accessToken) {
    jsonError(res, 500, 'Missing access_token');
    return;
  }

  // Fetch user info from Google
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userRes.ok) {
    jsonError(res, 500, 'Failed to fetch user info');
    return;
  }

  const userJson = await userRes.json();
  const googleSub = userJson.id as string | undefined;
  const email = userJson.email as string | undefined;
  const name = (userJson.name as string | undefined) ?? (userJson.given_name as string | undefined) ?? null;

  if (!googleSub) {
    jsonError(res, 500, 'Missing Google user id');
    return;
  }

  // Upsert user in DB (schema required; see schema SQL file)
  const dbUser = await upsertUserByGoogle({
    googleSub,
    email: email ?? null,
    name,
  });

  // Create session cookie (JWT)
  const token = await createSessionToken({ sub: dbUser.id, email: dbUser.email });

  // Clear oauth_state cookie after successful verification.
  const secure = process.env.NODE_ENV === 'production';
  const oauthStateClear = [
    'oauth_state=',
    'HttpOnly',
    secure ? 'Secure' : '',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=0',
  ]
    .filter(Boolean)
    .join('; ');

  const maxAgeSeconds = 60 * 60 * 24 * 30;
  const cookie = [
    `session=${encodeURIComponent(token)}`,
    'HttpOnly',
    secure ? 'Secure' : '',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
  ]
    .filter(Boolean)
    .join('; ');

  res.setHeader('Set-Cookie', [oauthStateClear, cookie]);

  // Redirect back to the app
  res.writeHead(302, { Location: '/' }).end();
}

