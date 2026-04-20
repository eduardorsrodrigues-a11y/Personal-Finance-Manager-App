import { Building2, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { usePlaid } from '../context/PlaidContext';
import { TransactionReviewModal } from './TransactionReviewModal';

export function BankSyncBanner() {
  const { connections, pendingCount, isSyncing, sync, openReview, setOpenReview } = usePlaid();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || (pendingCount === 0 && !isSyncing)) return null;

  const activeConnections = connections.filter(c => c.status === 'active');

  return (
    <>
      <div className="mx-4 lg:mx-8 mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-500 text-white">
        <Building2 className="w-4 h-4 shrink-0" />

        {isSyncing && pendingCount === 0 ? (
          <div className="flex items-center gap-2 flex-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span className="text-sm font-medium">Syncing with your bank…</span>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-1 gap-3 min-w-0">
            <p className="text-sm font-medium truncate">
              {pendingCount} bank transaction{pendingCount !== 1 ? 's' : ''} ready to review
            </p>
            <div className="flex items-center gap-2 shrink-0">
              {activeConnections.length > 0 && (
                <button
                  onClick={() => sync(activeConnections[0].id)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  title="Sync now"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpenReview(true)}
                className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Review now →
              </button>
              <button onClick={() => setDismissed(true)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {openReview && <TransactionReviewModal onClose={() => setOpenReview(false)} />}
    </>
  );
}
