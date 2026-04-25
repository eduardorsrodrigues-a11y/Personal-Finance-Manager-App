import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getAuthenticatedUserId } from '../_lib/session.js';
import { encrypt, decrypt } from '../_lib/crypto.js';
import { readJsonBody, withErrorHandler, type ApiRequest, type ApiResponse } from '../_lib/request.js';
import {
  getPlaidConnections,
  getPlaidConnectionWithToken,
  getPlaidConnectionByItemId,
  insertPlaidConnection,
  updatePlaidCursor,
  updatePlaidStatus,
  deletePlaidConnection,
  getPendingTransactions,
  getPendingCount,
  upsertPendingTransaction,
  setPendingStatus,
  deletePendingByPlaidId,
  transactionExistsByPlaidId,
  pendingExistsByPlaidId,
  createTransactionFromPlaid,
} from '../_lib/db.js';

// ── Plaid client ───────────────────────────────────────────────────────────────

function getPlaidClient() {
  const env = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments;
  return new PlaidApi(new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
        'PLAID-SECRET': process.env.PLAID_SECRET!,
      },
    },
  }));
}

// ── Webhook signature verification ────────────────────────────────────────────

const PLAID_JWKS_URL = 'https://production.plaid.com/openid/certs';
const plaidJWKS = createRemoteJWKSet(new URL(PLAID_JWKS_URL));

