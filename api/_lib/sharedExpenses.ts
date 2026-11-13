import { getSupabaseAdmin } from './supabaseAdmin.js';
import { computeBalances } from './sharedExpenseMath.js';

// ── Types ─────────────────────────────────────────────────────────────────────

type MemberRow = {
  id: string;
  group_id: string;
  user_id: string | null;
  email: string | null;
  display_name: string;
};

type ExpenseRow = {
  id: string;
  group_id: string;
  kind: 'expense' | 'settlement';
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  paid_by: string;
  created_at: string;
};

type SplitRow = { expense_id: string; member_id: string; amount: number };

export type ApiMember = {
  id: string;
  name: string;
  email: string | null;
  isMe: boolean;
};

export type ApiExpense = {
  id: string;
  kind: 'expense' | 'settlement';
  description: string;
  amount: number;
  category: string;
  date: string;
  paidBy: string;
  splits: Array<{ memberId: string; amount: number }>;
  createdAt: string;
};

export type ApiGroupSummary = {
  id: string;
  name: string;
  isOwner: boolean;
  memberCount: number;
  myMemberId: string;
  myBalance: number;
  lastActivity: string | null;
};

export type ApiGroupDetail = {
  id: string;
  name: string;
  isOwner: boolean;
  myMemberId: string;
  members: ApiMember[];
  expenses: ApiExpense[];
};

/** Raised for user-facing errors (bad state, forbidden). Handlers map to 4xx. */
export class SharedExpenseError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = 'SharedExpenseError';
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MEMBER_COLS = 'id, group_id, user_id, email, display_name';
const EXPENSE_COLS = 'id, group_id, kind, description, amount, category, expense_date, paid_by, created_at';

/** Escapes LIKE wildcards so `ilike` behaves as a case-insensitive equality. */
function likeExact(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .ilike('email', likeExact(email))
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as { id: string } | null)?.id ?? null;
}

/** Returns the caller's membership in a group, or throws 404 if not a member. */
export async function requireMembership(userId: string, groupId: string): Promise<MemberRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('expense_group_members')
    .select(MEMBER_COLS)
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new SharedExpenseError('Group not found', 404);
  return data as MemberRow;
}

async function getExpenseRow(expenseId: string): Promise<ExpenseRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('shared_expenses')
    .select(EXPENSE_COLS)
    .eq('id', expenseId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new SharedExpenseError('Expense not found', 404);
  return data as ExpenseRow;
}

async function loadGroupData(groupIds: string[]) {
  const supabase = getSupabaseAdmin();
  if (groupIds.length === 0) {
    return { groups: [], members: [] as MemberRow[], expenses: [] as ExpenseRow[], splits: [] as SplitRow[] };
  }
  const [groupsRes, membersRes, expensesRes] = await Promise.all([
    supabase.from('expense_groups').select('id, name, created_by, created_at').in('id', groupIds),
    supabase.from('expense_group_members').select(MEMBER_COLS).in('group_id', groupIds).order('created_at'),
    supabase
      .from('shared_expenses')
      .select(EXPENSE_COLS)
      .in('group_id', groupIds)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false }),
  ]);
  if (groupsRes.error) throw groupsRes.error;
  if (membersRes.error) throw membersRes.error;
  if (expensesRes.error) throw expensesRes.error;

  const expenses = ((expensesRes.data ?? []) as ExpenseRow[]).map((e) => ({ ...e, amount: Number(e.amount) }));
  let splits: SplitRow[] = [];
  if (expenses.length > 0) {
    const { data, error } = await supabase
      .from('shared_expense_splits')
      .select('expense_id, member_id, amount')
      .in('expense_id', expenses.map((e) => e.id));
    if (error) throw error;
    splits = ((data ?? []) as SplitRow[]).map((s) => ({ ...s, amount: Number(s.amount) }));
  }

  return {
    groups: (groupsRes.data ?? []) as Array<{ id: string; name: string; created_by: string | null; created_at: string }>,
    members: (membersRes.data ?? []) as MemberRow[],
    expenses,
    splits,
  };
}

function toApiExpense(e: ExpenseRow, splits: SplitRow[]): ApiExpense {
  return {
    id: e.id,
    kind: e.kind,
    description: e.description,
    amount: e.amount,
    category: e.category,
    date: e.expense_date,
    paidBy: e.paid_by,
    splits: splits.filter((s) => s.expense_id === e.id).map((s) => ({ memberId: s.member_id, amount: s.amount })),
    createdAt: e.created_at,
  };
}

// ── Transaction mirroring ─────────────────────────────────────────────────────

/**
 * Makes `transactions` reflect an expense: each member with an account and a
 * non-zero share gets one expense transaction for their share. Settlements
 * never produce transactions (they are transfers, not spending).
 */
