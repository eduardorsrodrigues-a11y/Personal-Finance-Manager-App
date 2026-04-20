import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => Promise<void>;
  loadTransactions: () => Promise<void>;
  hasPendingSync: boolean;
  isLoading: boolean;
}

const GUEST_TRANSACTIONS_KEY = 'expense_manager_guest_transactions';
const PENDING_SYNC_KEY = 'fw_pending_sync';

function loadPending(): Array<Omit<Transaction, 'id'>> {
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePending(items: Array<Omit<Transaction, 'id'>>): void {
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(items));
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

function loadGuestTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(GUEST_TRANSACTIONS_KEY);
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
}

function saveGuestTransactions(transactions: Transaction[]): void {
  localStorage.setItem(GUEST_TRANSACTIONS_KEY, JSON.stringify(transactions));
}

export function TransactionProvider({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasPendingSync, setHasPendingSync] = useState(() => loadPending().length > 0);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = async () => {
    if (!user?.id) {
      setTransactions([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/transactions', { credentials: 'include' });
      if (!res.ok) { setTransactions([]); return; }
      const json = await res.json();
      setTransactions((json.transactions ?? []) as Transaction[]);
    } finally {
      setIsLoading(false);
    }
  };

  // Uploads all guest transactions to the cloud, then clears localStorage.
  const migrateGuestTransactions = async (guestTxs: Transaction[]) => {
    setIsLoading(true);
    await Promise.all(
      guestTxs.map((tx) =>
        fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: tx.type,
            amount: tx.amount,
            description: tx.description,
            date: tx.date,
            category: tx.category,
          }),
        }),
      ),
    );
    localStorage.removeItem(GUEST_TRANSACTIONS_KEY);
    await refresh();
  };

  useEffect(() => {
    if (isGuest && !user?.id) {
      // Guest mode: serve from localStorage
      setTransactions(loadGuestTransactions());
      return;
    }

    if (!user?.id) {
      setTransactions([]);
      return;
    }

    // Authenticated: check whether there are guest transactions to migrate
    const guestTxs = loadGuestTransactions();
    if (guestTxs.length > 0) {
      void migrateGuestTransactions(guestTxs);
    } else {
      void refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isGuest]);

  // Flush pending sync when back online
  useEffect(() => {
    const flushPending = async () => {
      if (!user?.id) return;
      const pending = loadPending();
      if (pending.length === 0) return;
      try {
        await Promise.all(
          pending.map((tx) =>
            fetch('/api/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(tx),
            })
          )
        );
        savePending([]);
        setHasPendingSync(false);
        await refresh();
      } catch {
        // Will retry next time online
      }
    };

    window.addEventListener('online', flushPending);
    return () => window.removeEventListener('online', flushPending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (isGuest) {
      const newTx: Transaction = {
        ...transaction,
        id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      };
      const updated = [...transactions, newTx];
      saveGuestTransactions(updated);
      setTransactions(updated);
      window.dispatchEvent(new Event('fw:first-transaction'));
      return;
    }

    // Dispatch engagement event for PWA install prompt
    window.dispatchEvent(new Event('fw:first-transaction'));

    if (!navigator.onLine) {
      // Save to pending queue and add to local state optimistically
      const pending = loadPending();
      savePending([...pending, transaction]);
      const tempTx: Transaction = {
        ...transaction,
        id: `pending_${Date.now()}`,
      };
      setTransactions((prev) => [tempTx, ...prev]);
      setHasPendingSync(true);
      return;
    }

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(transaction),
      });
      if (!res.ok) return;
      await refresh();
    } catch {
      if (!navigator.onLine) {
        const pending = loadPending();
        savePending([...pending, transaction]);
        const tempTx: Transaction = { ...transaction, id: `pending_${Date.now()}` };
        setTransactions((prev) => [tempTx, ...prev]);
        setHasPendingSync(true);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    if (isGuest) {
      const updated = transactions.filter((t) => t.id !== id);
      saveGuestTransactions(updated);
      setTransactions(updated);
      return;
    }

    const res = await fetch(`/api/transactions?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) return;
    await refresh();
  };

  const updateTransaction = async (id: string, transaction: Omit<Transaction, 'id'>) => {
    if (isGuest) {
      const updated = transactions.map((t) => (t.id === id ? { ...transaction, id } : t));
      saveGuestTransactions(updated);
      setTransactions(updated);
      return;
    }

    const res = await fetch(`/api/transactions?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(transaction),
    });
    if (!res.ok) return;
    await refresh();
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, deleteTransaction, updateTransaction, loadTransactions: refresh, hasPendingSync, isLoading }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
}
