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
  const { name, email, birthday, password } = body ?? {};

  // Validate
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

  // Check global cap
  const emailCount = await countEmailUsers();
  if (emailCount >= EMAIL_ACCOUNT_CAP) {
    res.status(403).json({ error: 'Account creation is temporarily limited. Please try again later or use Google sign-in.' });
    return;
  }

  // Check email not already taken
  const existing = await getUserByEmail(email.toLowerCase());
  if (existing) {
    if (!existing.password_hash) {
      res.status(409).json({ error: 'An account with this email already exists. Sign in with Google instead.' });
    } else {
      res.status(409).json({ error: 'An account with this email already exists.' });
    }
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await createEmailUser({
    name: name.trim(),
    email: email.toLowerCase(),
    birthday,
    passwordHash,
  });

  // Create session
  const token = await createSessionToken({ sub: user.id, email: user.email });
  setSessionCookie(res, token);

  res.status(201).json({ user: { id: user.id, email: user.email, name: user.name } });
}
