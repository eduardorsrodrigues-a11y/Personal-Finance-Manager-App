import { getAuthenticatedUserId } from '../../_lib/session.js';
import { getSnapshotItems, upsertSnapshotItems, updateSnapshotNetWorth } from '../../_lib/db.js';
import { readJsonBody, withErrorHandler, type ApiRequest, type ApiResponse } from '../../_lib/request.js';

export default withErrorHandler(async function handler(req: ApiRequest, res: ApiResponse) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  if (req.method === 'GET') {
    const snapshotId = typeof req.query?.snapshot_id === 'string' ? req.query.snapshot_id : null;
    if (!snapshotId) { res.status(400).json({ error: 'snapshot_id is required' }); return; }
    const items = await getSnapshotItems({ userId, snapshotId });
    res.status(200).json({ items });
    return;
  }

  if (req.method === 'POST') {
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    const snapshotId = typeof body.snapshot_id === 'string' ? body.snapshot_id : null;
    const netWorth = typeof body.net_worth === 'number' ? body.net_worth : null;
    const itemValues =
      typeof body.item_values === 'object' && body.item_values !== null
        ? (body.item_values as Record<string, number>)
        : null;

    if (!snapshotId || netWorth === null || !itemValues) {
      res.status(400).json({ error: 'Missing required fields: snapshot_id, net_worth, item_values' });
      return;
    }

    await upsertSnapshotItems({ userId, snapshotId, items: itemValues });
    await updateSnapshotNetWorth({ userId, snapshotId, netWorth });

    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
});
