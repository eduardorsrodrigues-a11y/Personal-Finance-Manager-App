import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useTransactions } from './TransactionContext';

export interface SharedMember {
  id: string;
  name: string;
  email: string | null;
  isMe: boolean;
}

export interface SharedSplit {
  memberId: string;
  amount: number;
}

export interface SharedExpense {
  id: string;
  kind: 'expense' | 'settlement';
  description: string;
  amount: number;
  category: string;
  date: string;
  paidBy: string;
  splits: SharedSplit[];
  createdAt: string;
}

export interface SharedGroupSummary {
  id: string;
  name: string;
  isOwner: boolean;
  memberCount: number;
  myMemberId: string;
  myBalance: number;
  lastActivity: string | null;
}

export interface SharedGroupDetail {
  id: string;
  name: string;
  isOwner: boolean;
  myMemberId: string;
  members: SharedMember[];
  expenses: SharedExpense[];
}

export type SharedExpenseInput = {
  kind: 'expense' | 'settlement';
  description: string;
  amount: number;
  category: string;
  date: string;
  paidBy: string;
  splits: SharedSplit[];
};

/** Result of a mutation: `null` on success, otherwise a user-facing error message. */
type MutationResult = Promise<string | null>;

interface SharedExpensesContextType {
  groups: SharedGroupSummary[];
  isLoading: boolean;
  refreshGroups: () => Promise<void>;
  fetchGroup: (groupId: string) => Promise<SharedGroupDetail | null>;
  createGroup: (name: string, members: Array<{ name: string; email: string }>) => Promise<{ groupId?: string; error?: string }>;
  renameGroup: (groupId: string, name: string) => MutationResult;
  deleteGroup: (groupId: string) => MutationResult;
  addMember: (groupId: string, name: string, email: string) => MutationResult;
  removeMember: (groupId: string, memberId: string) => MutationResult;
  createExpense: (groupId: string, input: SharedExpenseInput) => MutationResult;
  updateExpense: (expenseId: string, input: SharedExpenseInput) => MutationResult;
  deleteExpense: (expenseId: string) => MutationResult;
}

const SharedExpensesContext = createContext<SharedExpensesContextType | undefined>(undefined);

async function post(body: Record<string, unknown>): Promise<{ ok: boolean; json: Record<string, unknown> }> {
  try {
    const res = await fetch('/api/shared-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, json };
  } catch {
    return { ok: false, json: { error: 'Network error. Please try again.' } };
  }
}

const errorOf = (json: Record<string, unknown>) => (json.error as string | undefined) ?? 'Something went wrong.';

export function SharedExpensesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { loadTransactions } = useTransactions();
  const [groups, setGroups] = useState<SharedGroupSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshGroups = useCallback(async () => {
    if (!user?.id) { setGroups([]); return; }
    setIsLoading(true);
    try {
      const res = await fetch('/api/shared-expenses', { credentials: 'include' });
      if (!res.ok) return;
      const json = await res.json();
      setGroups((json.groups ?? []) as SharedGroupSummary[]);
    } catch {
      // keep previous state
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refreshGroups();
  }, [refreshGroups]);

  const fetchGroup = useCallback(async (groupId: string) => {
    try {
      const res = await fetch(`/api/shared-expenses?groupId=${encodeURIComponent(groupId)}`, { credentials: 'include' });
      if (!res.ok) return null;
      const json = await res.json();
      return (json.group ?? null) as SharedGroupDetail | null;
    } catch {
      return null;
    }
  }, []);

  /** Runs a mutation, then refreshes group balances and (optionally) personal transactions. */
  const mutate = async (body: Record<string, unknown>, opts: { syncTransactions: boolean }): MutationResult => {
    const { ok, json } = await post(body);
    if (!ok) return errorOf(json);
    await Promise.all([refreshGroups(), opts.syncTransactions ? loadTransactions() : Promise.resolve()]);
    return null;
  };

  const value: SharedExpensesContextType = {
    groups,
    isLoading,
    refreshGroups,
    fetchGroup,
    createGroup: async (name, members) => {
      const { ok, json } = await post({ action: 'createGroup', name, members });
      if (!ok) return { error: errorOf(json) };
      await refreshGroups();
      return { groupId: json.groupId as string };
    },
    renameGroup: (groupId, name) => mutate({ action: 'renameGroup', groupId, name }, { syncTransactions: true }),
    deleteGroup: (groupId) => mutate({ action: 'deleteGroup', groupId }, { syncTransactions: true }),
    addMember: (groupId, name, email) => mutate({ action: 'addMember', groupId, name, email }, { syncTransactions: false }),
    removeMember: (groupId, memberId) => mutate({ action: 'removeMember', groupId, memberId }, { syncTransactions: false }),
    createExpense: (groupId, input) => mutate({ action: 'createExpense', groupId, ...input }, { syncTransactions: true }),
    updateExpense: (expenseId, input) => mutate({ action: 'updateExpense', expenseId, ...input }, { syncTransactions: true }),
    deleteExpense: (expenseId) => mutate({ action: 'deleteExpense', expenseId }, { syncTransactions: true }),
  };

  return <SharedExpensesContext.Provider value={value}>{children}</SharedExpensesContext.Provider>;
}

export function useSharedExpenses() {
  const ctx = useContext(SharedExpensesContext);
  if (!ctx) throw new Error('useSharedExpenses must be used within SharedExpensesProvider');
  return ctx;
}
