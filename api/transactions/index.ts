import { getAuthenticatedUserId } from '../lib/session.js';
import { createTransaction, deleteTransaction, listTransactions, updateTransaction } from '../lib/db.js';

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
    const transactions = await listTransactions(userId);
    res.status(200).json({ transactions });
    return;
  }

  if (req.method === 'POST') {
    const body = await readJsonBody(req);
    const { type, amount, description, date, category } = body ?? {};

    if (!type || (type !== 'income' && type !== 'expense')) {
      res.status(400).json({ error: 'Invalid type' });
      return;
    }
    if (!description || typeof description !== 'string') {
      res.status(400).json({ error: 'Invalid description' });
      return;
    }
    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (!Number.isFinite(parsedAmount)) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    if (!date || typeof date !== 'string') {
      res.status(400).json({ error: 'Invalid date' });
      return;
    }

    if (!category || typeof category !== 'string') {
      res.status(400).json({ error: 'Invalid category' });
      return;
    }

    const result = await createTransaction({
      userId,
      type,
      amount: parsedAmount,
      description,
      transactionDate: date,
      category,
    });

    res.status(201).json({ transactionId: result.id });
    return;
  }

  if (req.method === 'DELETE') {
    const id = (req.query?.id as string | undefined) ?? (await readJsonBody(req))?.id;
    if (!id) {
      res.status(400).json({ error: 'Missing id' });
      return;
    }

    await deleteTransaction({ userId, id });
    res.status(204).end();
    return;
  }

  if (req.method === 'PUT') {
    const id = req.query?.id as string | undefined;
    if (!id) {
      res.status(400).json({ error: 'Missing id' });
      return;
    }

    const body = await readJsonBody(req);
    const { type, amount, description, date, category } = body ?? {};

    if (!type || (type !== 'income' && type !== 'expense')) {
      res.status(400).json({ error: 'Invalid type' });
      return;
    }
    if (!description || typeof description !== 'string') {
      res.status(400).json({ error: 'Invalid description' });
      return;
    }

    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (!Number.isFinite(parsedAmount)) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    if (!date || typeof date !== 'string') {
      res.status(400).json({ error: 'Invalid date' });
      return;
    }

    if (!category || typeof category !== 'string') {
      res.status(400).json({ error: 'Invalid category' });
      return;
    }

    await updateTransaction({
      userId,
      id,
      type,
      amount: parsedAmount,
      description,
      transactionDate: date,
      category,
    });

    res.status(200).json({ transactionId: id });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