export async function syncExpenseTransactions(expenseId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const expense = await getExpenseRow(expenseId);

  const desired = new Map<string, number>(); // userId → share
  if (expense.kind === 'expense') {
    const [{ data: splitData, error: splitErr }, { data: memberData, error: memberErr }] = await Promise.all([
      supabase.from('shared_expense_splits').select('member_id, amount').eq('expense_id', expenseId),
      supabase.from('expense_group_members').select('id, user_id').eq('group_id', expense.group_id),
    ]);
    if (splitErr) throw splitErr;
    if (memberErr) throw memberErr;
    const userByMember = new Map(
      ((memberData ?? []) as Array<{ id: string; user_id: string | null }>).map((m) => [m.id, m.user_id]),
    );
    for (const s of (splitData ?? []) as Array<{ member_id: string; amount: number }>) {
      const uid = userByMember.get(s.member_id);
      const amount = Number(s.amount);
      if (uid && amount > 0) desired.set(uid, amount);
    }
  }

  const { data: existingData, error: existingErr } = await supabase
    .from('transactions')
    .select('id, user_id')
    .eq('shared_expense_id', expenseId);
  if (existingErr) throw existingErr;
  const existing = (existingData ?? []) as Array<{ id: string; user_id: string }>;

  const staleIds = existing.filter((t) => !desired.has(t.user_id)).map((t) => t.id);
  if (staleIds.length > 0) {
    const { error } = await supabase.from('transactions').delete().in('id', staleIds);
    if (error) throw error;
  }
  if (desired.size === 0) return;

  const { data: groupData, error: groupErr } = await supabase
    .from('expense_groups')
    .select('name')
    .eq('id', expense.group_id)
    .single();
  if (groupErr) throw groupErr;
  const description = `${expense.description} (${(groupData as { name: string }).name})`.slice(0, 500);
  const fields = {
    type: 'expense' as const,
    description,
    transaction_date: expense.expense_date,
    category: expense.category,
  };

  const existingByUser = new Map(existing.map((t) => [t.user_id, t.id]));
  const inserts: Array<Record<string, unknown>> = [];
  const updates: Array<PromiseLike<{ error: unknown }>> = [];
  for (const [uid, amount] of desired) {
    const txId = existingByUser.get(uid);
    if (txId) {
      updates.push(supabase.from('transactions').update({ ...fields, amount }).eq('id', txId));
    } else {
      inserts.push({ ...fields, amount, user_id: uid, shared_expense_id: expenseId });
    }
  }
  const results = await Promise.all(updates);
  for (const r of results) if (r.error) throw r.error;
  if (inserts.length > 0) {
    const { error } = await supabase.from('transactions').insert(inserts);
    if (error) throw error;
  }
}

async function syncGroupTransactions(groupId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('shared_expenses').select('id').eq('group_id', groupId);
  if (error) throw error;
  for (const e of (data ?? []) as Array<{ id: string }>) {
    await syncExpenseTransactions(e.id);
  }
}

/** Re-mirrors every expense that has a split for one of the given members. */
async function syncMemberTransactions(memberIds: string[]): Promise<void> {
  if (memberIds.length === 0) return;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('shared_expense_splits')
    .select('expense_id')
    .in('member_id', memberIds);
  if (error) throw error;
  const expenseIds = [...new Set(((data ?? []) as Array<{ expense_id: string }>).map((r) => r.expense_id))];
  for (const id of expenseIds) await syncExpenseTransactions(id);
}

// ── Linking members to accounts ───────────────────────────────────────────────

/**
 * Links any member rows that were added with this user's email before they had
 * an account (or before they first opened the app), and backfills their share
 * transactions. Cheap no-op when there is nothing pending.
 */
