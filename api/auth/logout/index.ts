import { clearSessionCookie } from '../../_lib/session.js';
import { withErrorHandler, type ApiRequest, type ApiResponse } from '../../_lib/request.js';

export default withErrorHandler(async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  clearSessionCookie(res);
  res.writeHead(302, { Location: '/login' }).end();
});
