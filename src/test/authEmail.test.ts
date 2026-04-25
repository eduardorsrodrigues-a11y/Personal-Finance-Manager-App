import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for the auth/email API validation rules.
 * We isolate the handler by mocking the DB and session modules
 * so no real Supabase or bcrypt calls happen.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../api/_lib/db.js', () => ({
  countEmailUsers: vi.fn().mockResolvedValue(0),
  getUserByEmail: vi.fn().mockResolvedValue(null),
  createEmailUser: vi.fn().mockResolvedValue({ id: 'uid-1', email: 'a@b.com', name: 'Alice' }),
}));

vi.mock('../../api/_lib/session.js', () => ({
  createSessionToken: vi.fn().mockResolvedValue('fake-token'),
  setSessionCookie: vi.fn(),
}));

vi.mock('../../api/_lib/rateLimit.js', () => ({
  isRateLimited: vi.fn().mockResolvedValue(false),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$hashed'),
    compare: vi.fn().mockResolvedValue(false),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(body: Record<string, unknown>, method = 'POST') {
  const bodyStr = JSON.stringify(body);
  let dataCallback: ((chunk: Buffer) => void) | null = null;
  let endCallback: (() => void) | null = null;

  const req: any = {
    method,
    headers: {},
    on(event: string, cb: any) {
      if (event === 'data') dataCallback = cb;
      if (event === 'end') endCallback = cb;
      return req;
    },
  };

  // Simulate async body streaming
  setTimeout(() => {
    dataCallback?.(Buffer.from(bodyStr));
    endCallback?.();
  }, 0);

  return req;
}

function makeRes() {
  const res: any = { _status: 200, _body: null, _headers: {} };
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (body: unknown) => { res._body = body; };
  res.setHeader = (k: string, v: string) => { res._headers[k] = v; };
  res.end = () => {};
  res.writableEnded = false;
  return res;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/email — signup validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects name shorter than 2 chars', async () => {
    const handler = (await import('../../api/auth/email/index.js')).default;
    const req = makeReq({ action: 'signup', name: 'A', email: 'a@b.com', birthday: '1990-01-01', password: 'password123' });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/name/i);
  });

  it('rejects invalid email', async () => {
    const handler = (await import('../../api/auth/email/index.js')).default;
    const req = makeReq({ action: 'signup', name: 'Alice', email: 'not-an-email', birthday: '1990-01-01', password: 'password123' });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/email/i);
  });

  it('rejects password shorter than 8 chars', async () => {
    const handler = (await import('../../api/auth/email/index.js')).default;
    const req = makeReq({ action: 'signup', name: 'Alice', email: 'a@b.com', birthday: '1990-01-01', password: 'short' });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/password/i);
  });

  it('rejects invalid birthday format', async () => {
    const handler = (await import('../../api/auth/email/index.js')).default;
    const req = makeReq({ action: 'signup', name: 'Alice', email: 'a@b.com', birthday: '01/01/1990', password: 'password123' });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/birthday/i);
  });

  it('returns 201 and user on valid signup', async () => {
    const handler = (await import('../../api/auth/email/index.js')).default;
    const req = makeReq({ action: 'signup', name: 'Alice', email: 'a@b.com', birthday: '1990-01-01', password: 'password123' });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(201);
    expect(res._body.user).toBeDefined();
  });
});

describe('POST /api/auth/email — signin validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects missing email', async () => {
    const handler = (await import('../../api/auth/email/index.js')).default;
    const req = makeReq({ action: 'signin', password: 'password123' });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it('rejects missing password', async () => {
    const handler = (await import('../../api/auth/email/index.js')).default;
    const req = makeReq({ action: 'signin', email: 'a@b.com' });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it('returns 401 for non-existent user', async () => {
    const { getUserByEmail } = await import('../../api/_lib/db.js');
    (getUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const handler = (await import('../../api/auth/email/index.js')).default;
    const req = makeReq({ action: 'signin', email: 'nobody@b.com', password: 'password123' });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(401);
  });

  it('returns 429 when rate limited', async () => {
    const { isRateLimited } = await import('../../api/_lib/rateLimit.js');
    (isRateLimited as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);
    const handler = (await import('../../api/auth/email/index.js')).default;
    const req = makeReq({ action: 'signin', email: 'a@b.com', password: 'password123' });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(429);
  });

  it('returns 400 for unknown action', async () => {
    const handler = (await import('../../api/auth/email/index.js')).default;
    const req = makeReq({ action: 'delete-account' });
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(400);
  });
});
