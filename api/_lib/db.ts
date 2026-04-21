import { getSupabaseAdmin } from './supabaseAdmin.js';

export async function upsertUserByGoogle(params: {
  googleSub: string;
  email?: string | null;
  name?: string | null;
}) {
  const { googleSub, email, name } = params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('users')
    .upsert(
      { google_sub: googleSub, email: email ?? null, name: name ?? null },
      { onConflict: 'google_sub' },
    )
    .select('id, google_sub, email, name')
    .single();

  if (error) throw error;
  return data as { id: string; google_sub: string; email: string | null; name: string | null };
}

export async function getUserCurrency(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('user_settings')
    .select('default_currency')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.default_currency as string | undefined;
}

export async function getUserPreferences(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('user_settings')
    .select('default_currency, risk_profile')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return {
    defaultCurrency: (data?.default_currency as string | undefined) ?? 'EUR',
    riskProfile: (data?.risk_profile as string | undefined) ?? null,
  };
}

export async function upsertUserSettings(params: { userId: string; defaultCurrency?: string; riskProfile?: string }) {
  const { userId, defaultCurrency, riskProfile } = params;
  const supabase = getSupabaseAdmin();
  const updates: Record<string, string> = { user_id: userId };
  if (defaultCurrency !== undefined) updates.default_currency = defaultCurrency;
  if (riskProfile !== undefined) updates.risk_profile = riskProfile;
  const { error } = await supabase.from('user_settings').upsert(updates, { onConflict: 'user_id' });
  if (error) throw error;
}

export type DbTransaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
};

export async function listTransactions(userId: string): Promise<DbTransaction[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('transactions')
    .select('id, type, amount, description, transaction_date, category')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10000);

  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    transaction_date: string;
    category: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    type: r.type as 'income' | 'expense',
    amount: Number(r.amount),
    description: r.description,
    date: r.transaction_date,
    category: r.category,
  }));
}

export async function getUserByEmail(email: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, password_hash')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; email: string; name: string | null; password_hash: string | null } | null;
}

export async function countEmailUsers(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .not('password_hash', 'is', null);
  if (error) throw error;
  return count ?? 0;
}

export async function createEmailUser(params: {
  name: string;
  email: string;
  birthday: string;
  passwordHash: string;
}) {
  const { name, email, birthday, passwordHash } = params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .insert({ name, email, birthday, password_hash: passwordHash })
    .select('id, email, name')
    .single();
  if (error) throw error;
  return data as { id: string; email: string; name: string };
}

export async function getUserById(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, birthday')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as { id: string; email: string | null; name: string | null; birthday: string | null } | undefined;
}

export async function updateUser(params: { userId: string; name?: string; birthday?: string }) {
  const { userId, name, birthday } = params;
  const supabase = getSupabaseAdmin();
  const updates: Record<string, string> = {};
  if (name !== undefined) updates.name = name;
  if (birthday !== undefined) updates.birthday = birthday;
  const { error } = await supabase.from('users').update(updates).eq('id', userId);
  if (error) throw error;
}

export async function createTransaction(params: {
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  transactionDate: string;
  category: string;
}) {
  const { userId, type, amount, description, transactionDate, category } = params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type,
      amount,
      description,
      transaction_date: transactionDate,
      category,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data as { id: string };
}

export async function updateTransaction(params: {
  userId: string;
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  transactionDate: string;
  category: string;
}) {
  const { userId, id, type, amount, description, transactionDate, category } = params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('transactions')
    .update({
      type,
      amount,
      description,
      transaction_date: transactionDate,
      category,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .single();

  if (error) throw error;
  return data as { id: string };
}

export async function deleteTransaction(params: { userId: string; id: string }) {
  const { userId, id } = params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

// Budgets are stored as a JSONB object { [category]: monthlyAllowance } in user_settings
export async function getBudgets(userId: string): Promise<Record<string, number>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('user_settings')
    .select('budgets')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data?.budgets as Record<string, number>) ?? {};
}

export async function upsertBudgets(params: { userId: string; budgets: Record<string, number> }) {
  const { userId, budgets } = params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, budgets }, { onConflict: 'user_id' });
  if (error) throw error;
}

// ── Plaid ─────────────────────────────────────────────────────────────────────

