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

export async function upsertUserSettings(params: { userId: string; defaultCurrency: string }) {
  const { userId, defaultCurrency } = params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('user_settings').upsert(
    { user_id: userId, default_currency: defaultCurrency },
    { onConflict: 'user_id' },
  );
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
    .order('created_at', { ascending: false });

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

export async function getUserById(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as { id: string; email: string | null; name: string | null } | undefined;
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
