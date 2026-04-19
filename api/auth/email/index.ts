import bcrypt from 'bcryptjs';
import { createEmailUser, countEmailUsers, getUserByEmail } from '../../lib/db.js';
import { createSessionToken, setSessionCookie } from '../../lib/session.js';

const EMAIL_ACCOUNT_CAP = 10;

async function readBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: any) => { data += chunk.toString(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = await readBody(req);
  const { action, name, email, birthday, password } = body ?? {};

  if (action === 'signup') {
    // ── Sign Up ───────────────────────────────────────────────────────────────
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Name must be at least 2 characters.' });
      return;
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Invalid email address.' });
      return;
    }
    if (!birthday || typeof birthday !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      res.status(400).json({ error: 'Invalid birthday.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters.' });
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
    // ── Sign In ───────────────────────────────────────────────────────────────
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
}
