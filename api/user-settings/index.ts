import { getAuthenticatedUserId } from '../_lib/session.js';
import { getUserPreferences, upsertUserSettings } from '../_lib/db.js';

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
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'GET') {
    const prefs = await getUserPreferences(userId);
    res.status(200).json(prefs);
    return;
  }

  if (req.method === 'PUT') {
    const body = await readJsonBody(req);
    const { defaultCurrency, riskProfile } = body ?? {};
    const updates: { defaultCurrency?: string; riskProfile?: string } = {};
    if (defaultCurrency && typeof defaultCurrency === 'string') updates.defaultCurrency = defaultCurrency;
    if (riskProfile && typeof riskProfile === 'string') updates.riskProfile = riskProfile;
    await upsertUserSettings({ userId, ...updates });
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
