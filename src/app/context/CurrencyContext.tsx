import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const currencies: Currency[] = [
  { code: 'USD', symbol: '$',  name: 'US Dollar' },
  { code: 'EUR', symbol: '€',  name: 'Euro' },
  { code: 'GBP', symbol: '£',  name: 'British Pound' },
];

const GUEST_CURRENCY_KEY = 'expense_manager_guest_currency';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();
  const [currency, setCurrency] = useState<Currency>(currencies[1]); // Default to EUR

  const formatAmount = (amount: number) => {
    return `${currency.symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Load currency preference — localStorage for guests, API for authenticated users
  useEffect(() => {
    let cancelled = false;

    if (isGuest) {
      const saved = localStorage.getItem(GUEST_CURRENCY_KEY);
      if (saved) {
        const found = currencies.find((c) => c.code === saved.toUpperCase());
        if (found) setCurrency(found);
      }
      return;
    }

    async function loadUserCurrency() {
      if (!user?.id) return;
      try {
        const res = await fetch('/api/user-settings', { credentials: 'include' });
        if (!res.ok) return;
        const json = (await res.json()) as { defaultCurrency?: string };
        const code = (json.defaultCurrency ?? '').toUpperCase();
        const found = currencies.find((c) => c.code === code);
        if (!cancelled && found) setCurrency(found);
      } catch {
        // keep EUR default
      }
    }
    void loadUserCurrency();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isGuest]);

  const setCurrencyPersisted = (nextCurrency: Currency) => {
    setCurrency(nextCurrency);

    if (isGuest) {
      localStorage.setItem(GUEST_CURRENCY_KEY, nextCurrency.code);
      return;
    }

    // Fire-and-forget persistence for authenticated users
    void fetch('/api/user-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ defaultCurrency: nextCurrency.code }),
    }).catch(() => {
      // ignore persistence errors
    });
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: setCurrencyPersisted, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
