import { jwtVerify, SignJWT } from 'jose';
import { getCookieValue, serializeCookie } from './cookies';

type SessionPayload = {
  sub: string; // user id
  email?: string | null;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('Missing AUTH_SECRET');
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  const secret = getSecret();
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
  return token;
}

export async function verifySessionToken(token: string): Promise<SessionPayload> {
  const secret = getSecret();
  const { payload } = await jwtVerify<SessionPayload>(token, secret, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function getAuthenticatedUserId(req: any): Promise<string | null> {
  const cookieHeader = req.headers?.cookie as string | undefined;
  const token = getCookieValue(cookieHeader, 'session');
  if (!token) return null;

  try {
    const session = await verifySessionToken(token);
    return session.sub;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: any, token: string) {
  const secure = process.env.NODE_ENV === 'production';
  const cookie = serializeCookie({
    name: 'session',
    value: token,
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAgeSeconds: 60 * 60 * 24 * 30,
  });
  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res: any) {
  const secure = process.env.NODE_ENV === 'production';
  const cookie = serializeCookie({
    name: 'session',
    value: '',
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAgeSeconds: 0,
  });
  res.setHeader('Set-Cookie', cookie);
}

