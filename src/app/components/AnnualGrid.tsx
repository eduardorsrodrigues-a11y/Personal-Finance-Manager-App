import { useMemo, useState, useEffect } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useBudgets } from '../context/BudgetContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { NEEDS_CATEGORIES, WANTS_CATEGORIES } from '../utils/budgetAllocator';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Income categories that count as "Salary" for the primary savings calculation
const SALARY_CATS = new Set(['Salary', 'Meal Allowance']);

// Expense cell: lower is better — green <90%, amber 90–100%, red >100%
// Income / savings cell: higher is better — green ≥100%, amber 80–99%, red <80%
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

export function AnnualGrid() {
  const { transactions } = useTransactions();
  const { budgets, annualBudgets } = useBudgets();
  const { formatAmount } = useCurrency();
  const { tCategory } = useLanguage();
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullscreen]);

  const currentYear = new Date().getFullYear();

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

    // Expense categories: NEEDS → WANTS order for budgeted ones, then any extras
    const orderedExp: string[] = [];
    for (const cat of [...NEEDS_CATEGORIES, ...WANTS_CATEGORIES]) {
      if ((budgets[cat] ?? 0) > 0 || expSet.has(cat)) orderedExp.push(cat);
    }
    for (const cat of expSet) {
      if (!orderedExp.includes(cat)) orderedExp.push(cat);
    }

    return { expMC, incMC, incCats: Array.from(incSet), expCats: orderedExp };
  }, [transactions, budgets, currentYear]);

  // Cell accessors
  const E = (cat: string, mo: number) => expMC[mo]?.[cat] ?? 0;
  const I = (cat: string, mo: number) => incMC[mo]?.[cat] ?? 0;
  const Etot = (cat: string) => MONTHS.reduce((s, _, i) => s + E(cat, i), 0);
  const Itot = (cat: string) => MONTHS.reduce((s, _, i) => s + I(cat, i), 0);

  // Month-level aggregates
  const moExpTotal = (mo: number) => expCats.reduce((s, c) => s + E(c, mo), 0);
  const moIncTotal = (mo: number) => incCats.reduce((s, c) => s + I(c, mo), 0);
  const moSalary   = (mo: number) => incCats.filter(c => SALARY_CATS.has(c)).reduce((s, c) => s + I(c, mo), 0);

  // Year-level aggregates
  const yrExpTotal = MONTHS.reduce((s, _, i) => s + moExpTotal(i), 0);
  const yrIncTotal = MONTHS.reduce((s, _, i) => s + moIncTotal(i), 0);
  const yrSalary   = MONTHS.reduce((s, _, i) => s + moSalary(i), 0);

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

  // ── Shared class fragments ───────────────────────────────
  const CELL = 'px-3 py-2 text-xs whitespace-nowrap tabular-nums';
  const sticky = `${CELL} sticky left-0 z-10 bg-card border-r border-border font-medium text-left max-w-[160px] truncate`;
  const data = `${CELL} text-right`;
  const yearCol = `${data} font-semibold bg-muted/40`;

  function SectionRow({ label }: { label: string }) {
    return (
      <tr>
        <td
          colSpan={14}
          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/60"
        >
          {label}
        </td>
      </tr>
    );
  }

  function TotalRow({ label, getMo, getYr }: {
    label: string;
    getMo: (i: number) => number;
    getYr: number;
  }) {
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

  // ── Shared table (used in both inline and fullscreen) ──────
  const tableContent = (
    <div className="overflow-x-auto overflow-y-auto flex-1">
      <table className="border-collapse" style={{ minWidth: '900px', width: '100%' }}>
        <thead className="sticky top-0 z-20">
          <tr className="border-b border-border bg-muted/20">
            <th className={`${sticky} bg-muted/30 text-muted-foreground font-semibold`} style={{ minWidth: 140 }}>
              Category
            </th>
            {MONTHS.map(m => (
              <th key={m} className={`${data} font-semibold text-muted-foreground bg-muted/20`} style={{ minWidth: 80 }}>
                {m}
              </th>
            ))}
            <th className={`${yearCol} font-bold text-foreground`} style={{ minWidth: 90 }}>
              Year
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border/30">
          {/* ═══ SECTION A: EARNINGS ═══ */}
          <SectionRow label="Earnings" />
          {incCats.map(cat => (
            <tr key={cat} className="hover:bg-muted/15 transition-colors">
              <td className={sticky}>{tCategory(cat)}</td>
              {MONTHS.map((_, i) => (
                <td key={i} className={data}>{fmt(I(cat, i))}</td>
              ))}
              <td className={yearCol}>{fmt(Itot(cat))}</td>
            </tr>
          ))}
          <TotalRow label="Total Income" getMo={moIncTotal} getYr={yrIncTotal} />

          {/* ═══ SECTION B: EXPENSES ═══ */}
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
                {MONTHS.map((_, i) => {
                  const val = E(cat, i);
                  return (
                    <td key={i} className={`${data} ${cellBg(val, mBudget, false)}`}>
                      {fmt(val)}
                    </td>
                  );
                })}
                <td className={`${yearCol} ${cellBg(yrTot, aBudget, false)}`}>
                  {fmt(yrTot)}
                </td>
              </tr>
            );
          })}
          <TotalRow label="Total Expenses" getMo={moExpTotal} getYr={yrExpTotal} />

          {/* ═══ SECTION C: METRICS ═══ */}
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

  // ── Shared header ────────────────────────────────────────
  const header = (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
      <div>
        <h2 className="font-semibold">Annual Overview — {currentYear}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Monthly columns vs. monthly budget · Year column vs. annual budget
        </p>
      </div>
      <button
        onClick={() => setFullscreen(f => !f)}
        className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        title={fullscreen ? 'Exit full screen' : 'Full screen'}
      >
        {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );

  const noDataMsg = (
    <div className="px-6 py-12 text-center text-sm text-muted-foreground">
      No transactions recorded for {currentYear} yet.
    </div>
  );

  // ── Fullscreen modal ─────────────────────────────────────
  if (fullscreen) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setFullscreen(false)}
        />
        {/* Panel */}
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
              title="Exit full screen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {hasAnyData ? tableContent : noDataMsg}
        </div>
      </>
    );
  }

  // ── Inline card ──────────────────────────────────────────
  return (
    <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden mt-6 lg:mt-8">
      {header}
      {hasAnyData ? tableContent : noDataMsg}
    </div>
  );
}
