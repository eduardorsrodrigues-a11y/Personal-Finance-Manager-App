import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type PortfolioSection = 'cash' | 'savings' | 'investment' | 'physical' | 'liability';

export interface PortfolioItem {
  id: string;
  section: PortfolioSection;
  name: string;
  meta: string | null;
  abbr: string;
  color: string;
  type_label: string | null;
  type_class: string | null;
  current_value: number;
  invested_value: number | null;
  sort_order: number;
}

export interface PortfolioSnapshot {
  id: string;
  snapshot_month: string;
  net_worth: number;
  has_item_data: boolean;
}

interface PortfolioContextType {
  items: PortfolioItem[];
  snapshots: PortfolioSnapshot[];
  isLoading: boolean;
  addItem: (item: Omit<PortfolioItem, 'id'>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  saveSnapshot: (params: {
    itemValues: Record<string, number>;
    netWorth: number;
    snapshotMonth: string;
  }) => Promise<void>;
  fetchSnapshotItems: (snapshotId: string) => Promise<Record<string, number>>;
  backfillSnapshotItems: (params: {
    snapshotId: string;
    itemValues: Record<string, number>;
    netWorth: number;
  }) => Promise<void>;
  refresh: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = async () => {
    if (!user?.id) { setItems([]); setSnapshots([]); return; }
    setIsLoading(true);
    try {
      const [itemsRes, snapshotsRes] = await Promise.all([
        fetch('/api/portfolio', { credentials: 'include' }),
        fetch('/api/portfolio/snapshots', { credentials: 'include' }),
      ]);
      if (itemsRes.ok) {
        const json = await itemsRes.json();
        setItems((json.items ?? []) as PortfolioItem[]);
      }
      if (snapshotsRes.ok) {
        const json = await snapshotsRes.json();
        setSnapshots((json.snapshots ?? []) as PortfolioSnapshot[]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const addItem = async (item: Omit<PortfolioItem, 'id'>) => {
    await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        section: item.section,
        name: item.name,
        meta: item.meta,
        abbr: item.abbr,
        color: item.color,
        type_label: item.type_label,
        type_class: item.type_class,
        current_value: item.current_value,
        invested_value: item.invested_value,
        sort_order: item.sort_order,
      }),
    });
    await refresh();
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/portfolio?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await refresh();
  };

  const saveSnapshot = async (params: {
    itemValues: Record<string, number>;
    netWorth: number;
    snapshotMonth: string;
  }) => {
    await fetch('/api/portfolio/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        item_values: params.itemValues,
        net_worth: params.netWorth,
        snapshot_month: params.snapshotMonth,
      }),
    });
    await refresh();
  };

  const fetchSnapshotItems = async (snapshotId: string): Promise<Record<string, number>> => {
    const res = await fetch(
      `/api/portfolio/snapshot-items?snapshot_id=${encodeURIComponent(snapshotId)}`,
      { credentials: 'include' },
    );
    if (!res.ok) return {};
    const json = await res.json();
    return (json.items ?? {}) as Record<string, number>;
  };

  const backfillSnapshotItems = async (params: {
    snapshotId: string;
    itemValues: Record<string, number>;
    netWorth: number;
  }) => {
    await fetch('/api/portfolio/snapshot-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        snapshot_id: params.snapshotId,
        net_worth: params.netWorth,
        item_values: params.itemValues,
      }),
    });
    await refresh();
  };

  return (
    <PortfolioContext.Provider value={{ items, snapshots, isLoading, addItem, deleteItem, saveSnapshot, fetchSnapshotItems, backfillSnapshotItems, refresh }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}
