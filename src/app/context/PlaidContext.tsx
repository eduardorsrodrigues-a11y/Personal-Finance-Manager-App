import { type ReactNode, createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

export type PlaidConnection = {
  id: string;
  institution: string | null;
  status: string;
  last_synced_at: string | null;
};

export type PendingTransaction = {
  id: string;
  plaid_txn_id: string;
  date: string;
  description: string;
  raw_amount: number;
  currency: string;
  plaid_category: string | null;
  possible_duplicate: boolean;
  institution: string | null;
  connection_id: string;
};

type PlaidContextValue = {
  connections: PlaidConnection[];
  pendingItems: PendingTransaction[];
  pendingCount: number;
  isSyncing: boolean;
  isLoading: boolean;
  connectBank: () => void;
  sync: (connectionId: string) => Promise<void>;
  syncAll: () => Promise<void>;
  reviewTransaction: (params: {
    id: string;
    plaidTxnId: string;
    status: 'accepted' | 'rejected';
    amount?: number;
    category?: string;
    date?: string;
    description?: string;
  }) => Promise<number>;
  disconnect: (connectionId: string) => Promise<void>;
  disableConnection: (connectionId: string, disabled: boolean) => Promise<void>;
  openReview: boolean;
  setOpenReview: (v: boolean) => void;
  linkToken: string | null;
  onLinkSuccess: (publicToken: string) => Promise<void>;
};

const PlaidContext = createContext<PlaidContextValue | null>(null);

const AUTO_SYNC_HOURS = 24;

export function PlaidProvider({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();
  const [connections, setConnections] = useState<PlaidConnection[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingTransaction[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openReview, setOpenReview] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const autoSyncDone = useRef(false);

  const fetchConnections = useCallback(async () => {
    const res = await fetch('/api/plaid?action=connections');
    if (!res.ok) return;
    const data = await res.json();
    setConnections(data.connections ?? []);
    return data.connections as PlaidConnection[];
  }, []);

  const fetchPending = useCallback(async () => {
    const res = await fetch('/api/plaid?action=pending');
    if (!res.ok) return;
    const data = await res.json();
    setPendingItems(data.items ?? []);
    setPendingCount(data.count ?? 0);
  }, []);

  // Load on mount when authenticated
  useEffect(() => {
    if (!user || isGuest) return;
    setIsLoading(true);
    Promise.all([fetchConnections(), fetchPending()]).finally(() => setIsLoading(false));
  }, [user, isGuest, fetchConnections, fetchPending]);

  // Auto-sync if last sync was >24h ago
  useEffect(() => {
    if (!user || isGuest || autoSyncDone.current || connections.length === 0) return;
    autoSyncDone.current = true;

    for (const conn of connections) {
      if (conn.status !== 'active') continue;
      const lastSync = conn.last_synced_at ? new Date(conn.last_synced_at).getTime() : 0;
      const hoursSince = (Date.now() - lastSync) / 36e5;
      if (hoursSince >= AUTO_SYNC_HOURS) {
        sync(conn.id);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections, user, isGuest]);

  const sync = useCallback(async (connectionId: string) => {
    setIsSyncing(true);
    try {
      await fetch('/api/plaid?action=sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId }),
      });
      await Promise.all([fetchConnections(), fetchPending()]);
    } finally {
      setIsSyncing(false);
    }
  }, [fetchConnections, fetchPending]);

  const syncAll = useCallback(async () => {
    const active = connections.filter(c => c.status === 'active');
    if (active.length === 0) return;
    setIsSyncing(true);
    try {
      await Promise.all(
        active.map(c =>
          fetch('/api/plaid?action=sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connection_id: c.id }),
          })
        )
      );
      await Promise.all([fetchConnections(), fetchPending()]);
    } finally {
      setIsSyncing(false);
    }
  }, [connections, fetchConnections, fetchPending]);

  const disableConnection = useCallback(async (connectionId: string, disabled: boolean) => {
    await fetch('/api/plaid?action=disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection_id: connectionId, disabled }),
    });
    await fetchConnections();
  }, [fetchConnections]);

  const connectBank = useCallback(async () => {
    const res = await fetch('/api/plaid?action=create-link-token', { method: 'POST' });
    if (!res.ok) return;
    const data = await res.json();
    setLinkToken(data.link_token);
  }, []);

  const onLinkSuccess = useCallback(async (publicToken: string) => {
    setLinkToken(null);
    const res = await fetch('/api/plaid?action=exchange-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_token: publicToken }),
    });
    if (!res.ok) return;
    await fetchConnections();
    // Pending will be populated by the background sync triggered server-side
    setTimeout(fetchPending, 4000);
  }, [fetchConnections, fetchPending]);

  const reviewTransaction = useCallback(async (params: {
    id: string;
    plaidTxnId: string;
    status: 'accepted' | 'rejected';
    amount?: number;
    category?: string;
    date?: string;
    description?: string;
  }) => {
    const res = await fetch('/api/plaid?action=review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: params.id,
        status: params.status,
        amount: params.amount,
        category: params.category,
        date: params.date,
        description: params.description,
        plaid_txn_id: params.plaidTxnId,
      }),
    });
    const data = await res.json();
    const remaining = data.remaining ?? 0;
    setPendingCount(remaining);
    setPendingItems(prev => prev.filter(p => p.id !== params.id));
    return remaining as number;
  }, []);

  const disconnect = useCallback(async (connectionId: string) => {
    await fetch('/api/plaid?action=disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection_id: connectionId }),
    });
    await fetchConnections();
  }, [fetchConnections]);

  return (
    <PlaidContext.Provider value={{
      connections,
      pendingItems,
      pendingCount,
      isSyncing,
      isLoading,
      connectBank,
      sync,
      syncAll,
      reviewTransaction,
      disconnect,
      disableConnection,
      openReview,
      setOpenReview,
      linkToken,
      onLinkSuccess,
    }}>
      {children}
    </PlaidContext.Provider>
  );
}

export function usePlaid() {
  const ctx = useContext(PlaidContext);
  if (!ctx) throw new Error('usePlaid must be used inside PlaidProvider');
  return ctx;
}
