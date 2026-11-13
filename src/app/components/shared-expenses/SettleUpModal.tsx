import { useState } from 'react';
import { Trash2, ArrowRight } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';
import { useSharedExpenses, type SharedExpense, type SharedGroupDetail } from '../../context/SharedExpensesContext';
import { track } from '../../utils/analytics';
import { ModalShell, Spinner, inputClass, labelClass, parseMoney, todayIso } from './ModalShell';

interface Props {
  group: SharedGroupDetail;
  /** Pre-fill from a suggested payment. */
  initial?: { from: string; to: string; amount: number } | null;
  /** Edit an existing settlement. */
  settlement?: SharedExpense | null;
  onClose: () => void;
  onSaved: () => void;
}

export function SettleUpModal({ group, initial, settlement, onClose, onSaved }: Props) {
  const { currency } = useCurrency();
  const { showToast } = useToast();
  const { createExpense, updateExpense, deleteExpense } = useSharedExpenses();

  const others = group.members.filter((m) => m.id !== group.myMemberId);
  const [from, setFrom] = useState(settlement?.paidBy ?? initial?.from ?? group.myMemberId);
  const [to, setTo] = useState(settlement?.splits[0]?.memberId ?? initial?.to ?? others[0]?.id ?? '');
  const [amount, setAmount] = useState(
    settlement ? String(settlement.amount) : initial ? initial.amount.toFixed(2) : '',
  );
  const [date, setDate] = useState(settlement?.date ?? todayIso());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const label = (id: string) => {
    const m = group.members.find((x) => x.id === id);
    return m ? (m.isMe ? `${m.name} (you)` : m.name) : '';
  };

  const handleSave = async () => {
    setError(null);
    const value = parseMoney(amount);
    if (!Number.isFinite(value) || value <= 0) return setError('Enter a valid amount.');
    if (!from || !to || from === to) return setError('Choose two different people.');
    const input = {
      kind: 'settlement' as const,
      description: 'Settlement',
      amount: value,
      category: 'Other',
      date,
      paidBy: from,
      splits: [{ memberId: to, amount: value }],
    };
    setSaving(true);
    const err = settlement ? await updateExpense(settlement.id, input) : await createExpense(group.id, input);
    setSaving(false);
    if (err) return setError(err);
    if (!settlement) track.sharedSettlementRecorded({ amount: value });
    showToast(settlement ? 'Payment updated' : 'Payment recorded');
    onSaved();
  };

  const handleDelete = async () => {
    if (!settlement) return;
    setSaving(true);
    const err = await deleteExpense(settlement.id);
    setSaving(false);
    if (err) return setError(err);
    showToast('Payment deleted');
    onSaved();
  };

  return (
    <ModalShell
      title={settlement ? 'Edit payment' : 'Record a payment'}
      onClose={onClose}
      headerActions={settlement && (
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Delete payment"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      footer={
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {saving && <Spinner />} {settlement ? 'Save payment' : 'Record payment'}
        </button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 min-w-0">
            <label className={labelClass} htmlFor="settle-from">From</label>
            <select id="settle-from" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass}>
              {group.members.map((m) => <option key={m.id} value={m.id}>{label(m.id)}</option>)}
            </select>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground mb-3 shrink-0" />
          <div className="flex-1 min-w-0">
            <label className={labelClass} htmlFor="settle-to">To</label>
            <select id="settle-to" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass}>
              {group.members.map((m) => <option key={m.id} value={m.id}>{label(m.id)}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="settle-amount">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">{currency.symbol}</span>
            <input
              id="settle-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => { if (/^[0-9.,]*$/.test(e.target.value)) setAmount(e.target.value); }}
              placeholder="0.00"
              className={`${inputClass} pl-9 text-lg`}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="settle-date">Date</label>
          <input
            id="settle-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            style={{ WebkitAppearance: 'none', maxWidth: '100%' }}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Payments only update group balances. They aren't added to anyone's transactions.
        </p>
        {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
      </div>
    </ModalShell>
  );
}
