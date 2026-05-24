import { getAuthenticatedUserId } from '../../_lib/session.js';
import { listPortfolioSnapshots, upsertPortfolioSnapshot, updatePortfolioItemValue } from '../../_lib/db.js';
import { readJsonBody, withErrorHandler, type ApiRequest, type ApiResponse } from '../../_lib/request.js';

export default withErrorHandler(async function handler(req: ApiRequest, res: ApiResponse) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  if (req.method === 'GET') {
    const snapshots = await listPortfolioSnapshots(userId);
    res.status(200).json({ snapshots });
    return;
  }

  if (req.method === 'POST') {
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    const snapshotMonth = typeof body.snapshot_month === 'string' ? body.snapshot_month : null;
    const netWorth = typeof body.net_worth === 'number' ? body.net_worth : null;
    const itemValues =
      typeof body.item_values === 'object' && body.item_values !== null
        ? (body.item_values as Record<string, number>)
        : null;

    if (!snapshotMonth || netWorth === null || !itemValues) {
      res.status(400).json({ error: 'Missing required fields: snapshot_month, net_worth, item_values' });
      return;
    }

    await Promise.all(
      Object.entries(itemValues).map(([id, currentValue]) =>
        updatePortfolioItemValue({ userId, id, currentValue }),
      ),
    );

    await upsertPortfolioSnapshot({ userId, snapshotMonth, netWorth });

    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
});
