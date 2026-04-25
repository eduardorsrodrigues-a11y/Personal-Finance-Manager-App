import { getAuthenticatedUserId } from '../_lib/session.js';
import { getUserById, updateUser } from '../_lib/db.js';
import { readJsonBody, withErrorHandler, type ApiRequest, type ApiResponse } from '../_lib/request.js';

export default withErrorHandler(async function handler(req: ApiRequest, res: ApiResponse) {
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
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    const updates: { name?: string; birthday?: string } = {};
    if (body.name && typeof body.name === 'string') updates.name = body.name.trim().slice(0, 100);
    if (body.birthday && typeof body.birthday === 'string') updates.birthday = body.birthday;
    await updateUser({ userId, ...updates });
    const user = await getUserById(userId);
    res.status(200).json({ user });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
});
