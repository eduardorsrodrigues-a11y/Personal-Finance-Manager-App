import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useSharedExpenses } from '../../context/SharedExpensesContext';
import { useToast } from '../../context/ToastContext';
import { track } from '../../utils/analytics';
import { ModalShell, Spinner, inputClass, labelClass } from './ModalShell';

interface Props {
  onClose: () => void;
  onCreated: (groupId: string) => void;
}

type Row = { key: number; name: string; email: string };

let nextKey = 1;
const emptyRow = (): Row => ({ key: nextKey++, name: '', email: '' });

export function CreateGroupModal({ onClose, onCreated }: Props) {
  const { createGroup } = useSharedExpenses();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateRow = (key: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const handleCreate = async () => {
    setError(null);
    if (!name.trim()) return setError('Give the group a name.');
    const members = rows
      .filter((r) => r.name.trim() || r.email.trim())
      .map((r) => ({ name: r.name.trim() || r.email.trim().split('@')[0], email: r.email.trim() }));

    setSaving(true);
    const result = await createGroup(name.trim(), members);
    setSaving(false);
    if (result.error || !result.groupId) return setError(result.error ?? 'Could not create the group.');
    track.sharedGroupCreated({ members: members.length + 1 });
    showToast('Group created');
    onCreated(result.groupId);
  };

  return (
    <ModalShell
      title="New group"
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {saving && <Spinner />} Create group
        </button>
      }
    >
      <div className="space-y-5">
        <div>
          <label className={labelClass} htmlFor="group-name">Group name</label>
          <input
            id="group-name"
            type="text"
            value={name}
            maxLength={80}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lisbon trip, Flat 3B"
            className={inputClass}
          />
        </div>

        <div>
          <p className={labelClass}>People (you're added automatically)</p>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={r.key} className="flex items-center gap-2">
                <input
                  type="text"
                  value={r.name}
                  maxLength={60}
                  aria-label={`Person ${i + 1} name`}
                  onChange={(e) => updateRow(r.key, { name: e.target.value })}
                  placeholder="Name"
                  className={`${inputClass} flex-1 min-w-0`}
                />
                <input
                  type="email"
                  value={r.email}
                  aria-label={`Person ${i + 1} email`}
                  onChange={(e) => updateRow(r.key, { email: e.target.value })}
                  placeholder="Email (optional)"
                  className={`${inputClass} flex-[1.4] min-w-0`}
                />
                <button
                  type="button"
                  onClick={() => setRows((prev) => (prev.length > 1 ? prev.filter((x) => x.key !== r.key) : [emptyRow()]))}
                  aria-label={`Remove person ${i + 1}`}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRows((prev) => [...prev, emptyRow()])}
            className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add another person
          </button>
          <p className="text-xs text-muted-foreground mt-3">
            Add an email to let that person see the group. When they sign in to MyMoneyMate with that email,
            their shares show up in their own transactions.
          </p>
        </div>

        {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
      </div>
    </ModalShell>
  );
}