export async function linkPendingMemberships(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: user, error: userErr } = await supabase.from('users').select('email').eq('id', userId).maybeSingle();
  if (userErr) throw userErr;
  const email = (user as { email: string | null } | null)?.email;
  if (!email) return;

  const { data, error } = await supabase
    .from('expense_group_members')
    .select('id, group_id')
    .is('user_id', null)
    .ilike('email', likeExact(email));
  if (error) throw error;
  const pending = (data ?? []) as Array<{ id: string; group_id: string }>;
  if (pending.length === 0) return;

  const { data: mine, error: mineErr } = await supabase
    .from('expense_group_members')
    .select('group_id')
    .eq('user_id', userId)
    .in('group_id', pending.map((p) => p.group_id));
  if (mineErr) throw mineErr;
  const alreadyIn = new Set(((mine ?? []) as Array<{ group_id: string }>).map((m) => m.group_id));

  const toLink = pending.filter((p) => !alreadyIn.has(p.group_id)).map((p) => p.id);
  if (toLink.length === 0) return;
  const { error: linkErr } = await supabase.from('expense_group_members').update({ user_id: userId }).in('id', toLink);
  if (linkErr) throw linkErr;
  await syncMemberTransactions(toLink);
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function listGroups(userId: string): Promise<ApiGroupSummary[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('expense_group_members').select('id, group_id').eq('user_id', userId);
  if (error) throw error;
  const memberships = (data ?? []) as Array<{ id: string; group_id: string }>;
  const { groups, members, expenses, splits } = await loadGroupData(memberships.map((m) => m.group_id));

  return groups
    .map((g) => {
      const myMemberId = memberships.find((m) => m.group_id === g.id)!.id;
      const groupMembers = members.filter((m) => m.group_id === g.id);
      const groupExpenses = expenses.filter((e) => e.group_id === g.id).map((e) => toApiExpense(e, splits));
      const balances = computeBalances(groupMembers.map((m) => m.id), groupExpenses);
      return {
        id: g.id,
        name: g.name,
        isOwner: g.created_by === userId,
        memberCount: groupMembers.length,
        myMemberId,
        myBalance: balances[myMemberId] ?? 0,
        lastActivity: groupExpenses[0]?.date ?? null,
        _createdAt: g.created_at,
      };
    })
    .sort((a, b) => (b.lastActivity ?? b._createdAt).localeCompare(a.lastActivity ?? a._createdAt))
    .map(({ _createdAt, ...rest }) => rest);
}

export async function getGroupDetail(userId: string, groupId: string): Promise<ApiGroupDetail> {
  const me = await requireMembership(userId, groupId);
  const { groups, members, expenses, splits } = await loadGroupData([groupId]);
  const group = groups[0];
  if (!group) throw new SharedExpenseError('Group not found', 404);
  return {
    id: group.id,
    name: group.name,
    isOwner: group.created_by === userId,
    myMemberId: me.id,
    members: members.map((m) => ({
      id: m.id,
      name: m.display_name,
      email: m.email,
      isMe: m.user_id === userId,
    })),
    expenses: expenses.map((e) => toApiExpense(e, splits)),
  };
}

// ── Group mutations ───────────────────────────────────────────────────────────

export async function createGroup(params: {
  userId: string;
  name: string;
  members: Array<{ name: string; email: string | null }>;
}): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', params.userId)
    .single();
  if (userErr) throw userErr;
  const me = user as { name: string | null; email: string | null };

  const { data: group, error } = await supabase
    .from('expense_groups')
    .insert({ name: params.name, created_by: params.userId })
    .select('id')
    .single();
  if (error) throw error;
  const groupId = (group as { id: string }).id;

  const { error: meErr } = await supabase.from('expense_group_members').insert({
    group_id: groupId,
    user_id: params.userId,
    email: me.email,
    display_name: me.name || me.email?.split('@')[0] || 'Me',
  });
  if (meErr) throw meErr;

  for (const m of params.members) {
    await addMember({ userId: params.userId, groupId, name: m.name, email: m.email });
  }
  return groupId;
}

export async function renameGroup(params: { userId: string; groupId: string; name: string }): Promise<void> {
  await requireMembership(params.userId, params.groupId);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('expense_groups').update({ name: params.name }).eq('id', params.groupId);
  if (error) throw error;
  await syncGroupTransactions(params.groupId); // descriptions include the group name
}

export async function deleteGroup(params: { userId: string; groupId: string }): Promise<void> {
  await requireMembership(params.userId, params.groupId);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('expense_groups').select('created_by').eq('id', params.groupId).single();
  if (error) throw error;
  if ((data as { created_by: string | null }).created_by !== params.userId) {
    throw new SharedExpenseError('Only the group creator can delete this group', 403);
  }
  // Cascades to members, expenses, splits and the mirrored transactions.
  const { error: delErr } = await supabase.from('expense_groups').delete().eq('id', params.groupId);
  if (delErr) throw delErr;
}

