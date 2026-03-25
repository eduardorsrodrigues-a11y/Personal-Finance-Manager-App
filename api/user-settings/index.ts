import { getAuthenticatedUserId } from '../lib/session.js';
import { getUserCurrency, upsertUserSettings } from '../lib/db.js';

async function readJsonBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk.toString();
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', (err: any) => reject(err));
  });
}

export default async function handler(req: any, res: any) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'GET') {
    const defaultCurrency = await getUserCurrency(userId);
    res.status(200).json({ defaultCurrency: defaultCurrency ?? 'EUR' });
    return;
  }

  if (req.method === 'PUT') {
    const body = await readJsonBody(req);
    const { defaultCurrency } = body ?? {};
    if (!defaultCurrency || typeof defaultCurrency !== 'string') {
      res.status(400).json({ error: 'Invalid defaultCurrency' });
      return;
    }
    await upsertUserSettings({ userId, defaultCurrency });
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

