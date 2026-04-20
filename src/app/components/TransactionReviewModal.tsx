import { useState, useCallback } from 'react';
import { X, Check, AlertTriangle, Building2, Undo2 } from 'lucide-react';
import { usePlaid, type PendingTransaction } from '../context/PlaidContext';
import { useTransactions } from '../context/TransactionContext';

const EXPENSE_CATS = ['Food', 'Groceries', 'Housing', 'Utilities', 'Transportation', 'Shopping', 'Health', 'Entertainment', 'Travel', 'Family & Personal', 'Gifts', 'Gym & Sports', 'Debt Payments', 'Other'];
const INCOME_CATS  = ['Salary', 'Freelance', 'Investment', 'Business', 'RSUs', 'Cashback', 'Holiday Allowance', 'Meal Allowance', 'Other'];

const CATEGORY_MAP: Record<string, string> = {
  FOOD_AND_DRINK: 'Food', GENERAL_MERCHANDISE: 'Shopping', GROCERIES: 'Groceries',
  HOME_IMPROVEMENT: 'Housing', RENT_AND_UTILITIES: 'Utilities', MEDICAL: 'Health',
  PERSONAL_CARE: 'Family & Personal', ENTERTAINMENT: 'Entertainment', TRAVEL: 'Travel',
  TRANSPORTATION: 'Transportation', LOAN_PAYMENTS: 'Debt Payments', GIFTS_AND_DONATIONS: 'Gifts',
  FITNESS: 'Gym & Sports', INCOME: 'Salary',
};

function mapCategory(plaidCat: string | null) {
  if (!plaidCat) return 'Other';
  return CATEGORY_MAP[plaidCat] ?? 'Other';
}

function isIncomeCat(cat: string) {
  return INCOME_CATS.includes(cat);
}

type AmountMode = 'full' | 'half' | 'custom_pct' | 'custom_amt';

type HistoryEntry = { txn: PendingTransaction; status: 'accepted' | 'rejected' };

