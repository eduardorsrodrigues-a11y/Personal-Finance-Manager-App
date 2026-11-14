import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, ArrowRight, ArrowRightLeft, ChevronRight, LogIn, Pencil, Plus, Trash2, TrendingDown, TrendingUp, UserPlus, Users, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import {
  useSharedExpenses,
  type SharedExpense,
  type SharedGroupDetail,
} from '../context/SharedExpensesContext';
import { getCategoryConfig } from '../utils/categoryConfig';
import { computeBalances, simplifyDebts, type Debt } from '../../../api/_lib/sharedExpenseMath';
import { SharedExpenseModal } from '../components/shared-expenses/SharedExpenseModal';
import { CreateGroupModal } from '../components/shared-expenses/CreateGroupModal';
import { SettleUpModal } from '../components/shared-expenses/SettleUpModal';
import { ModalShell, Spinner, inputClass } from '../components/shared-expenses/ModalShell';

const EPS = 0.005;

function balanceText(balance: number, formatAmount: (n: number) => string) {
  if (balance > EPS) return { text: `you are owed ${formatAmount(balance)}`, className: 'text-emerald-600' };
  if (balance < -EPS) return { text: `you owe ${formatAmount(-balance)}`, className: 'text-red-500' };
  return { text: 'settled up', className: 'text-muted-foreground' };
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function SharedExpenses() {
  const { groupId } = useParams();
  const { user, isGuest, signInWithGoogle } = useAuth();

  if (isGuest || !user) {
    return (
      <div className="px-4 lg:px-8 py-6 lg:py-8">
        <h1 className="text-2xl font-medium mb-6">Shared Expenses</h1>
        <div className="bg-card border border-border rounded-xl p-10 text-center max-w-lg">
          <div className="w-14 h-14 rounded-full bg-teal-50 dark:bg-teal-900/20 mx-auto mb-4 flex items-center justify-center">
            <Users className="w-7 h-7 text-teal-500" />
          </div>
          <h3 className="font-semibold mb-2">Sign in to share expenses</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Shared groups are synced between people, so they need an account.
          </p>
          <button
            onClick={signInWithGoogle}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors"
          >
            <LogIn className="w-4 h-4" /> Sign in
          </button>
        </div>
      </div>
    );
  }

  return groupId ? <GroupDetail groupId={groupId} /> : <GroupList />;
}

// ── Group list ────────────────────────────────────────────────────────────────

function GroupList() {
  const { groups, isLoading, refreshGroups } = useSharedExpenses();
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  useEffect(() => { void refreshGroups(); }, [refreshGroups]);

  const owedToMe = groups.reduce((s, g) => s + Math.max(0, g.myBalance), 0);
  const iOwe = groups.reduce((s, g) => s + Math.max(0, -g.myBalance), 0);

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-medium">Shared Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Split costs with friends, family and flatmates.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New group</span>
        </button>
      </div>

      {groups.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-6 lg:max-w-xl">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-muted-foreground">You are owed</p>
            </div>
            <p className="text-xl font-semibold text-emerald-600 truncate">{formatAmount(owedToMe)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-xs text-muted-foreground">You owe</p>
            </div>
            <p className="text-xl font-semibold text-red-500 truncate">{formatAmount(iOwe)}</p>
          </div>
        </div>
      )}

      {groups.length > 0 ? (
        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
          {groups.map((g) => {
            const b = balanceText(g.myBalance, formatAmount);
            return (
              <button
                key={g.id}
                onClick={() => navigate(`/shared-expenses/${g.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-teal-50 dark:bg-teal-900/20">
                  <Users className="w-4 h-4 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{g.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.memberCount} {g.memberCount === 1 ? 'person' : 'people'}
                  </p>
                </div>
                <span className={`text-xs font-semibold text-right ${b.className}`}>{b.text}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            {isLoading ? <Spinner /> : <Users className="w-8 h-8 text-muted-foreground" />}
          </div>
          {!isLoading && (
            <>
              <h3 className="font-semibold mb-2">No groups yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a group for a trip, your home or anything you split with others.
              </p>
              <button
                onClick={() => setCreating(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" /> Create your first group
              </button>
            </>
          )}
        </div>
      )}

      {creating && (
        <CreateGroupModal
          onClose={() => setCreating(false)}
          onCreated={(id) => { setCreating(false); navigate(`/shared-expenses/${id}`); }}
        />
      )}
    </div>
  );
}

// ── Group detail ──────────────────────────────────────────────────────────────

type Tab = 'expenses' | 'balances' | 'members';

function GroupDetail({ groupId }: { groupId: string }) {
  const { fetchGroup } = useSharedExpenses();
  const { formatAmount } = useCurrency();
  const [group, setGroup] = useState<SharedGroupDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>('expenses');
  const [expenseModal, setExpenseModal] = useState<{ expense: SharedExpense | null } | null>(null);
  const [settleModal, setSettleModal] = useState<{ initial?: Debt; settlement?: SharedExpense } | null>(null);

  const load = useCallback(async () => {
    const g = await fetchGroup(groupId);
    if (g) { setGroup(g); setNotFound(false); } else setNotFound(true);
  }, [fetchGroup, groupId]);

  useEffect(() => { setGroup(null); void load(); }, [load]);

  // Pick up changes made by other members when the user comes back to the tab.
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, [load]);

  const balances = useMemo(
    () => (group ? computeBalances(group.members.map((m) => m.id), group.expenses) : {}),
    [group],
  );
  const debts = useMemo(() => simplifyDebts(balances), [balances]);

  if (notFound) {
    return (
      <div className="px-4 lg:px-8 py-6 lg:py-8">
        <BackLink />
        <div className="bg-card border border-border rounded-xl p-10 text-center mt-4">
          <h3 className="font-semibold mb-2">Group not found</h3>
          <p className="text-sm text-muted-foreground">It may have been deleted, or you're no longer a member.</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="px-4 lg:px-8 py-6 lg:py-8">
        <BackLink />
        <div className="flex justify-center py-16 text-muted-foreground"><Spinner /></div>
      </div>
    );
  }

  const memberName = (id: string) => {
    const m = group.members.find((x) => x.id === id);
    return m ? (m.isMe ? 'You' : m.name) : 'Unknown';
  };
  const myBalance = balances[group.myMemberId] ?? 0;
  const b = balanceText(myBalance, formatAmount);
  const afterSave = () => { setExpenseModal(null); setSettleModal(null); void load(); };

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8">
      <BackLink />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 mb-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-medium truncate">{group.name}</h1>
          <p className={`text-sm font-medium mt-0.5 ${b.className}`}>
            {b.text === 'settled up' ? "You're all settled up" : b.text.charAt(0).toUpperCase() + b.text.slice(1)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {debts.length > 0 && (
            <button
              onClick={() => setSettleModal({ initial: debts.find((d) => d.from === group.myMemberId || d.to === group.myMemberId) })}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 border border-teal-200 dark:border-teal-800 transition-colors"
            >
              Settle up
            </button>
          )}
          <button
            onClick={() => setExpenseModal({ expense: null })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Add expense
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit mb-5">
        {(['expenses', 'balances', 'members'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${
              tab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'expenses' && (
        <ExpensesTab
          group={group}
          memberName={memberName}
          onOpenExpense={(e) => (e.kind === 'settlement' ? setSettleModal({ settlement: e }) : setExpenseModal({ expense: e }))}
          onAdd={() => setExpenseModal({ expense: null })}
        />
      )}
      {tab === 'balances' && (
        <BalancesTab
          group={group}
          balances={balances}
          debts={debts}
          memberName={memberName}
          onSettle={(d) => setSettleModal({ initial: d })}
        />
      )}
      {tab === 'members' && <MembersTab group={group} balances={balances} onChanged={load} />}

      {expenseModal && (
        <SharedExpenseModal
          group={group}
          expense={expenseModal.expense}
          onClose={() => setExpenseModal(null)}
          onSaved={afterSave}
        />
      )}
      {settleModal && (
        <SettleUpModal
          group={group}
          initial={settleModal.initial}
          settlement={settleModal.settlement}
          onClose={() => setSettleModal(null)}
          onSaved={afterSave}
        />
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/shared-expenses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
      <ArrowLeft className="w-4 h-4" /> All groups
    </Link>
  );
}

// ── Expenses tab ──────────────────────────────────────────────────────────────

function ExpensesTab({ group, memberName, onOpenExpense, onAdd }: {
  group: SharedGroupDetail;
  memberName: (id: string) => string;
  onOpenExpense: (e: SharedExpense) => void;
  onAdd: () => void;
}) {
  const { formatAmount } = useCurrency();
  const { tCategory } = useLanguage();

  if (group.expenses.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-10 text-center">
        <h3 className="font-semibold mb-2">No expenses yet</h3>
        <p className="text-sm text-muted-foreground mb-4">Add the first one and it'll be split between the group.</p>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add expense
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
      {group.expenses.map((e) => {
        if (e.kind === 'settlement') {
          const to = e.splits[0]?.memberId ?? '';
          return (
            <button key={e.id} onClick={() => onOpenExpense(e)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-900/20">
                <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{memberName(e.paidBy)} paid {memberName(to)}</p>
                <p className="text-xs text-muted-foreground">Payment · {formatDate(e.date)}</p>
              </div>
              <span className="text-sm font-semibold text-emerald-600">{formatAmount(e.amount)}</span>
            </button>
          );
        }

        const { icon: Icon, bg, text } = getCategoryConfig(e.category);
        const myShare = e.splits.find((s) => s.memberId === group.myMemberId)?.amount ?? 0;
        const iPaid = e.paidBy === group.myMemberId;
        const lent = iPaid ? e.amount - myShare : 0;
        let impact: { text: string; className: string };
        if (iPaid && lent > EPS) impact = { text: `you lent ${formatAmount(lent)}`, className: 'text-emerald-600' };
        else if (!iPaid && myShare > EPS) impact = { text: `you borrowed ${formatAmount(myShare)}`, className: 'text-red-500' };
        else impact = { text: 'not involved', className: 'text-muted-foreground' };
        if (iPaid && lent <= EPS && myShare > EPS) impact = { text: 'just you', className: 'text-muted-foreground' };

        return (
          <button key={e.id} onClick={() => onOpenExpense(e)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
              <Icon className={`w-4 h-4 ${text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{e.description}</p>
              <p className="text-xs text-muted-foreground truncate">
                {memberName(e.paidBy)} paid · {tCategory(e.category)} · {formatDate(e.date)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold">{formatAmount(e.amount)}</p>
              <p className={`text-xs ${impact.className}`}>{impact.text}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Balances tab ──────────────────────────────────────────────────────────────

function BalancesTab({ group, balances, debts, memberName, onSettle }: {
  group: SharedGroupDetail;
  balances: Record<string, number>;
  debts: Debt[];
  memberName: (id: string) => string;
  onSettle: (d: Debt) => void;
}) {
  const { formatAmount } = useCurrency();
  const maxAbs = Math.max(0.01, ...Object.values(balances).map(Math.abs));

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-muted/50 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">Net balances</p>
        </div>
        <div className="divide-y divide-border">
          {group.members.map((m) => {
            const bal = balances[m.id] ?? 0;
            const positive = bal > EPS;
            const negative = bal < -EPS;
            return (
              <div key={m.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <p className="text-sm font-medium truncate">{m.isMe ? `${m.name} (you)` : m.name}</p>
                  <p className={`text-sm font-semibold tabular-nums ${positive ? 'text-emerald-600' : negative ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {positive ? '+' : negative ? '−' : ''}{formatAmount(Math.abs(bal))}
                  </p>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(Math.abs(bal) / maxAbs) * 100}%`,
                      backgroundColor: positive ? '#10b981' : '#ef4444',
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {positive ? 'gets back' : negative ? 'owes' : 'settled up'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden h-fit">
        <div className="px-4 py-2 bg-muted/50 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">Who owes whom</p>
        </div>
        {debts.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">Everyone is settled up 🎉</p>
        ) : (
          <div className="divide-y divide-border">
            {debts.map((d) => {
              const involvesMe = d.from === group.myMemberId || d.to === group.myMemberId;
              return (
                <div key={`${d.from}-${d.to}`} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0 flex items-center gap-1.5 text-sm">
                    <span className={`truncate ${d.from === group.myMemberId ? 'font-semibold' : ''}`}>{memberName(d.from)}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className={`truncate ${d.to === group.myMemberId ? 'font-semibold' : ''}`}>{memberName(d.to)}</span>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${involvesMe ? (d.from === group.myMemberId ? 'text-red-500' : 'text-emerald-600') : ''}`}>
                    {formatAmount(d.amount)}
                  </span>
                  <button
                    onClick={() => onSettle(d)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 border border-teal-200 dark:border-teal-800 transition-colors shrink-0"
                  >
                    Record
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Members tab ───────────────────────────────────────────────────────────────

function MembersTab({ group, balances, onChanged }: {
  group: SharedGroupDetail;
  balances: Record<string, number>;
  onChanged: () => Promise<void>;
}) {
  const { addMember, removeMember, renameGroup, deleteGroup } = useSharedExpenses();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(group.name);
  const [confirm, setConfirm] = useState<null | { kind: 'delete' } | { kind: 'remove'; memberId: string; name: string; isMe: boolean }>(null);

  const involved = useMemo(() => {
    const ids = new Set<string>();
    for (const e of group.expenses) {
      ids.add(e.paidBy);
      for (const s of e.splits) ids.add(s.memberId);
    }
    return ids;
  }, [group.expenses]);

  const handleAdd = async () => {
    setError(null);
    if (!name.trim() && !email.trim()) return setError('Enter a name or email.');
    setBusy(true);
    const err = await addMember(group.id, name.trim() || email.trim().split('@')[0], email.trim());
    setBusy(false);
    if (err) return setError(err);
    setName(''); setEmail('');
    showToast('Member added');
    await onChanged();
  };

  const handleRename = async () => {
    if (!newName.trim() || newName.trim() === group.name) { setRenaming(false); return; }
    setBusy(true);
    const err = await renameGroup(group.id, newName.trim());
    setBusy(false);
    if (err) return setError(err);
    setRenaming(false);
    await onChanged();
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    if (confirm.kind === 'delete') {
      const err = await deleteGroup(group.id);
      setBusy(false);
      if (err) { setConfirm(null); return setError(err); }
      showToast('Group deleted');
      navigate('/shared-expenses');
      return;
    }
    const err = await removeMember(group.id, confirm.memberId);
    setBusy(false);
    setConfirm(null);
    if (err) return setError(err);
    if (confirm.isMe) { showToast('You left the group'); navigate('/shared-expenses'); return; }
    showToast('Member removed');
    await onChanged();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2 bg-muted/50 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">{group.members.length} members</p>
          </div>
          <div className="divide-y divide-border">
            {group.members.map((m) => {
              const canRemove = !involved.has(m.id) && Math.abs(balances[m.id] ?? 0) < EPS;
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-semibold text-muted-foreground">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {m.name}
                      {m.isMe && <span className="ml-2 text-[10px] font-bold bg-teal-500 text-white px-1.5 py-0.5 rounded-full align-middle">YOU</span>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{m.email ?? 'No email — only tracked in this group'}</p>
                  </div>
                  {canRemove ? (
                    <button
                      onClick={() => setConfirm({ kind: 'remove', memberId: m.id, name: m.name, isMe: m.isMe })}
                      className="text-xs text-red-500 hover:text-red-600 underline shrink-0"
                    >
                      {m.isMe ? 'Leave' : 'Remove'}
                    </button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground shrink-0" title="Members in existing expenses can't be removed">
                      in expenses
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4 text-teal-500" /> Add someone</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="text" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Name" className={inputClass} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" aria-label="Email" className={inputClass} />
            <button
              onClick={handleAdd}
              disabled={busy}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors shrink-0 disabled:opacity-70"
            >
              {busy ? <Spinner /> : <Plus className="w-4 h-4" />} Add
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            With an email, they'll see this group and get their shares in their transactions once they sign in.
          </p>
          {error && <p className="text-xs text-red-500 mt-2" role="alert">{error}</p>}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 h-fit space-y-4">
        <p className="text-sm font-semibold">Group settings</p>
        {renaming ? (
          <div className="flex gap-2">
            <input type="text" value={newName} maxLength={80} autoFocus onChange={(e) => setNewName(e.target.value)} aria-label="Group name" className={inputClass} />
            <button onClick={handleRename} disabled={busy} className="px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors">Save</button>
            <button onClick={() => { setRenaming(false); setNewName(group.name); }} aria-label="Cancel rename" className="p-2 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <button onClick={() => setRenaming(true)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="w-4 h-4" /> Rename group
          </button>
        )}
        {group.isOwner && (
          <button onClick={() => setConfirm({ kind: 'delete' })} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete group
          </button>
        )}
      </div>

      {confirm && (
        <ModalShell
          title={confirm.kind === 'delete' ? 'Delete group?' : confirm.isMe ? 'Leave group?' : 'Remove member?'}
          onClose={() => setConfirm(null)}
          maxWidth="max-w-sm"
          footer={
            <>
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">Cancel</button>
              <button
                onClick={handleConfirm}
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {busy && <Spinner />} {confirm.kind === 'delete' ? 'Delete' : confirm.isMe ? 'Leave' : 'Remove'}
              </button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">
            {confirm.kind === 'delete'
              ? `This deletes "${group.name}" and all its expenses for everyone, including the matching transactions in each member's history.`
              : confirm.isMe
                ? `You'll stop seeing "${group.name}".`
                : `${confirm.name} will be removed from "${group.name}".`}
          </p>
        </ModalShell>
      )}
    </div>
  );
}
