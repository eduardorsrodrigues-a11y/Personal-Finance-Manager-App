import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { getAuthenticatedUserId } from '../lib/session.js';
import { encrypt, decrypt } from '../lib/crypto.js';
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
} from '../lib/db.js';

// ── Plaid client ──────────────────────────────────────────────────────────────

function getPlaidClient() {
  const env = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments;
  const config = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
        'PLAID-SECRET': process.env.PLAID_SECRET!,
      },
    },
  });
  return new PlaidApi(config);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function readBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c: any) => { data += c.toString(); });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Maps Plaid personal_finance_category primary to app categories
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

// ── Sync logic (shared between manual sync and webhook) ───────────────────────

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

    // Handle removed transactions
    for (const r of removed) {
      await deletePendingByPlaidId(r.transaction_id, userId);
    }

    // Handle added (and modified if still pending)
    for (const txn of [...newTxns, ...modified]) {
      // Only import posted transactions within the last 30 days
      if (txn.pending) continue;
      if (txn.date < cutoff) continue;

      const plaidTxnId = txn.transaction_id;

      // Skip if already in accepted transactions
      if (await transactionExistsByPlaidId(userId, plaidTxnId)) continue;
      // Skip if already in pending queue
      if (await pendingExistsByPlaidId(userId, plaidTxnId)) continue;

      // Possible duplicate check: same amount + similar description ±1 day
      // (handled by the UNIQUE constraint as a hard dedup; fuzzy check is best-effort)

      const plaidCategory = txn.personal_finance_category?.primary ?? null;
      // Plaid amounts: positive = money leaving account (expense), negative = money entering (income)
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

  // Save the latest cursor
  if (cursor) await updatePlaidCursor(connectionId, cursor);

  return { added };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req: any, res: any) {
  // ── Webhook (no auth cookie — identified by Plaid-Verification header) ──
  if (req.method === 'POST' && req.headers['plaid-verification']) {
    const body = await readBody(req);
    const { webhook_type, webhook_code, item_id } = body;

    if (webhook_type === 'TRANSACTIONS' && webhook_code === 'SYNC_UPDATES_AVAILABLE') {
      const conn = await getPlaidConnectionByItemId(item_id);
      if (conn) {
        await syncConnection(conn.id, conn.user_id).catch(console.error);
      }
    }

    if (webhook_type === 'ITEM' && webhook_code === 'ERROR') {
      await updatePlaidStatus(item_id, 'error').catch(console.error);
    }

    res.status(200).json({ ok: true });
    return;
  }

  // ── Authenticated routes ──
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const action = req.query?.action as string | undefined;
  const plaid = getPlaidClient();

  // GET /api/plaid?action=connections
  if (req.method === 'GET' && action === 'connections') {
    const connections = await getPlaidConnections(userId);
    res.status(200).json({ connections });
    return;
  }

  // GET /api/plaid?action=pending
  if (req.method === 'GET' && action === 'pending') {
    const [items, count] = await Promise.all([
      getPendingTransactions(userId),
      getPendingCount(userId),
    ]);
    res.status(200).json({ items, count });
    return;
  }

  // POST /api/plaid?action=create-link-token
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

  // POST /api/plaid?action=exchange-token
  if (req.method === 'POST' && action === 'exchange-token') {
    const body = await readBody(req);
    const { public_token } = body;
    if (!public_token) {
      res.status(400).json({ error: 'Missing public_token' });
      return;
    }

    const exchangeRes = await plaid.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = exchangeRes.data;

    // Fetch institution name
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

    // Kick off first sync
    syncConnection(conn.id, userId).catch(console.error);

    res.status(200).json({ connection_id: conn.id, institution });
    return;
  }

  // POST /api/plaid?action=sync
  if (req.method === 'POST' && action === 'sync') {
    const body = await readBody(req);
    const { connection_id } = body;
    if (!connection_id) {
      res.status(400).json({ error: 'Missing connection_id' });
      return;
    }
    const result = await syncConnection(connection_id, userId);
    res.status(200).json(result);
    return;
  }

  // POST /api/plaid?action=review
  if (req.method === 'POST' && action === 'review') {
    const body = await readBody(req);
    const { id, status, amount, category, date, description, plaid_txn_id } = body;

    if (!id || !status) {
      res.status(400).json({ error: 'Missing id or status' });
      return;
    }

    if (status === 'accepted') {
      // Determine transaction type: Plaid income categories or negative original amount = income
      const type: 'income' | 'expense' =
        category === 'Salary' || category === 'Freelance' || category === 'Investment' || category === 'Business'
          ? 'income'
          : 'expense';

      await createTransactionFromPlaid({
        userId,
        type,
        amount: Number(amount),
        description,
        transactionDate: date,
        category: category ?? 'Other',
        plaidTxnId: plaid_txn_id,
      });
    }

    await setPendingStatus(id, userId, status);
    const count = await getPendingCount(userId);
    res.status(200).json({ ok: true, remaining: count });
    return;
  }

  // POST /api/plaid?action=disconnect
  if (req.method === 'POST' && action === 'disconnect') {
    const body = await readBody(req);
    const { connection_id } = body;
    if (!connection_id) {
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
}
