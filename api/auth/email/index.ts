import bcrypt from 'bcryptjs';
import { createEmailUser, countEmailUsers, getUserByEmail } from '../../_lib/db.js';
import { createSessionToken, setSessionCookie } from '../../_lib/session.js';
import { readJsonBody, withErrorHandler, type ApiRequest, type ApiResponse } from '../../_lib/request.js';
import { isRateLimited } from '../../_lib/rateLimit.js';

const EMAIL_ACCOUNT_CAP = 10;

export default withErrorHandler(async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Rate limit: 10 attempts per 15 minutes per IP
  if (await isRateLimited(req, 'auth/email', { maxRequests: 10, windowMinutes: 15 })) {
    res.status(429).json({ error: 'Too many attempts. Please wait 15 minutes and try again.' });
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = (await readJsonBody(req)) as Record<string, unknown>;
  } catch {
    res.status(400).json({ error: 'Invalid request body.' });
    return;
  }

  const { action, name, email, birthday, password } = body ?? {};

  if (action === 'signup') {
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
      return;
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      res.status(400).json({ error: 'Invalid email address.' });
      return;
    }
    if (!birthday || typeof birthday !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      res.status(400).json({ error: 'Invalid birthday.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 8 || password.length > 128) {
      res.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
      return;
    }

    const emailCount = await countEmailUsers();
    if (emailCount >= EMAIL_ACCOUNT_CAP) {
      res.status(403).json({ error: 'Account creation is temporarily limited. Please try again later or use Google sign-in.' });
      return;
    }

    const existing = await getUserByEmail(email.toLowerCase());
    if (existing) {
      res.status(409).json({
        error: existing.password_hash
          ? 'An account with this email already exists.'
          : 'An account with this email already exists. Sign in with Google instead.',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createEmailUser({ name: name.trim(), email: email.toLowerCase(), birthday, passwordHash });
    const token = await createSessionToken({ sub: user.id, email: user.email });
    setSessionCookie(res, token);
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name } });
    return;
  }

  if (action === 'signin') {
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Password is required.' });
      return;
    }

    const user = await getUserByEmail(email.toLowerCase());

    // Always run bcrypt to prevent timing-based email enumeration
    const dummyHash = '$2a$12$invalidhashinvalidhashinvalidhashinvalid';
    const match = await bcrypt.compare(password, user?.password_hash ?? dummyHash);

    if (!user || !user.password_hash || !match) {
      res.status(401).json({
        error: user && !user.password_hash
          ? 'This account uses Google sign-in. Please continue with Google.'
          : 'Incorrect email or password.',
      });
      return;
    }

    const token = await createSessionToken({ sub: user.id, email: user.email });
    setSessionCookie(res, token);
    res.status(200).json({ user: { id: user.id, email: user.email, name: user.name } });
    return;
  }

  res.status(400).json({ error: 'Invalid action.' });
});