export type PlaidConnection = {
  id: string;
  institution: string | null;
  status: string;
  last_synced_at: string | null;
  created_at?: string;
};

export async function getPlaidConnections(userId: string): Promise<PlaidConnection[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('plaid_connections')
    .select('id, institution, status, last_synced_at, created_at')
    .eq('user_id', userId)
    .neq('status', 'disconnected')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PlaidConnection[];
}

export async function getPlaidConnectionWithToken(connectionId: string, userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('plaid_connections')
    .select('id, access_token, cursor, item_id, institution, last_synced_at')
    .eq('id', connectionId)
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data as { id: string; access_token: string; cursor: string | null; item_id: string; institution: string | null; last_synced_at: string | null };
}

export async function getPlaidConnectionByItemId(itemId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('plaid_connections')
    .select('id, user_id, access_token, cursor')
    .eq('item_id', itemId)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; user_id: string; access_token: string; cursor: string | null } | null;
}

export async function insertPlaidConnection(params: {
  userId: string;
  accessToken: string;
  itemId: string;
  institution: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('plaid_connections')
    .insert({
      user_id: params.userId,
      access_token: params.accessToken,
      item_id: params.itemId,
      institution: params.institution,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data as { id: string };
}

export async function updatePlaidCursor(connectionId: string, cursor: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('plaid_connections')
    .update({ cursor, last_synced_at: new Date().toISOString() })
    .eq('id', connectionId);
  if (error) throw error;
}

export async function updatePlaidStatus(itemId: string, status: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('plaid_connections')
    .update({ status })
    .eq('item_id', itemId);
  if (error) throw error;
}

export async function deletePlaidConnection(connectionId: string, userId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('plaid_connections')
    .update({ status: 'disconnected' })
    .eq('id', connectionId)
    .eq('user_id', userId);
  if (error) throw error;
}

export type PendingTransaction = {
  id: string;
  plaid_txn_id: string;
  date: string;
  description: string;
  raw_amount: number;
  currency: string;
  plaid_category: string | null;
  possible_duplicate: boolean;
  institution: string | null;
  connection_id: string;
};

export async function getPendingTransactions(userId: string): Promise<PendingTransaction[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('pending_transactions')
    .select('id, plaid_txn_id, date, description, raw_amount, currency, plaid_category, possible_duplicate, connection_id, plaid_connections(institution)')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('date', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    ...r,
    institution: r.plaid_connections?.institution ?? null,
  }));
}

export async function getPendingCount(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('pending_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending');
  if (error) throw error;
  return count ?? 0;
}

export async function upsertPendingTransaction(params: {
  userId: string;
  connectionId: string;
  plaidTxnId: string;
  date: string;
  description: string;
  rawAmount: number;
  currency: string;
  plaidCategory: string | null;
  possibleDuplicate: boolean;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('pending_transactions').upsert(
    {
      user_id: params.userId,
      connection_id: params.connectionId,
      plaid_txn_id: params.plaidTxnId,
      date: params.date,
      description: params.description,
      raw_amount: params.rawAmount,
      currency: params.currency,
      plaid_category: params.plaidCategory,
      possible_duplicate: params.possibleDuplicate,
      status: 'pending',
    },
    { onConflict: 'user_id,plaid_txn_id', ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function setPendingStatus(id: string, userId: string, status: 'accepted' | 'rejected') {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('pending_transactions')
    .update({ status })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deletePendingByPlaidId(plaidTxnId: string, userId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('pending_transactions')
    .delete()
    .eq('plaid_txn_id', plaidTxnId)
    .eq('user_id', userId)
    .eq('status', 'pending');
  if (error) throw error;
}

export async function transactionExistsByPlaidId(userId: string, plaidTxnId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('plaid_txn_id', plaidTxnId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function pendingExistsByPlaidId(userId: string, plaidTxnId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('pending_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('plaid_txn_id', plaidTxnId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function createTransactionFromPlaid(params: {
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  transactionDate: string;
  category: string;
  plaidTxnId: string;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('transactions').insert({
    user_id: params.userId,
    type: params.type,
    amount: params.amount,
    description: params.description,
    transaction_date: params.transactionDate,
    category: params.category,
    plaid_txn_id: params.plaidTxnId,
  });
  if (error) throw error;
}
