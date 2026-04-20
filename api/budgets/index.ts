import { getAuthenticatedUserId } from '../_lib/session.js';
import { getBudgets, upsertBudgets } from '../_lib/db.js';

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
    const all = await getBudgets(userId) as Record<string, any>;
    const { __smartIncome, __annualBudgets, ...budgets } = all;
    res.status(200).json({
      budgets,
      smartIncome: __smartIncome ?? null,
      annualBudgets: __annualBudgets ?? {},
    });
    return;
  }

  if (req.method === 'PUT') {
    const body = await readJsonBody(req);
    const { budgets, smartIncome, annualBudgets } = body ?? {};
    if (!budgets || typeof budgets !== 'object' || Array.isArray(budgets)) {
      res.status(400).json({ error: 'Invalid budgets payload' });
      return;
    }
    // Ensure all category values are non-negative numbers
    for (const [key, val] of Object.entries(budgets)) {
      if (typeof val !== 'number' || val < 0) {
        res.status(400).json({ error: `Invalid budget amount for category: ${key}` });
        return;
      }
    }
    const toStore: Record<string, any> = { ...budgets };
    if (typeof smartIncome === 'number' && smartIncome > 0) toStore.__smartIncome = smartIncome;
    if (annualBudgets && typeof annualBudgets === 'object' && !Array.isArray(annualBudgets)) {
      toStore.__annualBudgets = annualBudgets;
    }
    await upsertBudgets({ userId, budgets: toStore });
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