export async function addMember(params: {
  userId: string;
  groupId: string;
  name: string;
  email: string | null;
}): Promise<string> {
  await requireMembership(params.userId, params.groupId);
  const supabase = getSupabaseAdmin();
  const email = params.email?.toLowerCase() ?? null;

  let linkedUserId: string | null = null;
  if (email) {
    const { data: dupe, error: dupeErr } = await supabase
      .from('expense_group_members')
      .select('id')
      .eq('group_id', params.groupId)
      .ilike('email', likeExact(email))
      .maybeSingle();
    if (dupeErr) throw dupeErr;
    if (dupe) throw new SharedExpenseError('Someone with that email is already in this group', 409);

    linkedUserId = await findUserIdByEmail(email);
    if (linkedUserId) {
      const { data: dupeUser } = await supabase
        .from('expense_group_members')
        .select('id')
        .eq('group_id', params.groupId)
        .eq('user_id', linkedUserId)
        .maybeSingle();
      if (dupeUser) throw new SharedExpenseError('That person is already in this group', 409);
    }
  }

  const { data, error } = await supabase
    .from('expense_group_members')
    .insert({ group_id: params.groupId, user_id: linkedUserId, email, display_name: params.name })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

/** Removes a member (or lets the caller leave). Blocked while they appear in any expense. */
export async function removeMember(params: { userId: string; groupId: string; memberId: string }): Promise<void> {
  await requireMembership(params.userId, params.groupId);
  const supabase = getSupabaseAdmin();

  const [{ count: paidCount, error: paidErr }, { count: splitCount, error: splitErr }] = await Promise.all([
    supabase.from('shared_expenses').select('id', { count: 'exact', head: true }).eq('paid_by', params.memberId),
    supabase.from('shared_expense_splits').select('expense_id', { count: 'exact', head: true }).eq('member_id', params.memberId),
  ]);
  if (paidErr) throw paidErr;
  if (splitErr) throw splitErr;
  if ((paidCount ?? 0) > 0 || (splitCount ?? 0) > 0) {
    throw new SharedExpenseError('This member is part of existing expenses. Remove them from those expenses first.', 409);
  }

  const { count: memberCount } = await supabase
    .from('expense_group_members')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', params.groupId);
  const { error } = await supabase
    .from('expense_group_members')
    .delete()
    .eq('id', params.memberId)
    .eq('group_id', params.groupId);
  if (error) throw error;

  // Last one out: clean up the empty group.
  if ((memberCount ?? 0) <= 1) {
    await supabase.from('expense_groups').delete().eq('id', params.groupId);
  }
}

// ── Expense mutations ─────────────────────────────────────────────────────────

export type ExpenseInput = {
  kind: 'expense' | 'settlement';
  description: string;
  amount: number;
  category: string;
  date: string;
  paidBy: string;
  splits: Array<{ memberId: string; amount: number }>;
};

async function assertMembersInGroup(groupId: string, memberIds: string[]): Promise<void> {
  const supabase = getSupabaseAdmin();
  const unique = [...new Set(memberIds)];
  const { data, error } = await supabase
    .from('expense_group_members')
    .select('id')
    .eq('group_id', groupId)
    .in('id', unique);
  if (error) throw error;
  if ((data ?? []).length !== unique.length) {
    throw new SharedExpenseError('One or more members do not belong to this group');
  }
}

async function writeSplits(expenseId: string, splits: ExpenseInput['splits']): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error: delErr } = await supabase.from('shared_expense_splits').delete().eq('expense_id', expenseId);
  if (delErr) throw delErr;
  const rows = splits.map((s) => ({ expense_id: expenseId, member_id: s.memberId, amount: s.amount }));
  if (rows.length === 0) return;
  const { error } = await supabase.from('shared_expense_splits').insert(rows);
  if (error) throw error;
}

export async function createExpense(params: { userId: string; groupId: string; input: ExpenseInput }): Promise<string> {
  const { userId, groupId, input } = params;
  await requireMembership(userId, groupId);
  await assertMembersInGroup(groupId, [input.paidBy, ...input.splits.map((s) => s.memberId)]);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('shared_expenses')
    .insert({
      group_id: groupId,
      kind: input.kind,
      description: input.description,
      amount: input.amount,
      category: input.category,
      expense_date: input.date,
      paid_by: input.paidBy,
      created_by: userId,
    })
    .select('id')
    .single();
  if (error) throw error;
  const expenseId = (data as { id: string }).id;
  try {
    await writeSplits(expenseId, input.splits);
  } catch (err) {
    await supabase.from('shared_expenses').delete().eq('id', expenseId);
    throw err;
  }
  await syncExpenseTransactions(expenseId);
  return expenseId;
}

export async function updateExpense(params: { userId: string; expenseId: string; input: ExpenseInput }): Promise<void> {
  const { userId, expenseId, input } = params;
  const existing = await getExpenseRow(expenseId);
  await requireMembership(userId, existing.group_id);
  await assertMembersInGroup(existing.group_id, [input.paidBy, ...input.splits.map((s) => s.memberId)]);
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('shared_expenses')
    .update({
      kind: input.kind,
      description: input.description,
      amount: input.amount,
      category: input.category,
      expense_date: input.date,
      paid_by: input.paidBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', expenseId);
  if (error) throw error;
  await writeSplits(expenseId, input.splits);
  await syncExpenseTransactions(expenseId);
}

export async function deleteExpense(params: { userId: string; expenseId: string }): Promise<void> {
  const existing = await getExpenseRow(params.expenseId);
  await requireMembership(params.userId, existing.group_id);
  const supabase = getSupabaseAdmin();
  // Cascades to splits and mirrored transactions.
  const { error } = await supabase.from('shared_expenses').delete().eq('id', params.expenseId);
  if (error) throw error;
}
