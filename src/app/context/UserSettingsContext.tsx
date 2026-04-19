import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

export type RiskProfileSetting = 'safe' | 'balanced' | 'growth' | '';

export interface UserSettings {
  name: string;
  birthday: string; // YYYY-MM-DD or ''
  riskProfile: RiskProfileSetting;
}

interface UserSettingsContextType {
  settings: UserSettings;
  loading: boolean;
  saveSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

const STORAGE_KEY = 'mmm_user_settings';

const DEFAULT_SETTINGS: UserSettings = { name: '', birthday: '', riskProfile: '' };

function loadLocal(): Partial<UserSettings> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
}

function saveLocal(s: UserSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, isGuest, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({ ...DEFAULT_SETTINGS, ...loadLocal() });
  const [loading, setLoading] = useState(true);

  // Fetch from server for authenticated users
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    (async () => {
      try {
        const [meRes, prefRes] = await Promise.all([
          fetch('/api/me', { credentials: 'include' }),
          fetch('/api/user-settings', { credentials: 'include' }),
        ]);
        const meJson = meRes.ok ? await meRes.json() : null;
        const prefJson = prefRes.ok ? await prefRes.json() : null;

        const merged: UserSettings = {
          name: meJson?.user?.name ?? '',
          birthday: meJson?.user?.birthday ?? '',
          riskProfile: (prefJson?.riskProfile as RiskProfileSetting) ?? '',
        };
        setSettings(merged);
        saveLocal(merged);
      } catch {
        // fall back to local
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && !user) setLoading(false);
  }, [authLoading, user]);

  const saveSettings = useMemo(() => async (updates: Partial<UserSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    saveLocal(next);

    if (user) {
      // Sync to server
      const profileUpdates: Record<string, string> = {};
      if (updates.name !== undefined) profileUpdates.name = updates.name;
      if (updates.birthday !== undefined) profileUpdates.birthday = updates.birthday;
      if (Object.keys(profileUpdates).length > 0) {
        await fetch('/api/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(profileUpdates),
        }).catch(() => {});
      }
      if (updates.riskProfile !== undefined) {
        await fetch('/api/user-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ riskProfile: updates.riskProfile }),
        }).catch(() => {});
      }
    }
  }, [settings, user]);

  const value = useMemo<UserSettingsContextType>(
    () => ({ settings, loading: loading || authLoading, saveSettings }),
    [settings, loading, authLoading, saveSettings],
  );

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>;
}

export function useUserSettings() {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) throw new Error('useUserSettings must be used within UserSettingsProvider');
  return ctx;
}
