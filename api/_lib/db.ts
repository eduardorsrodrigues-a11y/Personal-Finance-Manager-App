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
  sharedExpenseId: string | null;
  sharedGroupId: string | null;
};

export async function listTransactions(userId: string): Promise<DbTransaction[]> {
  const supabase = getSupabaseAdmin();
  // Supabase caps each request at 1000 rows regardless of .limit(), so page
  // through with .range() until a short page comes back.
  const CHUNK = 1000;
  const data: unknown[] = [];
  for (let from = 0; ; from += CHUNK) {
    const { data: page, error } = await supabase
      .from('transactions')
      .select('id, type, amount, description, transaction_date, category, shared_expense_id, shared_expenses(group_id)')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + CHUNK - 1);
    if (error) throw error;
    data.push(...(page ?? []));
    if (!page || page.length < CHUNK) break;
  }

  const rows = data as Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    transaction_date: string;
    category: string;
    shared_expense_id: string | null;
    shared_expenses: { group_id: string } | Array<{ group_id: string }> | null;
  }>;

  return rows.map((r) => {
    const shared = Array.isArray(r.shared_expenses) ? r.shared_expenses[0] : r.shared_expenses;
    return {
      id: r.id,
      type: r.type as 'income' | 'expense',
      amount: Number(r.amount),
      description: r.description,
      date: r.transaction_date,
      category: r.category,
      sharedExpenseId: r.shared_expense_id ?? null,
      sharedGroupId: shared?.group_id ?? null,
    };
  });
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

/** True when the transaction mirrors a shared expense share (managed from Shared Expenses). */
export async function isSharedTransaction(params: { userId: string; id: string }): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('transactions')
    .select('shared_expense_id')
    .eq('id', params.id)
    .eq('user_id', params.userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean((data as { shared_expense_id: string | null } | null)?.shared_expense_id);
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

// ── Portfolio ──────────────────────────────────────────────────────────────────

export type PortfolioItem = {
  id: string;
  section: 'cash' | 'savings' | 'investment' | 'physical' | 'liability';
  name: string;
  meta: string | null;
  abbr: string;
  color: string;
  type_label: string | null;
  type_class: string | null;
  current_value: number;
  invested_value: number | null;
  sort_order: number;
};

export type PortfolioSnapshot = {
  id: string;
  snapshot_month: string;
  net_worth: number;
  has_item_data: boolean;
};

export async function listPortfolioItems(userId: string): Promise<PortfolioItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('id, section, name, meta, abbr, color, type_label, type_class, current_value, invested_value, sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    id: r.id as string,
    section: r.section as PortfolioItem['section'],
    name: r.name as string,
    meta: (r.meta as string | null) ?? null,
    abbr: r.abbr as string,
    color: r.color as string,
    type_label: (r.type_label as string | null) ?? null,
    type_class: (r.type_class as string | null) ?? null,
    current_value: Number(r.current_value),
    invested_value: r.invested_value != null ? Number(r.invested_value) : null,
    sort_order: Number(r.sort_order ?? 0),
  }));
}

export async function createPortfolioItem(params: {
  userId: string;
  section: string;
  name: string;
  meta: string | null;
  abbr: string;
  color: string;
  typeLabel: string | null;
  typeClass: string | null;
  currentValue: number;
  investedValue: number | null;
  sortOrder: number;
}): Promise<{ id: string }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('portfolio_items')
    .insert({
      user_id: params.userId,
      section: params.section,
      name: params.name,
      meta: params.meta,
      abbr: params.abbr,
      color: params.color,
      type_label: params.typeLabel,
      type_class: params.typeClass,
      current_value: params.currentValue,
      invested_value: params.investedValue,
      sort_order: params.sortOrder,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data as { id: string };
}

export async function updatePortfolioItemValue(params: {
  userId: string;
  id: string;
  currentValue: number;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('portfolio_items')
    .update({ current_value: params.currentValue, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', params.userId);
  if (error) throw error;
}

export async function deletePortfolioItem(params: { userId: string; id: string }): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', params.id)
    .eq('user_id', params.userId);
  if (error) throw error;
}

export async function listPortfolioSnapshots(userId: string): Promise<PortfolioSnapshot[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('portfolio_snapshots')
    .select('id, snapshot_month, net_worth')
    .eq('user_id', userId)
    .order('snapshot_month', { ascending: true })
    .limit(24);
  if (error) throw error;

  const rows = (data ?? []) as Array<{ id: string; snapshot_month: string; net_worth: number }>;
  const snapshotIds = rows.map(r => r.id);

  const withItems = new Set<string>();
  if (snapshotIds.length > 0) {
    const { data: itemRows } = await supabase
      .from('portfolio_snapshot_items')
      .select('snapshot_id')
      .in('snapshot_id', snapshotIds)
      .eq('user_id', userId);
    for (const r of (itemRows ?? []) as Array<{ snapshot_id: string }>) {
      withItems.add(r.snapshot_id);
    }
  }

  return rows.map(r => ({
    id: r.id,
    snapshot_month: r.snapshot_month,
    net_worth: Number(r.net_worth),
    has_item_data: withItems.has(r.id),
  }));
}

export async function upsertPortfolioSnapshot(params: {
  userId: string;
  snapshotMonth: string;
  netWorth: number;
}): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('portfolio_snapshots')
    .upsert(
      { user_id: params.userId, snapshot_month: params.snapshotMonth, net_worth: params.netWorth },
      { onConflict: 'user_id,snapshot_month' },
    )
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function upsertSnapshotItems(params: {
  userId: string;
  snapshotId: string;
  items: Record<string, number>;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const rows = Object.entries(params.items).map(([item_id, value]) => ({
    user_id: params.userId,
    snapshot_id: params.snapshotId,
    item_id,
    value,
  }));
  if (rows.length === 0) return;
  const { error } = await supabase
    .from('portfolio_snapshot_items')
    .upsert(rows, { onConflict: 'snapshot_id,item_id' });
  if (error) throw error;
}

export async function getSnapshotItems(params: {
  userId: string;
  snapshotId: string;
}): Promise<Record<string, number>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('portfolio_snapshot_items')
    .select('item_id, value')
    .eq('snapshot_id', params.snapshotId)
    .eq('user_id', params.userId);
  if (error) throw error;
  const result: Record<string, number> = {};
  for (const r of (data ?? []) as Array<{ item_id: string; value: number }>) {
    result[r.item_id] = Number(r.value);
  }
  return result;
}

export async function updateSnapshotNetWorth(params: {
  userId: string;
  snapshotId: string;
  netWorth: number;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('portfolio_snapshots')
    .update({ net_worth: params.netWorth })
    .eq('id', params.snapshotId)
    .eq('user_id', params.userId);
  if (error) throw error;
}
