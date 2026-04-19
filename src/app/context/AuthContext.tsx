import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  isGuest: boolean;
  loading: boolean;
  signInWithGoogle: () => void;
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
  signUpWithEmail: (name: string, email: string, birthday: string, password: string) => Promise<string | null>;
  signOut: () => void;
  enterGuestMode: () => void;
};

// Shared localStorage keys — must match what TransactionContext and CurrencyContext use
const GUEST_MODE_KEY = 'expense_manager_guest_mode';
const GUEST_TRANSACTIONS_KEY = 'expense_manager_guest_transactions';
const GUEST_CURRENCY_KEY = 'expense_manager_guest_currency';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) {
          if (!cancelled) {
            // No authenticated session — restore guest flag if set
            setIsGuest(localStorage.getItem(GUEST_MODE_KEY) === 'true');
            setUser(null);
          }
          return;
        }
        const json = (await res.json()) as { user: AuthUser };
        if (!cancelled) {
          // Authenticated session found — clear guest flag.
          // Guest transactions are NOT cleared here; TransactionContext will
          // detect them and migrate them to the cloud.
          setUser(json.user ?? null);
          setIsGuest(false);
          localStorage.removeItem(GUEST_MODE_KEY);
        }
      } catch {
        if (!cancelled) {
          setIsGuest(localStorage.getItem(GUEST_MODE_KEY) === 'true');
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isGuest,
      loading,
      enterGuestMode: () => {
        localStorage.setItem(GUEST_MODE_KEY, 'true');
        setIsGuest(true);
        navigate('/', { replace: true });
      },
      signInWithGoogle: () => {
        window.location.href = '/api/auth/google';
      },
      signInWithEmail: async (email: string, password: string) => {
        try {
          const res = await fetch('/api/auth/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ action: 'signin', email, password }),
          });
          const json = await res.json();
          if (!res.ok) return json.error ?? 'Sign-in failed.';
          setUser(json.user);
          setIsGuest(false);
          localStorage.removeItem(GUEST_MODE_KEY);
          navigate('/', { replace: true });
          return null;
        } catch (err: any) {
          return err?.message ?? 'Something went wrong. Please try again.';
        }
      },
      signUpWithEmail: async (name: string, email: string, birthday: string, password: string) => {
        try {
          const res = await fetch('/api/auth/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ action: 'signup', name, email, birthday, password }),
          });
          const json = await res.json();
          if (!res.ok) return json.error ?? 'Sign-up failed.';
          setUser(json.user);
          setIsGuest(false);
          localStorage.removeItem(GUEST_MODE_KEY);
          navigate('/', { replace: true });
          return null;
        } catch (err: any) {
          return err?.message ?? 'Something went wrong. Please try again.';
        }
      },
      signOut: () => {
        // Wipe all local data immediately before the server redirect.
        // This ensures a new user at the same device sees a blank slate.
        localStorage.removeItem(GUEST_MODE_KEY);
        localStorage.removeItem(GUEST_TRANSACTIONS_KEY);
        localStorage.removeItem(GUEST_CURRENCY_KEY);
        window.location.href = '/api/auth/logout';
      },
    }),
    [user, isGuest, loading, navigate],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Allows access only to authenticated users (no guests). */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  if (loading) return null;
  if (!user) return null;
  return <>{children}</>;
}

/** Allows access to both authenticated users and guests. */
export function RequireAccess({ children }: { children: React.ReactNode }) {
  const { user, isGuest, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user && !isGuest) navigate('/login', { replace: true });
  }, [loading, user, isGuest, navigate]);

  if (loading) return null;
  if (!user && !isGuest) return null;
  return <>{children}</>;
}
