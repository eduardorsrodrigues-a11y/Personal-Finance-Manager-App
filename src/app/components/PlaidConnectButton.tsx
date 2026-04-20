import { useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Building2, Loader2, RefreshCw, Unlink } from 'lucide-react';
import { usePlaid } from '../context/PlaidContext';

export function PlaidConnectButton() {
  const { connections, isSyncing, isLoading, linkToken, connectBank, onLinkSuccess, sync, disconnect } = usePlaid();

  const { open, ready } = usePlaidLink({
    token: linkToken ?? '',
    onSuccess: (public_token) => { onLinkSuccess(public_token); },
    onExit: () => {},
  });

  // Open Plaid Link as soon as the token is ready
  useEffect(() => {
    if (linkToken && ready) open();
  }, [linkToken, ready, open]);

  const activeConnections = connections.filter(c => c.status === 'active');
  const errorConnections = connections.filter(c => c.status === 'error');

  if (isLoading) return null;

  // Connections exist
  if (activeConnections.length > 0) {
    return (
      <div className="flex items-center gap-2">
        {errorConnections.map(conn => (
          <button
            key={conn.id}
            onClick={connectBank}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-medium hover:bg-amber-200 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            Re-connect {conn.institution ?? 'bank'}
          </button>
        ))}
        {activeConnections.map(conn => (
          <div key={conn.id} className="flex items-center gap-1">
            <button
              onClick={() => sync(conn.id)}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
              title={`Sync ${conn.institution ?? 'bank'}`}
            >
              {isSyncing
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{conn.institution ?? 'Bank'}</span>
            </button>
            <button
              onClick={() => disconnect(conn.id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
              title="Disconnect bank"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  // No connections yet
  return (
    <button
      onClick={connectBank}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground text-xs font-medium hover:bg-muted transition-colors"
    >
      <Building2 className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Connect bank</span>
    </button>
  );
}
