import { getAuthenticatedUserId } from '../_lib/session.js';
import { getBudgets, upsertBudgets } from '../_lib/db.js';
import { readJsonBody, withErrorHandler, type ApiRequest, type ApiResponse } from '../_lib/request.js';

export default withErrorHandler(async function handler(req: ApiRequest, res: ApiResponse) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'GET') {
    const all = await getBudgets(userId) as Record<string, unknown>;
    const { __smartIncome, __annualBudgets, ...budgets } = all;
    res.status(200).json({ budgets, smartIncome: __smartIncome ?? null, annualBudgets: __annualBudgets ?? {} });
    return;
  }

  if (req.method === 'PUT') {
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    const { budgets, smartIncome, annualBudgets } = body ?? {};
    if (!budgets || typeof budgets !== 'object' || Array.isArray(budgets)) {
      res.status(400).json({ error: 'Invalid budgets payload' });
      return;
    }
    for (const [key, val] of Object.entries(budgets as Record<string, unknown>)) {
      if (typeof val !== 'number' || val < 0) {
        res.status(400).json({ error: `Invalid budget amount for category: ${key}` });
        return;
      }
    }
    const toStore: Record<string, unknown> = { ...(budgets as Record<string, unknown>) };
    if (typeof smartIncome === 'number' && smartIncome > 0) toStore.__smartIncome = smartIncome;
    if (annualBudgets && typeof annualBudgets === 'object' && !Array.isArray(annualBudgets)) {
      toStore.__annualBudgets = annualBudgets;
    }
    await upsertBudgets({ userId, budgets: toStore as Record<string, number> });
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
});
