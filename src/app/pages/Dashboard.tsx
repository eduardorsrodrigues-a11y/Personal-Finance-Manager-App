import { useState, useMemo, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react';
import { Tooltip, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, LabelList } from 'recharts';
import { useNavigate } from 'react-router';
import { useTransactions } from '../context/TransactionContext';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { TransactionFilters } from '../components/TransactionFilters';
import { filterTransactionsByMonth } from '../utils/dateUtils';
import { AnnualGrid } from '../components/AnnualGrid';
import { useCurrency } from '../context/CurrencyContext';
import { useBudgets } from '../context/BudgetContext';
import { getCategoryConfig } from '../utils/categoryConfig';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const MONTH_STORAGE_KEY = 'fw_dashboard_month';

export function Dashboard() {
  const { transactions, isLoading } = useTransactions();
  const { formatAmount } = useCurrency();
  const { budgets, annualBudgets } = useBudgets();
  const { t: tr, tCategory } = useLanguage();
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<import('../context/TransactionContext').Transaction | null>(null);
  const [chartCategory, setChartCategory] = useState<string>('all');
  const [chartIncomeCategory, setChartIncomeCategory] = useState<string>('all');

  // Persist selected month across page refreshes
  const [selectedMonth, setSelectedMonth] = useState<string>(
    () => localStorage.getItem(MONTH_STORAGE_KEY) ?? '',
  );
  const updateMonth = (month: string) => {
    setSelectedMonth(month);
    localStorage.setItem(MONTH_STORAGE_KEY, month);
  };

  // Detect auth identity changes → reset to most recent month with data on next load
  const mountedRef = useRef(false);
  const prevUserKeyRef = useRef<string | null>(null);
  const pendingResetRef = useRef(false);

  useEffect(() => {
    const key = user?.id ?? (isGuest ? 'guest' : null);
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevUserKeyRef.current = key;
      // First load with no stored month → also reset
      if (!localStorage.getItem(MONTH_STORAGE_KEY)) pendingResetRef.current = true;
      return;
    }
    if (key !== prevUserKeyRef.current) {
      prevUserKeyRef.current = key;
      pendingResetRef.current = true;
    }
  }, [user, isGuest]);

  // 'N' keyboard shortcut → open new transaction modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditingTransaction(null);
        setIsModalOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // When loading finishes and a reset is pending, default to this-month
  useEffect(() => {
    if (isLoading || !pendingResetRef.current) return;
    pendingResetRef.current = false;
    updateMonth('this-month');
  }, [isLoading, transactions]);

  // Filter transactions by selected month only
  const monthFilteredTransactions = useMemo(
    () => filterTransactionsByMonth(transactions, selectedMonth),
    [transactions, selectedMonth],
  );

  // Calculate totals from month-filtered transactions
  const totalIncome = monthFilteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = monthFilteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Calculate expenses by category from month-filtered transactions
  const expensesByCategory = monthFilteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));


  // Categories available for chart filters
  const expenseCategories = useMemo(
    () => Array.from(new Set(transactions.filter((t) => t.type === 'expense').map((t) => t.category))).sort(),
    [transactions],
  );
  const incomeCategories = useMemo(
    () => Array.from(new Set(transactions.filter((t) => t.type === 'income').map((t) => t.category))).sort(),
    [transactions],
  );

  // Combined monthly view data (expense + income, all months)
  const monthlyData = useMemo(() => {
    const map: Record<string, { expense: number; income: number }> = {};
    transactions
      .filter((t) => t.type === 'expense' && (chartCategory === 'all' || t.category === chartCategory))
      .forEach((t) => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!map[key]) map[key] = { expense: 0, income: 0 };
        map[key].expense += t.amount;
      });
    transactions
      .filter((t) => t.type === 'income' && (chartIncomeCategory === 'all' || t.category === chartIncomeCategory))
      .forEach((t) => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!map[key]) map[key] = { expense: 0, income: 0 };
        map[key].income += t.amount;
      });
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { expense, income }]) => {
        const [year, month] = key.split('-');
        const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        return { key, label, expense, income, isCurrent: key === currentKey };
      });
  }, [transactions, chartCategory, chartIncomeCategory]);

  const isSingleMonth = useMemo(() => {
    if (!selectedMonth || selectedMonth === 'all' || selectedMonth === 'this-year') return false;
    if (selectedMonth === 'last-month') return true;
    if (selectedMonth.startsWith('custom:')) {
      const [, start, end] = selectedMonth.split(':');
      const s = new Date(start), e = new Date(end);
      return s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();
    }
    return true;
  }, [selectedMonth]);

  // "Apr 26" label used on the bar chart X axis (month + 2-digit year)
  const monthYearLabel = useMemo(() => {
    if (!isSingleMonth) return '';
    let date: Date;
    if (selectedMonth === 'this-month') date = new Date();
    else if (selectedMonth === 'last-month') { const n = new Date(); date = new Date(n.getFullYear(), n.getMonth() - 1, 1); }
    else if (selectedMonth.startsWith('custom:')) date = new Date(selectedMonth.split(':')[1]);
    else date = new Date(selectedMonth);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }, [isSingleMonth, selectedMonth]);

  // Single bar chart data — total income and expenses for the selected month
  const barData = useMemo(() => {
    if (!isSingleMonth) return [];
    const income = monthFilteredTransactions
      .filter((t) => t.type === 'income' && (chartIncomeCategory === 'all' || t.category === chartIncomeCategory))
      .reduce((s, t) => s + t.amount, 0);
    const expense = monthFilteredTransactions
      .filter((t) => t.type === 'expense' && (chartCategory === 'all' || t.category === chartCategory))
      .reduce((s, t) => s + t.amount, 0);
    return [{ label: monthYearLabel, income, expense }];
  }, [isSingleMonth, monthFilteredTransactions, chartCategory, chartIncomeCategory, monthYearLabel]);

  // Top 5 highest expenses for the selected period
  const topExpenses = useMemo(
    () =>
      monthFilteredTransactions
        .filter((t) => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
    [monthFilteredTransactions],
  );

  const handleCategoryDrilldown = (category: string) => {
    const params = new URLSearchParams();
    params.set('category', category);
    params.set('month', selectedMonth);
    navigate(`/transactions?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="px-4 lg:px-8 py-3 lg:py-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-semibold">{tr('dashboard.title')}</h1>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="hidden lg:flex bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg items-center gap-1.5 text-sm font-medium transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{tr('dashboard.addTransaction')}</span>
            </button>
          </div>
          
          {/* Filters */}
          <TransactionFilters
            selectedType="all"
            onTypeChange={() => {}}
            selectedCategory="all"
            onCategoryChange={() => {}}
            selectedMonth={selectedMonth}
            onMonthChange={updateMonth}
            availableCategories={[]}
            showTypeFilter={false}
            showCategoryFilter={false}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 lg:px-8 py-6 lg:py-8">
        {/* Metric Cards — Income + Expenses side by side, Balance below on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-6 lg:mb-8">
          {/* Total Income */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-muted-foreground">{tr('dashboard.totalIncome')}</p>
            </div>
            <p className="text-xl font-semibold text-emerald-600 truncate">{formatAmount(totalIncome)}</p>
          </div>

          {/* Total Expenses */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-xs text-muted-foreground">{tr('dashboard.totalExpenses')}</p>
            </div>
            <p className="text-xl font-semibold text-red-500 truncate">{formatAmount(totalExpenses)}</p>
          </div>

          {/* Current Balance — full width on mobile, normal on desktop */}
          <div className="col-span-2 lg:col-span-1 bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs text-muted-foreground">{tr('dashboard.currentBalance')}</p>
            </div>
            <p className={`text-xl font-semibold truncate ${balance >= 0 ? 'text-foreground' : 'text-red-500'}`}>
              {formatAmount(balance)}
            </p>
          </div>
        </div>

        {/* Monthly / Daily View */}
        {(isSingleMonth ? barData.length >= 1 : monthlyData.length >= 1) && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6 lg:mb-8">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-4">
                <h2 className="font-semibold">{isSingleMonth ? 'Daily View' : 'Monthly View'}</h2>
                {/* Legend */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    {isSingleMonth
                      ? <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                      : <span className="w-4 h-0.5 rounded-full bg-emerald-500 inline-block" />}
                    Income
                  </span>
                  <span className="flex items-center gap-1.5">
                    {isSingleMonth
                      ? <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
                      : <span className="w-4 h-0.5 rounded-full bg-red-500 inline-block" />}
                    Expenses
                  </span>
                </div>
              </div>
              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                <select
                  value={chartCategory}
                  onChange={(e) => setChartCategory(e.target.value)}
                  className="px-2 py-1 bg-input-background rounded-lg border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All expenses</option>
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>{tCategory(c)}</option>
                  ))}
                </select>
                <select
                  value={chartIncomeCategory}
                  onChange={(e) => setChartIncomeCategory(e.target.value)}
                  className="px-2 py-1 bg-input-background rounded-lg border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All income</option>
                  {incomeCategories.map((c) => (
                    <option key={c} value={c}>{tCategory(c)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-44 lg:h-64">
              <ResponsiveContainer width="100%" height="100%">
                {isSingleMonth ? (
                  <BarChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 16 }} barCategoryGap="40%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      tickFormatter={(v: number) => {
                        if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
                        if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`;
                        return `${v}`;
                      }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatAmount(value),
                        name === 'expense'
                          ? (chartCategory === 'all' ? 'Expenses' : tCategory(chartCategory))
                          : (chartIncomeCategory === 'all' ? 'Income' : tCategory(chartIncomeCategory)),
                      ]}
                      labelFormatter={(label) => `${label}`}
                      labelStyle={{ fontSize: 12 }}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]}>
                      <LabelList
                        dataKey="income"
                        position="center"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        content={((props: any) => {
                          const { x, y, width, height, value } = props;
                          if (!value || height < 20) return null;
                          return (
                            <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="white" fontWeight={600}>
                              {formatAmount(value)}
                            </text>
                          );
                        }) as any}
                      />
                    </Bar>
                    <Bar dataKey="expense" fill="#ef4444" radius={[3, 3, 0, 0]}>
                      <LabelList
                        dataKey="expense"
                        position="center"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        content={((props: any) => {
                          const { x, y, width, height, value } = props;
                          if (!value || height < 20) return null;
                          return (
                            <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="white" fontWeight={600}>
                              {formatAmount(value)}
                            </text>
                          );
                        }) as any}
                      />
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={monthlyData} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      tickFormatter={(v: number) => {
                        if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
                        if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`;
                        return `${v}`;
                      }}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatAmount(value),
                        name === 'expense'
                          ? (chartCategory === 'all' ? 'Expenses' : tCategory(chartCategory))
                          : (chartIncomeCategory === 'all' ? 'Income' : tCategory(chartIncomeCategory)),
                      ]}
                      labelStyle={{ fontSize: 12 }}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    {monthlyData.find(m => m.isCurrent) && (
                      <ReferenceLine
                        x={monthlyData.find(m => m.isCurrent)!.label}
                        stroke="var(--muted-foreground)"
                        strokeDasharray="4 3"
                        strokeWidth={1}
                        opacity={0.5}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={(props: { cx: number; cy: number; payload: { isCurrent: boolean } }) => {
                        const { cx, cy, payload } = props;
                        return payload.isCurrent
                          ? <circle key={`inc-dot-cur-${cx}`} cx={cx} cy={cy} r={5} fill="#10b981" stroke="var(--card)" strokeWidth={2} />
                          : <circle key={`inc-dot-${cx}`} cx={cx} cy={cy} r={3} fill="#10b981" stroke="var(--card)" strokeWidth={1.5} />;
                      }}
                      activeDot={{ r: 5, fill: '#10b981', stroke: 'var(--card)', strokeWidth: 2 }}
                    >
                      <LabelList
                        dataKey="income"
                        position="top"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        content={((props: any) => {
                          const { x, y, value, index } = props;
                          if (!monthlyData[index ?? -1]?.isCurrent) return null;
                          return (
                            <text x={x} y={(Number(y) ?? 0) - 8} textAnchor="middle" fontSize={11} fill="#10b981" fontWeight={600}>
                              {formatAmount(value ?? 0)}
                            </text>
                          );
                        }) as any}
                      />
                    </Line>
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={(props: { cx: number; cy: number; payload: { isCurrent: boolean } }) => {
                        const { cx, cy, payload } = props;
                        return payload.isCurrent
                          ? <circle key={`exp-dot-cur-${cx}`} cx={cx} cy={cy} r={5} fill="#ef4444" stroke="var(--card)" strokeWidth={2} />
                          : <circle key={`exp-dot-${cx}`} cx={cx} cy={cy} r={3} fill="#ef4444" stroke="var(--card)" strokeWidth={1.5} />;
                      }}
                      activeDot={{ r: 5, fill: '#ef4444', stroke: 'var(--card)', strokeWidth: 2 }}
                    >
                      <LabelList
                        dataKey="expense"
                        position="top"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        content={((props: any) => {
                          const { x, y, value, index } = props;
                          if (!monthlyData[index ?? -1]?.isCurrent) return null;
                          return (
                            <text x={x} y={(Number(y) ?? 0) - 8} textAnchor="middle" fontSize={11} fill="#ef4444" fontWeight={600}>
                              {formatAmount(value ?? 0)}
                            </text>
                          );
                        }) as any}
                      />
                    </Line>
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Expenses by Category + Top Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Expenses by Category */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">{tr('dashboard.expensesByCategory')}</h2>
            {chartData.length > 0 ? (() => {
              const sorted = [...chartData].sort((a, b) => b.value - a.value);
              const maxValue = sorted[0]?.value ?? 1;
              return (
                <div className="space-y-2.5">
                  {sorted.map(({ name, value }) => {
                    const pct = totalExpenses > 0 ? value / totalExpenses : 0;
                    const barPct = maxValue > 0 ? value / maxValue : 0;
                    const { icon: Icon, hex, bg, text } = getCategoryConfig(name);
                    const isAllTime = !selectedMonth || selectedMonth === 'all';
                    const isThisYear = selectedMonth === 'this-year';
                    const budget = isAllTime
                      ? undefined
                      : isThisYear
                        ? (annualBudgets[name] || (budgets[name] ?? 0) * 12) || undefined
                        : budgets[name];
                    const hasBudget = budget != null && budget > 0;
                    const isOverBudget = hasBudget && value >= budget;
                    return (
                      <button
                        key={name}
                        onClick={() => handleCategoryDrilldown(name)}
                        className="w-full flex items-center gap-3 group"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                          <Icon className={`w-4 h-4 ${text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="text-sm font-medium truncate flex-1 min-w-0 text-left">
                              {tCategory(name)}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0 w-7 text-right">
                              {(pct * 100).toFixed(0)}%
                            </span>
                            <div className="shrink-0 min-w-[5.5rem] text-right">
                              <span className={`text-sm font-semibold ${isOverBudget ? 'text-red-500' : ''}`}>
                                {formatAmount(value)}
                              </span>
                              {hasBudget && (
                                <span className="text-xs text-muted-foreground block">
                                  / {formatAmount(budget!)}{isThisYear ? '/yr' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `max(3px, ${barPct * 100}%)`,
                                backgroundColor: isOverBudget ? '#ef4444' : hex,
                              }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })() : (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                {tr('dashboard.noExpenseData')}
              </div>
            )}
          </div>

          {/* Top Expenses */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Top Expenses</h2>
            <div className="space-y-2.5">
              {topExpenses.length > 0 ? (
                topExpenses.map((transaction, idx) => {
                  const { icon: Icon, bg, text } = getCategoryConfig(transaction.category);
                  return (
                    <button
                      key={transaction.id}
                      onClick={() => setEditingTransaction(transaction)}
                      className="w-full flex items-center gap-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <span className="text-xs font-bold text-muted-foreground w-4 shrink-0 text-right">#{idx + 1}</span>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon className={`w-4 h-4 ${text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{tCategory(transaction.category)}</p>
                      </div>
                      <div className="text-right shrink-0 min-w-[5.5rem]">
                        <p className="text-sm font-semibold text-red-500">-{formatAmount(transaction.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No expenses this period
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedMonth === 'this-year' && <AnnualGrid />}
      </div>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <AddTransactionModal
        isOpen={editingTransaction !== null}
        onClose={() => setEditingTransaction(null)}
        mode="edit"
        initialTransaction={editingTransaction}
      />
    </div>
  );
}