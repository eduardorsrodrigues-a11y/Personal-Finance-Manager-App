import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  useSharedExpenses,
  type SharedExpense,
  type SharedGroupDetail,
} from '../../context/SharedExpensesContext';
import { equalSplit, toCents, fromCents } from '../../../../api/_lib/sharedExpenseMath';
import { track } from '../../utils/analytics';
import { ModalShell, Spinner, inputClass, labelClass, parseMoney, todayIso } from './ModalShell';

const EXPENSE_CATEGORIES = [
  'Food', 'Groceries', 'Housing', 'Utilities', 'Transportation', 'Shopping', 'Health',
  'Entertainment', 'Travel', 'Family & Personal', 'Gifts', 'Gym & Sports', 'Debt Payments', 'Other',
];

type SplitMode = 'equal' | 'custom';

interface Props {
  group: SharedGroupDetail;
  expense?: SharedExpense | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Detects whether an existing expense was split equally between its participants. */
function inferMode(expense: SharedExpense): SplitMode {
  const ids = expense.splits.map((s) => s.memberId);
  const equal = equalSplit(expense.amount, ids);
  return expense.splits.every((s) => toCents(equal[s.memberId]) === toCents(s.amount)) ? 'equal' : 'custom';
}

export function SharedExpenseModal({ group, expense, onClose, onSaved }: Props) {
  const isEdit = Boolean(expense);
  const { currency, formatAmount } = useCurrency();
  const { tCategory } = useLanguage();
  const { showToast } = useToast();
  const { createExpense, updateExpense, deleteExpense } = useSharedExpenses();

  const [description, setDescription] = useState(expense?.description ?? '');
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [category, setCategory] = useState(expense?.category ?? '');
  const [date, setDate] = useState(expense?.date ?? todayIso());
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? group.myMemberId);
  const [mode, setMode] = useState<SplitMode>(expense ? inferMode(expense) : 'equal');
  const [included, setIncluded] = useState<Set<string>>(
    () => new Set(expense ? expense.splits.filter((s) => s.amount > 0 || mode === 'equal').map((s) => s.memberId) : group.members.map((m) => m.id)),
  );
  const [custom, setCustom] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const s of expense?.splits ?? []) init[s.memberId] = String(s.amount);
    return init;
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const total = parseMoney(amount);
  const totalValid = Number.isFinite(total) && total > 0;

  // Order participants as they appear in the member list for stable rounding.
  const includedIds = group.members.filter((m) => included.has(m.id)).map((m) => m.id);
  const equalShares = useMemo(
    () => (totalValid ? equalSplit(total, includedIds) : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [total, totalValid, includedIds.join(',')],
  );

  const customCents = group.members.reduce((sum, m) => {
    const v = parseMoney(custom[m.id] ?? '');
    return sum + (Number.isFinite(v) ? toCents(v) : 0);
  }, 0);
  const remainingCents = totalValid ? toCents(total) - customCents : 0;

  const myShare = mode === 'equal'
    ? (equalShares[group.myMemberId] ?? 0)
    : (Number.isFinite(parseMoney(custom[group.myMemberId] ?? '')) ? parseMoney(custom[group.myMemberId] ?? '') : 0);

  const toggleMember = (id: string) => {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /** Switching to custom pre-fills the inputs with the current equal split. */
  const switchMode = (next: SplitMode) => {
    if (next === mode) return;
    if (next === 'custom') {
      const filled: Record<string, string> = {};
      for (const m of group.members) {
        const share = equalShares[m.id];
        filled[m.id] = share ? share.toFixed(2) : '';
      }
      setCustom(filled);
    } else {
      setIncluded(new Set(group.members.filter((m) => toCents(parseMoney(custom[m.id] ?? '0') || 0) > 0).map((m) => m.id)));
    }
    setMode(next);
  };

  const handleSave = async () => {
    setError(null);
    if (!description.trim()) return setError('Add a description.');
    if (!totalValid) return setError('Enter a valid amount.');
    if (!category) return setError('Pick a category.');

    let splits: Array<{ memberId: string; amount: number }>;
    if (mode === 'equal') {
      if (includedIds.length === 0) return setError('Select at least one person to split with.');
      splits = includedIds.map((id) => ({ memberId: id, amount: equalShares[id] }));
    } else {
      if (remainingCents !== 0) {
        return setError(remainingCents > 0
          ? `${formatAmount(fromCents(remainingCents))} still needs to be assigned.`
          : `Shares exceed the total by ${formatAmount(fromCents(-remainingCents))}.`);
      }
      splits = group.members
        .map((m) => ({ memberId: m.id, amount: fromCents(toCents(parseMoney(custom[m.id] ?? '') || 0)) }))
        .filter((s) => s.amount > 0);
      if (splits.length === 0) return setError('Assign the amount to at least one person.');
    }

    const input = { kind: 'expense' as const, description: description.trim(), amount: total, category, date, paidBy, splits };
    setSaving(true);
    const err = isEdit && expense ? await updateExpense(expense.id, input) : await createExpense(group.id, input);
    setSaving(false);
    if (err) return setError(err);

    if (isEdit) track.sharedExpenseEdited({ category, amount: total, splitMode: mode });
    else track.sharedExpenseAdded({ category, amount: total, splitMode: mode, participants: splits.length });
    showToast(isEdit ? 'Shared expense updated' : 'Shared expense added');
    onSaved();
  };

  const handleDelete = async () => {
    if (!expense) return;
    setSaving(true);
    const err = await deleteExpense(expense.id);
    setSaving(false);
    if (err) { setConfirmDelete(false); return setError(err); }
    track.sharedExpenseDeleted({ category: expense.category });
    showToast('Shared expense deleted');
    onSaved();
  };

  return (
    <ModalShell
      title={isEdit ? 'Edit shared expense' : 'Add shared expense'}
      onClose={onClose}
      headerActions={isEdit && (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          aria-label="Delete expense"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      footer={confirmDelete ? (
        <>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {saving && <Spinner />} Delete for everyone
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {saving && <Spinner />} {isEdit ? 'Save changes' : 'Add expense'}
        </button>
      )}
    >
      {confirmDelete ? (
        <p className="text-sm text-muted-foreground">
          Delete <span className="font-medium text-foreground">{expense?.description}</span>? It will be removed
          from the group and from every member's transaction list.
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="se-amount">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">{currency.symbol}</span>
              <input
                id="se-amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => { if (/^[0-9.,]*$/.test(e.target.value)) setAmount(e.target.value); }}
                placeholder="0.00"
                autoFocus={!isEdit}
                className={`${inputClass} pl-9 text-lg`}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="se-desc">Description</label>
            <input
              id="se-desc"
              type="text"
              value={description}
              maxLength={200}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner, Airbnb, Groceries"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="se-cat">Category</label>
              <select id="se-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                <option value="">Select…</option>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{tCategory(c)}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="se-date">Date</label>
              <input
                id="se-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
                style={{ WebkitAppearance: 'none', maxWidth: '100%' }}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="se-paidby">Paid by</label>
            <select id="se-paidby" value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className={inputClass}>
              {group.members.map((m) => <option key={m.id} value={m.id}>{m.isMe ? `${m.name} (you)` : m.name}</option>)}
            </select>
          </div>

          {/* Split */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={labelClass + ' mb-0'}>Split</span>
              <div className="flex gap-1 p-1 bg-muted rounded-xl">
                {(['equal', 'custom'] as SplitMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      mode === m ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {m === 'equal' ? 'Equally' : 'Custom amounts'}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-border rounded-xl divide-y divide-border">
              {group.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                  {mode === 'equal' ? (
                    <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={included.has(m.id)}
                        onChange={() => toggleMember(m.id)}
                        className="w-4 h-4 accent-teal-500 shrink-0"
                      />
                      <span className="text-sm truncate">{m.isMe ? `${m.name} (you)` : m.name}</span>
                    </label>
                  ) : (
                    <span className="text-sm truncate flex-1 min-w-0">{m.isMe ? `${m.name} (you)` : m.name}</span>
                  )}
                  {mode === 'equal' ? (
                    <span className={`text-sm font-medium tabular-nums ${included.has(m.id) ? '' : 'text-muted-foreground'}`}>
                      {formatAmount(equalShares[m.id] ?? 0)}
                    </span>
                  ) : (
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currency.symbol}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label={`${m.name}'s share`}
                        value={custom[m.id] ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^[0-9.,]*$/.test(v)) setCustom((prev) => ({ ...prev, [m.id]: v }));
                        }}
                        placeholder="0.00"
                        className="w-full pl-6 pr-2 py-1.5 text-sm text-right tabular-nums bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {mode === 'custom' && totalValid && (
              <p className={`text-xs mt-2 ${remainingCents === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {remainingCents === 0
                  ? 'All assigned ✓'
                  : remainingCents > 0
                    ? `${formatAmount(fromCents(remainingCents))} left to assign`
                    : `${formatAmount(fromCents(-remainingCents))} over the total`}
              </p>
            )}
            {totalValid && myShare > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Your share of <span className="font-medium text-foreground">{formatAmount(myShare)}</span> will be added to your transactions.
              </p>
            )}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-4" role="alert">{error}</p>}
    </ModalShell>
  );
}