async function verifyPlaidWebhook(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, plaidJWKS, { issuer: 'Plaid, Inc.' });
    return true;
  } catch {
    return false;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const CATEGORY_MAP: Record<string, string> = {
  FOOD_AND_DRINK: 'Food',
  GENERAL_MERCHANDISE: 'Shopping',
  GROCERIES: 'Groceries',
  HOME_IMPROVEMENT: 'Housing',
  RENT_AND_UTILITIES: 'Utilities',
  MEDICAL: 'Health',
  PERSONAL_CARE: 'Family & Personal',
  ENTERTAINMENT: 'Entertainment',
  TRAVEL: 'Travel',
  TRANSPORTATION: 'Transportation',
  LOAN_PAYMENTS: 'Debt Payments',
  GIFTS_AND_DONATIONS: 'Gifts',
  FITNESS: 'Gym & Sports',
  INCOME: 'Salary',
  TRANSFER_IN: 'Other',
  TRANSFER_OUT: 'Other',
};

function mapCategory(plaidCategory: string | null | undefined): string {
  if (!plaidCategory) return 'Other';
  return CATEGORY_MAP[plaidCategory] ?? 'Other';
}

// ── Sync logic ─────────────────────────────────────────────────────────────────

async function syncConnection(connectionId: string, userId: string) {
  const plaid = getPlaidClient();
  const conn = await getPlaidConnectionWithToken(connectionId, userId);
  const accessToken = decrypt(conn.access_token);

  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString().split('T')[0];
  let cursor = conn.cursor ?? undefined;
  let hasMore = true;
  let added = 0;

  while (hasMore) {
    const response = await plaid.transactionsSync({
      access_token: accessToken,
      cursor,
      options: { include_personal_finance_category: true },
    });

    const { added: newTxns, modified, removed, next_cursor, has_more } = response.data;
    cursor = next_cursor;
    hasMore = has_more;

    for (const r of removed) {
      await deletePendingByPlaidId(r.transaction_id, userId);
    }

    for (const txn of [...newTxns, ...modified]) {
      if (txn.pending) continue;
      if (txn.date < cutoff) continue;

      const plaidTxnId = txn.transaction_id;
      if (await transactionExistsByPlaidId(userId, plaidTxnId)) continue;
      if (await pendingExistsByPlaidId(userId, plaidTxnId)) continue;

      const plaidCategory = txn.personal_finance_category?.primary ?? null;
      const rawAmount = Math.abs(txn.amount);

      await upsertPendingTransaction({
        userId,
        connectionId,
        plaidTxnId,
        date: txn.date,
        description: txn.merchant_name ?? txn.name,
        rawAmount,
        currency: txn.iso_currency_code ?? 'EUR',
        plaidCategory,
        possibleDuplicate: false,
      });

      added++;
    }
  }

  if (cursor) await updatePlaidCursor(connectionId, cursor);
  return { added };
}

// ── Main handler ───────────────────────────────────────────────────────────────

export default withErrorHandler(async function handler(req: ApiRequest, res: ApiResponse) {
  // ── Webhook (identified by Plaid-Verification header) ──
  if (req.method === 'POST' && req.headers['plaid-verification']) {
    const verificationToken = req.headers['plaid-verification'] as string;
    const valid = await verifyPlaidWebhook(verificationToken);
    if (!valid) {
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }

    const body = (await readJsonBody(req)) as Record<string, unknown>;
    const { webhook_type, webhook_code, item_id } = body as { webhook_type?: string; webhook_code?: string; item_id?: string };

    if (webhook_type === 'TRANSACTIONS' && webhook_code === 'SYNC_UPDATES_AVAILABLE' && item_id) {
      const conn = await getPlaidConnectionByItemId(item_id);
      if (conn) await syncConnection(conn.id, conn.user_id).catch(console.error);
    }

    if (webhook_type === 'ITEM' && webhook_code === 'ERROR' && item_id) {
      await updatePlaidStatus(item_id, 'error').catch(console.error);
    }

    res.status(200).json({ ok: true });
    return;
  }

  // ── Authenticated routes ──
  const userId = await getAuthenticatedUserId(req);
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const action = req.query?.action as string | undefined;
  const plaid = getPlaidClient();

  if (req.method === 'GET' && action === 'connections') {
    const connections = await getPlaidConnections(userId);
    res.status(200).json({ connections });
    return;
  }

  if (req.method === 'GET' && action === 'pending') {
    const [items, count] = await Promise.all([getPendingTransactions(userId), getPendingCount(userId)]);
    res.status(200).json({ items, count });
    return;
  }

  if (req.method === 'POST' && action === 'create-link-token') {
    const response = await plaid.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'MyMoneyMate',
      products: [Products.Transactions],
      country_codes: [CountryCode.Gb, CountryCode.Us, CountryCode.Pt, CountryCode.Es, CountryCode.Fr, CountryCode.De],
      language: 'en',
      webhook: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://mymoneymate.app'}/api/plaid`,
    });
    res.status(200).json({ link_token: response.data.link_token });
    return;
  }

  if (req.method === 'POST' && action === 'exchange-token') {
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    const { public_token } = body;
    if (!public_token || typeof public_token !== 'string') {
      res.status(400).json({ error: 'Missing public_token' });
      return;
    }

    const exchangeRes = await plaid.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = exchangeRes.data;

    let institution: string | null = null;
    try {
      const itemRes = await plaid.itemGet({ access_token });
      const instId = itemRes.data.item.institution_id;
      if (instId) {
        const instRes = await plaid.institutionsGetById({
          institution_id: instId,
          country_codes: [CountryCode.Gb, CountryCode.Us, CountryCode.Pt, CountryCode.Es, CountryCode.Fr, CountryCode.De],
        });
        institution = instRes.data.institution.name;
      }
    } catch { /* non-fatal */ }

    const encryptedToken = encrypt(access_token);
    const conn = await insertPlaidConnection({ userId, accessToken: encryptedToken, itemId: item_id, institution });
    syncConnection(conn.id, userId).catch(console.error);
    res.status(200).json({ connection_id: conn.id, institution });
    return;
  }

  if (req.method === 'POST' && action === 'sync') {
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    const { connection_id } = body;
    if (!connection_id || typeof connection_id !== 'string') {
      res.status(400).json({ error: 'Missing connection_id' });
      return;
    }
    const result = await syncConnection(connection_id, userId);
    res.status(200).json(result);
    return;
  }

  if (req.method === 'POST' && action === 'review') {
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    const { id, status, amount, category, date, description, plaid_txn_id } = body;

    if (!id || typeof id !== 'string' || !status) {
      res.status(400).json({ error: 'Missing id or status' });
      return;
    }

    if (status === 'accepted') {
      const type: 'income' | 'expense' =
        category === 'Salary' || category === 'Freelance' || category === 'Investment' || category === 'Business'
          ? 'income' : 'expense';

      await createTransactionFromPlaid({
        userId,
        type,
        amount: Number(amount),
        description: String(description),
        transactionDate: String(date),
        category: String(category ?? 'Other'),
        plaidTxnId: String(plaid_txn_id),
      });
    }

    await setPendingStatus(id, userId, status as 'accepted' | 'rejected');
    const count = await getPendingCount(userId);
    res.status(200).json({ ok: true, remaining: count });
    return;
  }

  if (req.method === 'POST' && action === 'disable') {
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    const { connection_id, disabled } = body;
    if (!connection_id || typeof connection_id !== 'string') {
      res.status(400).json({ error: 'Missing connection_id' });
      return;
    }
    const supabase = (await import('../_lib/supabaseAdmin.js')).getSupabaseAdmin();
    const { error } = await supabase
      .from('plaid_connections')
      .update({ status: disabled ? 'disabled' : 'active' })
      .eq('id', connection_id)
      .eq('user_id', userId);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === 'POST' && action === 'disconnect') {
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    const { connection_id } = body;
    if (!connection_id || typeof connection_id !== 'string') {
      res.status(400).json({ error: 'Missing connection_id' });
      return;
    }
    try {
      const conn = await getPlaidConnectionWithToken(connection_id, userId);
      await plaid.itemRemove({ access_token: decrypt(conn.access_token) });
    } catch { /* token may already be invalid */ }

    await deletePlaidConnection(connection_id, userId);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(404).json({ error: 'Unknown action' });
});
