import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const currencies: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<Currency>(currencies[1]); // Default to EUR

  const formatAmount = (amount: number) => {
    return `${currency.symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Load user's saved currency preference after login
  useEffect(() => {
    let cancelled = false;
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
  }, [user?.id]);

  const setCurrencyPersisted = (nextCurrency: Currency) => {
    setCurrency(nextCurrency);
    // Fire-and-forget persistence. UI shouldn't block on network.
    void fetch('/api/user-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ defaultCurrency: nextCurrency.code }),
    }).catch(() => {
      // ignore persistence errors for now
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
