import { getAuthenticatedUserId } from '../lib/session.js';
import { getBudgets, upsertBudgets } from '../lib/db.js';

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
    const all = await getBudgets(userId) as Record<string, number>;
    const { __smartIncome, ...budgets } = all;
    res.status(200).json({ budgets, smartIncome: __smartIncome ?? null });
    return;
  }

  if (req.method === 'PUT') {
    const body = await readJsonBody(req);
    const { budgets, smartIncome } = body ?? {};
    if (!budgets || typeof budgets !== 'object' || Array.isArray(budgets)) {
      res.status(400).json({ error: 'Invalid budgets payload' });
      return;
    }
    // Ensure all values are non-negative numbers
    for (const [key, val] of Object.entries(budgets)) {
      if (typeof val !== 'number' || val < 0) {
        res.status(400).json({ error: `Invalid budget amount for category: ${key}` });
        return;
      }
    }
    const toStore = (typeof smartIncome === 'number' && smartIncome > 0)
      ? { ...budgets, __smartIncome: smartIncome }
      : budgets;
    await upsertBudgets({ userId, budgets: toStore });
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