export function TransactionReviewModal({ onClose }: { onClose: () => void }) {
  const { pendingItems, pendingCount, reviewTransaction } = usePlaid();
  const { loadTransactions } = useTransactions();

  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [amountMode, setAmountMode] = useState<AmountMode>('full');
  const [customValue, setCustomValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState({ added: 0, skipped: 0 });

  const items = pendingItems;
  const total = items.length;
  const current = items[index];

  const suggestedCategory = current ? mapCategory(current.plaid_category) : 'Other';
  const [category, setCategory] = useState(suggestedCategory);

  // Reset category when card changes
  const resetCard = useCallback((txn: PendingTransaction) => {
    setAmountMode('full');
    setCustomValue('');
    setCategory(mapCategory(txn.plaid_category));
  }, []);

  const computeAmount = (): number => {
    if (!current) return 0;
    const base = current.raw_amount;
    if (amountMode === 'full') return base;
    if (amountMode === 'half') return Math.round((base / 2) * 100) / 100;
    const val = parseFloat(customValue.replace(',', '.'));
    if (isNaN(val)) return base;
    if (amountMode === 'custom_pct') return Math.round((base * val / 100) * 100) / 100;
    return val; // custom_amt
  };

  const advance = (nextIndex: number) => {
    if (nextIndex >= items.length) {
      setDone(true);
      loadTransactions();
      return;
    }
    setIndex(nextIndex);
    resetCard(items[nextIndex]);
  };

  const handleDecision = useCallback(async (status: 'accepted' | 'rejected') => {
    if (!current || isSubmitting) return;
    setIsSubmitting(true);
    try {
      setHistory(h => [...h, { txn: current, status }]);
      await reviewTransaction({
        id: current.id,
        plaidTxnId: current.plaid_txn_id,
        status,
        amount: status === 'accepted' ? computeAmount() : undefined,
        category: status === 'accepted' ? category : undefined,
        date: current.date,
        description: current.description,
      });
      setSummary(s => ({
        added: s.added + (status === 'accepted' ? 1 : 0),
        skipped: s.skipped + (status === 'rejected' ? 1 : 0),
      }));
      advance(index + 1);
    } finally {
      setIsSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, isSubmitting, index, category, amountMode, customValue]);

  const handleUndo = async () => {
    if (history.length === 0 || isSubmitting) return;
    // Re-fetch pending to restore — for simplicity, just go back in the index
    // The real undo would require an API call; this is a UI-only back navigation
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setIndex(i => Math.max(0, i - 1));
    setSummary(s => ({
      added: prev.status === 'accepted' ? s.added - 1 : s.added,
      skipped: prev.status === 'rejected' ? s.skipped - 1 : s.skipped,
    }));
    resetCard(prev.txn);
  };

  const allCategories = isIncomeCat(category) ? INCOME_CATS : [...EXPENSE_CATS];

  if (done || total === 0) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8 text-center" onClick={e => e.stopPropagation()}>
          <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-teal-600" />
          </div>
          <h2 className="text-lg font-semibold mb-1">All caught up!</h2>
          {summary.added + summary.skipped > 0 ? (
            <p className="text-sm text-muted-foreground mb-6">
              Added {summary.added} transaction{summary.added !== 1 ? 's' : ''} · Skipped {summary.skipped}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mb-6">No pending transactions.</p>
          )}
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <button onClick={handleUndo} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors" title="Undo">
                <Undo2 className="w-4 h-4" />
              </button>
            )}
            <p className="text-sm font-semibold">Review transactions</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{index + 1} / {total}</span>
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-teal-500 transition-all duration-300"
            style={{ width: `${((index) / total) * 100}%` }}
          />
        </div>

        {/* Card body */}
        <div className="px-5 py-5 flex flex-col gap-4">

          {/* Institution + date */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {current.institution ?? 'Bank'} · {new Date(current.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Description + amount */}
          <div>
            <p className="text-base font-semibold text-foreground">{current.description}</p>
            {current.plaid_category && (
              <p className="text-xs text-muted-foreground mt-0.5">Bank hint: {current.plaid_category.replace(/_/g, ' ').toLowerCase()}</p>
            )}
            <p className="text-2xl font-bold text-red-500 mt-2">
              -{current.currency === 'EUR' ? '€' : current.currency} {current.raw_amount.toFixed(2)}
            </p>
          </div>

          {/* Possible duplicate warning */}
          {current.possible_duplicate && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700">Possible duplicate — similar transaction exists nearby</p>
            </div>
          )}

          {/* Amount assignment */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Amount to record</p>
            <div className="flex gap-2 flex-wrap">
              {(['full', 'half', 'custom_pct', 'custom_amt'] as AmountMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setAmountMode(mode); setCustomValue(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${amountMode === mode ? 'bg-teal-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                >
                  {mode === 'full' ? 'Full' : mode === 'half' ? '50%' : mode === 'custom_pct' ? 'Custom %' : 'Custom €'}
                </button>
              ))}
            </div>
            {(amountMode === 'custom_pct' || amountMode === 'custom_amt') && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={customValue}
                  onChange={e => { if (/^[0-9.,]*$/.test(e.target.value)) setCustomValue(e.target.value); }}
                  placeholder={amountMode === 'custom_pct' ? 'e.g. 33' : 'e.g. 24.50'}
                  className="flex-1 px-3 py-2 text-sm bg-input-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground">{amountMode === 'custom_pct' ? '%' : '€'}</span>
                {customValue && (
                  <span className="text-xs font-semibold text-teal-600">
                    = €{computeAmount().toFixed(2)}
                  </span>
                )}
              </div>
            )}
            {amountMode === 'half' && (
              <p className="text-xs text-muted-foreground mt-1.5">Recording €{computeAmount().toFixed(2)} (your half)</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-input-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-ring"
            >
              <optgroup label="Expenses">
                {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              <optgroup label="Income">
                {INCOME_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={() => handleDecision('rejected')}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
            Skip
          </button>
          <button
            onClick={() => handleDecision('accepted')}
            disabled={isSubmitting || ((amountMode === 'custom_pct' || amountMode === 'custom_amt') && !customValue)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
