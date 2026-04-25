import { getCookieValue, serializeCookie } from '../../../_lib/cookies.js';
import { createSessionToken } from '../../../_lib/session.js';
import { upsertUserByGoogle } from '../../../_lib/db.js';
import { withErrorHandler, type ApiRequest, type ApiResponse } from '../../../_lib/request.js';

function getBaseUrl(req: ApiRequest) {
  const host = req.headers?.host as string | undefined;
  const proto = (req.headers?.['x-forwarded-proto'] as string | undefined) ?? 'https';
  if (!host) throw new Error('Missing host header');
  return `${proto}://${host}`;
}

/** Clears the oauth_state cookie — called on both success and error paths. */
function clearOAuthStateCookie(res: ApiResponse) {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', serializeCookie({
    name: 'oauth_state',
    value: '',
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAgeSeconds: 0,
  }));
}

function errorRedirect(res: ApiResponse, message: string) {
  clearOAuthStateCookie(res);
  res.writeHead(302, { Location: `/login?error=${encodeURIComponent(message)}` }).end();
}

export default withErrorHandler(async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const code = req.query?.code as string | undefined;
  const state = req.query?.state as string | undefined;
  const cookieHeader = req.headers?.cookie as string | undefined;
  const savedState = getCookieValue(cookieHeader, 'oauth_state');

  if (!code) { errorRedirect(res, 'Missing code'); return; }
  if (!state || !savedState || state !== savedState) { errorRedirect(res, 'Invalid oauth state'); return; }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) { errorRedirect(res, 'OAuth misconfigured'); return; }

  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  });
  if (!tokenRes.ok) { errorRedirect(res, 'Failed to exchange code'); return; }

  const tokenJson = await tokenRes.json() as Record<string, unknown>;
  const accessToken = tokenJson.access_token as string | undefined;
  if (!accessToken) { errorRedirect(res, 'Missing access token'); return; }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) { errorRedirect(res, 'Failed to fetch user info'); return; }

  const userJson = await userRes.json() as Record<string, unknown>;
  const googleSub = userJson.id as string | undefined;
  const email = userJson.email as string | undefined;
  const name = (userJson.name ?? userJson.given_name ?? null) as string | null;

  if (!googleSub) { errorRedirect(res, 'Missing Google user id'); return; }

  const dbUser = await upsertUserByGoogle({ googleSub, email: email ?? null, name });
  const token = await createSessionToken({ sub: dbUser.id, email: dbUser.email });

  const secure = process.env.NODE_ENV === 'production';
  const maxAgeSeconds = 60 * 60 * 24 * 30;
  const sessionCookie = serializeCookie({ name: 'session', value: encodeURIComponent(token), httpOnly: true, secure, sameSite: 'lax', path: '/', maxAgeSeconds });
  const clearStateCookie = serializeCookie({ name: 'oauth_state', value: '', httpOnly: true, secure, sameSite: 'lax', path: '/', maxAgeSeconds: 0 });

  res.setHeader('Set-Cookie', [clearStateCookie, sessionCookie]);
  res.writeHead(302, { Location: '/' }).end();
});
