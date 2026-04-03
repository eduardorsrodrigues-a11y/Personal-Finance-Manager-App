import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type Budgets = Record<string, number>;

const GUEST_BUDGETS_KEY = 'expense_manager_guest_budgets';

interface BudgetContextValue {
  budgets: Budgets;
  setBudgetForCategory: (category: string, amount: number) => Promise<void>;
  setBudgetsAll: (newBudgets: Budgets) => Promise<void>;
  loading: boolean;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();
  const [budgets, setBudgets] = useState<Budgets>({});
  const [loading, setLoading] = useState(true);

  const loadBudgets = useCallback(async () => {
    if (isGuest) {
      try {
        const stored = localStorage.getItem(GUEST_BUDGETS_KEY);
        setBudgets(stored ? JSON.parse(stored) : {});
      } catch {
        setBudgets({});
      }
      setLoading(false);
      return;
    }

    if (user) {
      try {
        const res = await fetch('/api/budgets', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setBudgets(data.budgets ?? {});
        }
      } catch {
        // ignore
      }
      setLoading(false);
      return;
    }

    // Not logged in yet
    setBudgets({});
    setLoading(false);
  }, [user, isGuest]);

  useEffect(() => {
    setLoading(true);
    loadBudgets();
  }, [loadBudgets]);

  const setBudgetForCategory = useCallback(
    async (category: string, amount: number) => {
      const updated = { ...budgets, [category]: amount };
      setBudgets(updated);

      if (isGuest) {
        localStorage.setItem(GUEST_BUDGETS_KEY, JSON.stringify(updated));
        return;
      }

      if (user) {
        await fetch('/api/budgets', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ budgets: updated }),
        });
      }
    },
    [budgets, user, isGuest],
  );

  const setBudgetsAll = useCallback(
    async (newBudgets: Budgets) => {
      setBudgets(newBudgets);

      if (isGuest) {
        localStorage.setItem(GUEST_BUDGETS_KEY, JSON.stringify(newBudgets));
        return;
      }

      if (user) {
        await fetch('/api/budgets', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ budgets: newBudgets }),
        });
      }
    },
    [user, isGuest],
  );

  return (
    <BudgetContext.Provider value={{ budgets, setBudgetForCategory, setBudgetsAll, loading }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudgets() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudgets must be used within BudgetProvider');
  return ctx;
}
