import { getAuthenticatedUserId } from '../lib/session.js';
import { getUserById } from '../lib/db.js';

export default async function handler(req: any, res: any) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ user: null });
    return;
  }

  const user = await getUserById(userId);
  if (!user) {
    res.status(401).json({ user: null });
    return;
  }

  res.status(200).json({ user });
}

