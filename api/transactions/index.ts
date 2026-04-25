import { getAuthenticatedUserId } from '../_lib/session.js';
import { createTransaction, deleteTransaction, listTransactions, updateTransaction } from '../_lib/db.js';
import { readJsonBody, withErrorHandler, type ApiRequest, type ApiResponse } from '../_lib/request.js';
import { ValidationError, requireString, requireAmount, requireTransactionType, requireDate, requireCategory } from '../_lib/validate.js';

export default withErrorHandler(async function handler(req: ApiRequest, res: ApiResponse) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'GET') {
    const transactions = await listTransactions(userId);
    res.status(200).json({ transactions });
    return;
  }

  if (req.method === 'POST') {
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    try {
      const type = requireTransactionType(body.type);
      const description = requireString(body.description, 'description');
      const amount = requireAmount(body.amount);
      const date = requireDate(body.date);
      const category = requireCategory(body.category);
      const result = await createTransaction({ userId, type, amount, description, transactionDate: date, category });
      res.status(201).json({ transactionId: result.id });
    } catch (err) {
      if (err instanceof ValidationError) { res.status(400).json({ error: err.message }); return; }
      throw err;
    }
    return;
  }

  if (req.method === 'PUT') {
    const id = (req.query?.id as string | undefined);
    if (!id) { res.status(400).json({ error: 'Missing id' }); return; }
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    try {
      const type = requireTransactionType(body.type);
      const description = requireString(body.description, 'description');
      const amount = requireAmount(body.amount);
      const date = requireDate(body.date);
      const category = requireCategory(body.category);
      await updateTransaction({ userId, id, type, amount, description, transactionDate: date, category });
      res.status(200).json({ transactionId: id });
    } catch (err) {
      if (err instanceof ValidationError) { res.status(400).json({ error: err.message }); return; }
      throw err;
    }
    return;
  }

  if (req.method === 'DELETE') {
    const id = (req.query?.id as string | undefined) ?? ((await readJsonBody(req)) as Record<string, unknown>)?.id as string | undefined;
    if (!id) { res.status(400).json({ error: 'Missing id' }); return; }
    await deleteTransaction({ userId, id });
    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
});
