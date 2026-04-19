import bcrypt from 'bcryptjs';
import { getUserByEmail } from '../../lib/db.js';
import { createSessionToken, setSessionCookie } from '../../lib/session.js';

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
  const { email, password } = body ?? {};

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }
  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'Password is required.' });
    return;
  }

  const user = await getUserByEmail(email.toLowerCase());

  // Always run bcrypt compare to prevent timing attacks revealing whether email exists
  const dummyHash = '$2a$12$invalidhashinvalidhashinvalidhashinvalidhashinvalidhash';
  const hash = user?.password_hash ?? dummyHash;
  const match = await bcrypt.compare(password, hash);

  if (!user || !user.password_hash || !match) {
    // Check specifically if it's a Google-only account to give a helpful message
    if (user && !user.password_hash) {
      res.status(401).json({ error: 'This account uses Google sign-in. Please continue with Google.' });
    } else {
      res.status(401).json({ error: 'Incorrect email or password.' });
    }
    return;
  }

  const token = await createSessionToken({ sub: user.id, email: user.email });
  setSessionCookie(res, token);

  res.status(200).json({ user: { id: user.id, email: user.email, name: user.name } });
}
