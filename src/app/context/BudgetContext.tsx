import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type Budgets = Record<string, number>;

const GUEST_BUDGETS_KEY = 'expense_manager_guest_budgets';

interface BudgetContextValue {
  budgets: Budgets;
  annualBudgets: Budgets;
  smartIncome: number | null;
  setBudgetForCategory: (category: string, amount: number) => Promise<void>;
  setAnnualBudgetForCategory: (category: string, amount: number) => Promise<void>;
  setBudgetsAll: (newBudgets: Budgets, income?: number) => Promise<void>;
  loading: boolean;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();
  const [budgets, setBudgets] = useState<Budgets>({});
  const [annualBudgets, setAnnualBudgets] = useState<Budgets>({});
  const [smartIncome, setSmartIncome] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBudgets = useCallback(async () => {
    if (isGuest) {
      try {
        const stored = localStorage.getItem(GUEST_BUDGETS_KEY);
        const all: Record<string, any> = stored ? JSON.parse(stored) : {};
        const { __smartIncome, __annualBudgets, ...cats } = all;
        setBudgets(cats as Budgets);
        setSmartIncome(__smartIncome ?? null);
        setAnnualBudgets((__annualBudgets as Budgets) ?? {});
      } catch {
        setBudgets({});
        setSmartIncome(null);
        setAnnualBudgets({});
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
          setAnnualBudgets(data.annualBudgets ?? {});
        }
      } catch {
        // ignore
      }
      setLoading(false);
      return;
    }

    setBudgets({});
    setSmartIncome(null);
    setAnnualBudgets({});
    setLoading(false);
  }, [user, isGuest]);

  useEffect(() => {
    setLoading(true);
    loadBudgets();
  }, [loadBudgets]);

  const persist = useCallback(
    async (nextBudgets: Budgets, nextIncome: number | null, nextAnnual: Budgets) => {
      if (isGuest) {
        const toStore: Record<string, any> = { ...nextBudgets };
        if (nextIncome) toStore.__smartIncome = nextIncome;
        if (Object.keys(nextAnnual).length > 0) toStore.__annualBudgets = nextAnnual;
        localStorage.setItem(GUEST_BUDGETS_KEY, JSON.stringify(toStore));
        return;
      }
      if (user) {
        await fetch('/api/budgets', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            budgets: nextBudgets,
            smartIncome: nextIncome,
            annualBudgets: nextAnnual,
          }),
        });
      }
    },
    [user, isGuest],
  );

  const setBudgetForCategory = useCallback(
    async (category: string, amount: number) => {
      const updated = { ...budgets, [category]: amount };
      setBudgets(updated);
      await persist(updated, smartIncome, annualBudgets);
    },
    [budgets, smartIncome, annualBudgets, persist],
  );

  const setAnnualBudgetForCategory = useCallback(
    async (category: string, amount: number) => {
      const updated = { ...annualBudgets, [category]: amount };
      setAnnualBudgets(updated);
      await persist(budgets, smartIncome, updated);
    },
    [budgets, smartIncome, annualBudgets, persist],
  );

  const setBudgetsAll = useCallback(
    async (newBudgets: Budgets, income?: number) => {
      setBudgets(newBudgets);
      setSmartIncome(income ?? null);
      await persist(newBudgets, income ?? null, annualBudgets);
    },
    [annualBudgets, persist],
  );

  return (
    <BudgetContext.Provider value={{
      budgets, annualBudgets, smartIncome,
      setBudgetForCategory, setAnnualBudgetForCategory, setBudgetsAll,
      loading,
    }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudgets() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudgets must be used within BudgetProvider');
  return ctx;
}
