import { getAuthenticatedUserId } from '../_lib/session.js';
import { getUserById, updateUser } from '../_lib/db.js';

async function readJsonBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: any) => { data += chunk.toString(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

export default async function handler(req: any, res: any) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ user: null });
    return;
  }

  if (req.method === 'GET') {
    const user = await getUserById(userId);
    if (!user) { res.status(401).json({ user: null }); return; }
    res.status(200).json({ user });
    return;
  }

  if (req.method === 'PUT') {
    const body = await readJsonBody(req);
    const { name, birthday } = body ?? {};
    const updates: { name?: string; birthday?: string } = {};
    if (name && typeof name === 'string') updates.name = name.trim();
    if (birthday && typeof birthday === 'string') updates.birthday = birthday;
    await updateUser({ userId, ...updates });
    const user = await getUserById(userId);
    res.status(200).json({ user });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
