import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type Budgets = Record<string, number>;

const GUEST_BUDGETS_KEY = 'expense_manager_guest_budgets';

interface BudgetContextValue {
  budgets: Budgets;
  smartIncome: number | null;
  setBudgetForCategory: (category: string, amount: number) => Promise<void>;
  setBudgetsAll: (newBudgets: Budgets, income?: number) => Promise<void>;
  loading: boolean;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();
  const [budgets, setBudgets] = useState<Budgets>({});
  const [smartIncome, setSmartIncome] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBudgets = useCallback(async () => {
    if (isGuest) {
      try {
        const stored = localStorage.getItem(GUEST_BUDGETS_KEY);
        const all: Record<string, number> = stored ? JSON.parse(stored) : {};
        const { __smartIncome, ...cats } = all as any;
        setBudgets(cats);
        setSmartIncome(__smartIncome ?? null);
      } catch {
        setBudgets({});
        setSmartIncome(null);
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
          setSmartIncome(data.smartIncome ?? null);
        }
      } catch {
        // ignore
      }
      setLoading(false);
      return;
    }

    setBudgets({});
    setSmartIncome(null);
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
        const toStore = smartIncome ? { ...updated, __smartIncome: smartIncome } : updated;
        localStorage.setItem(GUEST_BUDGETS_KEY, JSON.stringify(toStore));
        return;
      }

      if (user) {
        await fetch('/api/budgets', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ budgets: updated, smartIncome }),
        });
      }
    },
    [budgets, smartIncome, user, isGuest],
  );

  const setBudgetsAll = useCallback(
    async (newBudgets: Budgets, income?: number) => {
      setBudgets(newBudgets);
      setSmartIncome(income ?? null);

      if (isGuest) {
        const toStore = income ? { ...newBudgets, __smartIncome: income } : newBudgets;
        localStorage.setItem(GUEST_BUDGETS_KEY, JSON.stringify(toStore));
        return;
      }

      if (user) {
        await fetch('/api/budgets', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ budgets: newBudgets, smartIncome: income ?? null }),
        });
      }
    },
    [user, isGuest],
  );

  return (
    <BudgetContext.Provider value={{ budgets, smartIncome, setBudgetForCategory, setBudgetsAll, loading }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudgets() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudgets must be used within BudgetProvider');
  return ctx;
}
