import { useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Building2, Plus, RefreshCw, Trash2, Loader2, CheckCircle2, AlertCircle, PowerOff } from 'lucide-react';
import { usePlaid } from '../context/PlaidContext';
import { useAuth } from '../context/AuthContext';

function ConnectButton() {
  const { linkToken, connectBank, onLinkSuccess } = usePlaid();

  const { open, ready } = usePlaidLink({
    token: linkToken ?? '',
    onSuccess: (public_token) => { onLinkSuccess(public_token); },
    onExit: () => {},
  });

  useEffect(() => {
    if (linkToken && ready) open();
  }, [linkToken, ready, open]);

  return (
    <button
      onClick={connectBank}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors"
    >
      <Plus className="w-4 h-4" />
      Add bank account
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="w-3.5 h-3.5" /> Connected
      </span>
    );
  }
  if (status === 'disabled') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <PowerOff className="w-3.5 h-3.5" /> Disabled
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-500">
        <AlertCircle className="w-3.5 h-3.5" /> Needs attention
      </span>
    );
  }
  return null;
}

function formatDate(iso: string | null) {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function BankAccounts() {
  const { connections, isSyncing, sync, disableConnection, disconnect } = usePlaid();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sign in to connect bank accounts.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-14 lg:top-0 z-40">
        <div className="px-4 lg:px-8 py-3 lg:py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Bank Accounts</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Connect your bank to automatically import transactions.</p>
          </div>
          <ConnectButton />
        </div>
      </header>

      <div className="px-4 lg:px-8 py-6 max-w-2xl">
        {connections.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No bank accounts connected</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Connect your bank to automatically import and review transactions.
            </p>
            <ConnectButton />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {connections.map(conn => (
              <div key={conn.id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: icon + info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{conn.institution ?? 'Bank account'}</p>
                      <StatusBadge status={conn.status} />
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {conn.status === 'active' && (
                      <button
                        onClick={() => sync(conn.id)}
                        disabled={isSyncing}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
                        title="Sync now"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      </button>
                    )}

                    {/* Disable / Enable toggle */}
                    <button
                      onClick={() => disableConnection(conn.id, conn.status !== 'disabled')}
                      className={`p-2 rounded-lg transition-colors ${
                        conn.status === 'disabled'
                          ? 'text-teal-600 bg-teal-50 hover:bg-teal-100'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                      title={conn.status === 'disabled' ? 'Enable connection' : 'Disable connection'}
                    >
                      <PowerOff className="w-4 h-4" />
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => {
                        if (confirm(`Disconnect ${conn.institution ?? 'this account'}? This cannot be undone.`)) {
                          disconnect(conn.id);
                        }
                      }}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Remove connection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Meta row */}
                <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-x-6 gap-y-1">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Last synced</p>
                    <p className="text-xs text-foreground mt-0.5">{formatDate(conn.last_synced_at)}</p>
                  </div>
                  {conn.created_at && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Connected on</p>
                      <p className="text-xs text-foreground mt-0.5">{formatDate(conn.created_at)}</p>
                    </div>
                  )}
                  {conn.status === 'disabled' && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className="text-xs text-muted-foreground">This account won't sync automatically while disabled.</p>
                    </div>
                  )}
                  {conn.status === 'error' && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <p className="text-xs text-red-500">Re-connect this account to resume syncing.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-6 text-center">
          Bank connections are secured via Plaid. MyMoneyMate never stores your banking credentials.
        </p>
      </div>
    </div>
  );
}
