import { useMemo, useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { type Transaction } from '../context/TransactionContext';
import { useBudgets } from '../context/BudgetContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { NEEDS_CATEGORIES, WANTS_CATEGORIES } from '../utils/budgetAllocator';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SALARY_CATS = new Set(['Salary', 'Meal Allowance']);

function cellBg(actual: number, budget: number | undefined, higherIsBetter: boolean): string {
  if (!budget || budget <= 0 || actual === 0) return '';
  const r = actual / budget;
  if (higherIsBetter) {
    if (r >= 1)   return 'bg-green-50 dark:bg-green-900/20';
    if (r >= 0.8) return 'bg-amber-50 dark:bg-amber-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
  }
  if (r <= 0.9) return 'bg-green-50 dark:bg-green-900/20';
  if (r <= 1.0) return 'bg-amber-50 dark:bg-amber-900/20';
  return 'bg-red-50 dark:bg-red-900/20';
}

type TooltipState = {
  x: number;
  y: number;
  label: string;
  top3: Transaction[];
  total: number;
};

type DrilldownState = {
  label: string;
  transactions: Transaction[];
};

export function AnnualGrid() {
  const { transactions } = useTransactions();
  const { budgets, annualBudgets } = useBudgets();
  const { formatAmount } = useCurrency();
  const { tCategory } = useLanguage();

  const [fullscreen, setFullscreen] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [drilldown, setDrilldown] = useState<DrilldownState | null>(null);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drilldown) { setDrilldown(null); return; }
        if (fullscreen) setFullscreen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullscreen, drilldown]);

  // Build month × category aggregation maps
  const { expMC, incMC, incCats, expCats } = useMemo(() => {
    const expMC: Record<number, Record<string, number>> = {};
    const incMC: Record<number, Record<string, number>> = {};
    const incSet = new Set<string>();
    const expSet = new Set<string>();

    for (const t of transactions) {
      if (new Date(t.date).getFullYear() !== currentYear) continue;
      const mo = new Date(t.date).getMonth();
      if (t.type === 'expense') {
        expSet.add(t.category);
        if (!expMC[mo]) expMC[mo] = {};
        expMC[mo][t.category] = (expMC[mo][t.category] ?? 0) + t.amount;
      } else {
        incSet.add(t.category);
        if (!incMC[mo]) incMC[mo] = {};
        incMC[mo][t.category] = (incMC[mo][t.category] ?? 0) + t.amount;
      }
    }

    const orderedExp: string[] = [];
    for (const cat of [...NEEDS_CATEGORIES, ...WANTS_CATEGORIES]) {
      if ((budgets[cat] ?? 0) > 0 || expSet.has(cat)) orderedExp.push(cat);
    }
    for (const cat of expSet) {
      if (!orderedExp.includes(cat)) orderedExp.push(cat);
    }

    return { expMC, incMC, incCats: Array.from(incSet), expCats: orderedExp };
  }, [transactions, budgets, currentYear]);

  const E = (cat: string, mo: number) => expMC[mo]?.[cat] ?? 0;
  const I = (cat: string, mo: number) => incMC[mo]?.[cat] ?? 0;
  const Etot = (cat: string) => MONTHS.reduce((s, _, i) => s + E(cat, i), 0);
  const Itot = (cat: string) => MONTHS.reduce((s, _, i) => s + I(cat, i), 0);

  const moExpTotal = (mo: number) => expCats.reduce((s, c) => s + E(c, mo), 0);
  const moIncTotal = (mo: number) => incCats.reduce((s, c) => s + I(c, mo), 0);
  const moSalary   = (mo: number) => incCats.filter(c => SALARY_CATS.has(c)).reduce((s, c) => s + I(c, mo), 0);

  const yrExpTotal = MONTHS.reduce((s, _, i) => s + moExpTotal(i), 0);
  const yrIncTotal = MONTHS.reduce((s, _, i) => s + moIncTotal(i), 0);
  const yrSalary   = MONTHS.reduce((s, _, i) => s + moSalary(i), 0);

  // Get raw transactions for a cell (cat + month or full year)
  const getCellTxns = useCallback(
    (cat: string, monthIdx: number | null, type: 'expense' | 'income'): Transaction[] =>
      transactions.filter(t => {
        if (t.type !== type || t.category !== cat) return false;
        const d = new Date(t.date);
        if (d.getFullYear() !== currentYear) return false;
        return monthIdx === null || d.getMonth() === monthIdx;
      }),
    [transactions, currentYear],
  );

  const handleCellHover = (
    e: React.MouseEvent,
    cat: string,
    monthIdx: number | null,
    type: 'expense' | 'income',
  ) => {
    const txns = getCellTxns(cat, monthIdx, type).sort((a, b) => b.amount - a.amount);
    if (txns.length === 0) return;
    const monthLabel = monthIdx !== null ? MONTHS[monthIdx] : 'Year total';
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      label: `${tCategory(cat)} · ${monthLabel}`,
      top3: txns.slice(0, 3),
      total: txns.length,
    });
  };

  const handleCellClick = (
    cat: string,
    monthIdx: number | null,
    type: 'expense' | 'income',
  ) => {
    const txns = getCellTxns(cat, monthIdx, type).sort((a, b) => b.amount - a.amount);
    if (txns.length === 0) return;
    const monthLabel = monthIdx !== null ? MONTHS[monthIdx] : 'Year total';
    setDrilldown({ label: `${tCategory(cat)} · ${monthLabel}`, transactions: txns });
  };

  // Formatters
  const fmt = (v: number) =>
    v === 0 ? <span className="text-muted-foreground/30 select-none">—</span> : <>{formatAmount(v)}</>;

  const fmtSigned = (v: number, hasData: boolean) => {
    if (!hasData) return <span className="text-muted-foreground/30 select-none">—</span>;
    return (
      <span className={v >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
        {formatAmount(v)}
      </span>
    );
  };

  const fmtRate = (num: number, den: number) => {
    if (den === 0) return <span className="text-muted-foreground/30 select-none">—</span>;
    const pct = Math.round((num / den) * 100);
    return (
      <span className={pct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
        {pct}%
      </span>
    );
  };

  const hasAnyData = incCats.length > 0 || expCats.length > 0;

  // ── Shared class fragments ───────────────────────────────────
  const CELL = 'px-3 py-2 text-xs whitespace-nowrap tabular-nums';
  const sticky = `${CELL} sticky left-0 z-10 bg-card border-r border-border font-medium text-left max-w-[160px] truncate`;
  const data = `${CELL} text-right`;
  const yearCol = `${data} font-semibold bg-muted/40`;

  // Renders a clickable data cell; zero amounts show dash with no interaction
  const DataCell = ({
    value,
    extraClass = '',
    cat,
    monthIdx,
    type,
    isYear = false,
  }: {
    value: number;
    extraClass?: string;
    cat: string;
    monthIdx: number | null;
    type: 'expense' | 'income';
    isYear?: boolean;
  }) => {
    const base = isYear ? yearCol : data;
    if (value === 0) {
      return (
        <td className={`${base} ${extraClass}`}>
          <span className="text-muted-foreground/30 select-none">—</span>
        </td>
      );
    }
    return (
      <td
        className={`${base} ${extraClass} cursor-pointer hover:underline`}
        onMouseEnter={e => handleCellHover(e, cat, monthIdx, type)}
        onMouseLeave={() => setTooltip(null)}
        onClick={() => handleCellClick(cat, monthIdx, type)}
      >
        {formatAmount(value)}
      </td>
    );
  };

  function SectionRow({ label }: { label: string }) {
    return (
      <tr>
        <td colSpan={14} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/60">
          {label}
        </td>
      </tr>
    );
  }

  function TotalRow({ label, getMo, getYr }: { label: string; getMo: (i: number) => number; getYr: number }) {
    return (
      <tr className="bg-muted/25 border-t border-border">
        <td className={`${sticky} bg-muted/25 font-bold`}>{label}</td>
        {MONTHS.map((_, i) => (
          <td key={i} className={`${data} font-bold`}>{fmt(getMo(i))}</td>
        ))}
        <td className={`${yearCol} font-bold`}>{fmt(getYr)}</td>
      </tr>
    );
  }

  // ── Table (shared between inline and fullscreen) ─────────────
  const tableContent = (
    <div className="overflow-x-auto overflow-y-auto flex-1">
      <table className="border-collapse" style={{ minWidth: '900px', width: '100%' }}>
        <thead className="sticky top-0 z-20">
          <tr className="border-b border-border bg-muted/20">
            <th className={`${sticky} bg-muted/30 text-muted-foreground font-semibold`} style={{ minWidth: 140 }}>Category</th>
            {MONTHS.map(m => (
              <th key={m} className={`${data} font-semibold text-muted-foreground bg-muted/20`} style={{ minWidth: 80 }}>{m}</th>
            ))}
            <th className={`${yearCol} font-bold text-foreground`} style={{ minWidth: 90 }}>Year</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border/30">
          {/* ═══ EARNINGS ═══ */}
          <SectionRow label="Earnings" />
          {incCats.map(cat => (
            <tr key={cat} className="hover:bg-muted/15 transition-colors">
              <td className={sticky}>{tCategory(cat)}</td>
              {MONTHS.map((_, i) => (
                <DataCell key={i} value={I(cat, i)} cat={cat} monthIdx={i} type="income" />
              ))}
              <DataCell value={Itot(cat)} cat={cat} monthIdx={null} type="income" isYear />
            </tr>
          ))}
          <TotalRow label="Total Income" getMo={moIncTotal} getYr={yrIncTotal} />

          {/* ═══ EXPENSES ═══ */}
          <SectionRow label="Expenses" />
          {expCats.map(cat => {
            const mBudget = (budgets[cat] ?? 0) > 0 ? budgets[cat] : undefined;
            const aBudget = mBudget
              ? ((annualBudgets[cat] ?? 0) > 0 ? annualBudgets[cat] : mBudget * 12)
              : undefined;
            const yrTot = Etot(cat);
            return (
              <tr key={cat} className="hover:bg-muted/15 transition-colors">
                <td className={sticky}>{tCategory(cat)}</td>
                {MONTHS.map((_, i) => (
                  <DataCell
                    key={i}
                    value={E(cat, i)}
                    extraClass={cellBg(E(cat, i), mBudget, false)}
                    cat={cat}
                    monthIdx={i}
                    type="expense"
                  />
                ))}
                <DataCell
                  value={yrTot}
                  extraClass={cellBg(yrTot, aBudget, false)}
                  cat={cat}
                  monthIdx={null}
                  type="expense"
                  isYear
                />
              </tr>
            );
          })}
          <TotalRow label="Total Expenses" getMo={moExpTotal} getYr={yrExpTotal} />

          {/* ═══ METRICS ═══ */}
          <SectionRow label="Metrics" />
          <tr className="hover:bg-muted/15 transition-colors">
            <td className={sticky}>Savings Amount</td>
            {MONTHS.map((_, i) => {
              const sal = moSalary(i); const exp = moExpTotal(i);
              return <td key={i} className={data}>{fmtSigned(sal - exp, sal > 0 || exp > 0)}</td>;
            })}
            <td className={yearCol}>{fmtSigned(yrSalary - yrExpTotal, yrSalary > 0 || yrExpTotal > 0)}</td>
          </tr>
          <tr className="hover:bg-muted/15 transition-colors">
            <td className={sticky}>Savings Rate</td>
            {MONTHS.map((_, i) => (
              <td key={i} className={data}>{fmtRate(moSalary(i) - moExpTotal(i), moSalary(i))}</td>
            ))}
            <td className={yearCol}>{fmtRate(yrSalary - yrExpTotal, yrSalary)}</td>
          </tr>
          <tr className="hover:bg-muted/15 transition-colors">
            <td className={sticky}>Total Savings</td>
            {MONTHS.map((_, i) => {
              const inc = moIncTotal(i); const exp = moExpTotal(i);
              return <td key={i} className={data}>{fmtSigned(inc - exp, inc > 0 || exp > 0)}</td>;
            })}
            <td className={yearCol}>{fmtSigned(yrIncTotal - yrExpTotal, yrIncTotal > 0 || yrExpTotal > 0)}</td>
          </tr>
          <tr className="hover:bg-muted/15 transition-colors">
            <td className={sticky}>Total Savings Rate</td>
            {MONTHS.map((_, i) => (
              <td key={i} className={data}>{fmtRate(moIncTotal(i) - moExpTotal(i), moIncTotal(i))}</td>
            ))}
            <td className={yearCol}>{fmtRate(yrIncTotal - yrExpTotal, yrIncTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const noDataMsg = (
    <div className="px-6 py-12 text-center text-sm text-muted-foreground">
      No transactions recorded for {currentYear} yet.
    </div>
  );

  // ── Hover tooltip (top 3 transactions) ──────────────────────
  const tooltipEl = tooltip && (
    <div
      className="fixed z-[200] pointer-events-none bg-card border border-border rounded-xl shadow-xl p-3 w-60"
      style={{
        left: Math.min(tooltip.x + 14, window.innerWidth - 256),
        top: tooltip.y + 18,
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        {tooltip.label}
      </p>
      <div className="space-y-1.5">
        {tooltip.top3.map((t, idx) => (
          <div key={t.id} className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground w-3 shrink-0">#{idx + 1}</span>
            <span className="text-xs text-foreground truncate flex-1">{t.description}</span>
            <span className="text-xs font-semibold shrink-0">{formatAmount(t.amount)}</span>
          </div>
        ))}
      </div>
      {tooltip.total > 3 && (
        <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border">
          +{tooltip.total - 3} more · click to see all
        </p>
      )}
    </div>
  );

  // ── Drilldown modal (all transactions for that cell) ─────────
  const drilldownEl = drilldown && (
    <>
      <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm" onClick={() => setDrilldown(null)} />
      <div className="fixed inset-x-4 top-[10%] bottom-[10%] lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 lg:w-[480px] z-[160] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <p className="font-semibold text-sm">{drilldown.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{drilldown.transactions.length} transaction{drilldown.transactions.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setDrilldown(null)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-border/50">
          {drilldown.transactions.map(t => (
            <div key={t.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <span className={`text-sm font-semibold shrink-0 ${t.type === 'expense' ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {t.type === 'expense' ? '-' : '+'}{formatAmount(t.amount)}
              </span>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border bg-muted/30 shrink-0 flex justify-between items-center">
          <span className="text-xs text-muted-foreground font-medium">Total</span>
          <span className="text-sm font-bold">
            {formatAmount(drilldown.transactions.reduce((s, t) => s + t.amount, 0))}
          </span>
        </div>
      </div>
    </>
  );

  // ── Fullscreen modal ─────────────────────────────────────────
  if (fullscreen) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setFullscreen(false)} />
        <div className="fixed inset-4 lg:inset-6 z-50 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div>
              <h2 className="font-semibold">Annual Overview — {currentYear}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monthly columns vs. monthly budget · Year column vs. annual budget
              </p>
            </div>
            <button
              onClick={() => setFullscreen(false)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {hasAnyData ? tableContent : noDataMsg}
        </div>
        {tooltipEl}
        {drilldownEl}
      </>
    );
  }

  // ── Inline card ──────────────────────────────────────────────
  return (
    <>
      <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden mt-6 lg:mt-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-semibold">Annual Overview — {currentYear}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monthly columns vs. monthly budget · Year column vs. annual budget
            </p>
          </div>
          <button
            onClick={() => setFullscreen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 border border-teal-200 dark:border-teal-800 transition-colors"
          >
            View full screen
          </button>
        </div>
        {hasAnyData ? tableContent : noDataMsg}
      </div>
      {tooltipEl}
      {drilldownEl}
    </>
  );
}
