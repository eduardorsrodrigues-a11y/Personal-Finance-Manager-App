import { useTransactions } from '../context/TransactionContext';
import { useLanguage } from '../context/LanguageContext';

export function DataLoader() {
  const { isLoading } = useTransactions();
  const { t } = useLanguage();

  return (
    <div
      className={`fixed top-16 lg:top-4 left-1/2 -translate-x-1/2 z-[90] transition-all duration-300 pointer-events-none ${
        isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-lg shadow-black/10">
        <svg className="animate-spin w-3.5 h-3.5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{t('loading.fetching')}</span>
      </div>
    </div>
  );
}
