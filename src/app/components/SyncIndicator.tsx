import { WifiOff, RefreshCw } from 'lucide-react';
import { usePWA } from '../context/PWAContext';
import { useTransactions } from '../context/TransactionContext';

export function SyncIndicator() {
  const { isOnline } = usePWA();
  const { hasPendingSync } = useTransactions();

  if (isOnline && !hasPendingSync) return null;

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
        <WifiOff className="w-3.5 h-3.5" />
        <span>Offline</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium">
      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      <span>Syncing…</span>
    </div>
  );
}
