import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react';
import { Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, LabelList } from 'recharts';
import { useNavigate } from 'react-router';
import { useTransactions } from '../context/TransactionContext';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { TransactionFilters } from '../components/TransactionFilters';
import { getAvailableMonths, filterTransactionsByMonth, getCurrentMonthLabel } from '../utils/dateUtils';
import { useCurrency } from '../context/CurrencyContext';
import { useBudgets } from '../context/BudgetContext';
import { getCategoryConfig } from '../utils/categoryConfig';
import { useLanguage } from '../context/LanguageContext';

export function Dashboard() {
  const { transactions } = useTransactions();
  const { formatAmount } = useCurrency();
  const { budgets } = useBudgets();
  const { t: tr, tCategory } = useLanguage();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<import('../context/TransactionContext').Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthLabel);
  const [chartCategory, setChartCategory] = useState<string>('all');

  // Get available months for filters — always include current month so the select has a valid option on load
  const availableMonths = useMemo(() => {
    const months = getAvailableMonths(transactions);
    const currentMonth = getCurrentMonthLabel();
    return months.includes(currentMonth) ? months : [currentMonth, ...months];
  }, [transactions]);

  // Reset to current month whenever transactions finish loading (e.g. after login)
  const { isLoading } = useTransactions();
  useEffect(() => {
    if (!isLoading) {
      setSelectedMonth(getCurrentMonthLabel());
    }
  }, [isLoading]);

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


  // Categories available in expenses (for chart filter)
  const expenseCategories = useMemo(
    () => Array.from(new Set(transactions.filter((t) => t.type === 'expense').map((t) => t.category))).sort(),
    [transactions],
  );

  // Monthly expense evolution (all transactions, not filtered by month)
  const monthlyExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense' && (chartCategory === 'all' || t.category === chartCategory))
      .forEach((t) => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        map[key] = (map[key] || 0) + t.amount;
      });
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const [year, month] = key.split('-');
        const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        return { key, label, value, isCurrent: key === currentKey };
      });
  }, [transactions, chartCategory]);

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
        <div className="px-4 lg:px-8 py-4 lg:py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-semibold">{tr('dashboard.title')}</h1>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
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
            onMonthChange={setSelectedMonth}
            availableMonths={availableMonths}
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

        {/* Monthly Expense Evolution */}
        {monthlyExpenses.length >= 1 && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6 lg:mb-8">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="font-semibold">Monthly Expenses</h2>
                <select
                  value={chartCategory}
                  onChange={(e) => setChartCategory(e.target.value)}
                  className="px-2 py-1 bg-input-background rounded-lg border border-border text-xs focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
                >
                  <option value="all">All categories</option>
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>{tCategory(c)}</option>
                  ))}
                </select>
              </div>
              <div className="h-44 lg:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyExpenses} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
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
                      formatter={(value: number) => [formatAmount(value), chartCategory === 'all' ? 'Expenses' : tCategory(chartCategory)]}
                      labelStyle={{ fontSize: 12 }}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    {monthlyExpenses.find(m => m.isCurrent) && (
                      <ReferenceLine
                        x={monthlyExpenses.find(m => m.isCurrent)!.label}
                        stroke="#10b981"
                        strokeDasharray="4 3"
                        strokeWidth={1.5}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={(props: { cx: number; cy: number; payload: { isCurrent: boolean } }) => {
                        const { cx, cy, payload } = props;
                        if (payload.isCurrent) {
                          return <circle key={`dot-current-${cx}`} cx={cx} cy={cy} r={5} fill="#10b981" stroke="var(--card)" strokeWidth={2} />;
                        }
                        return <circle key={`dot-${cx}`} cx={cx} cy={cy} r={3} fill="#10b981" stroke="var(--card)" strokeWidth={1.5} />;
                      }}
                      activeDot={{ r: 5, fill: '#10b981', stroke: 'var(--card)', strokeWidth: 2 }}
                    >
                      <LabelList
                        dataKey="value"
                        position="top"
                        content={(props: { x?: number; y?: number; value?: number; index?: number }) => {
                          const { x, y, value, index } = props;
                          const entry = monthlyExpenses[index ?? -1];
                          if (!entry?.isCurrent) return null;
                          return (
                            <text x={x} y={(y ?? 0) - 8} textAnchor="middle" fontSize={11} fill="#10b981" fontWeight={600}>
                              {formatAmount(value ?? 0)}
                            </text>
                          );
                        }}
                      />
                    </Line>
                  </LineChart>
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
                    const budget = budgets[name];
                    const hasBudget = budget != null && budget > 0;
                    const isOverBudget = hasBudget && value >= budget;
                    return (
                      <button
                        key={name}
                        onClick={() => handleCategoryDrilldown(name)}
                        className="w-full flex items-center gap-3 group"
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                          <Icon className={`w-3.5 h-3.5 ${text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="text-xs font-medium truncate flex-1 min-w-0 text-left">
                              {tCategory(name)}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0 w-7 text-right">
                              {(pct * 100).toFixed(0)}%
                            </span>
                            <div className="shrink-0 min-w-[5rem] text-right">
                              <span className={`text-xs font-semibold ${isOverBudget ? 'text-red-500' : ''}`}>
                                {formatAmount(value)}
                              </span>
                              {hasBudget && (
                                <span className="text-[10px] text-muted-foreground block">
                                  / {formatAmount(budget)}
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
                      <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0 text-right">#{idx + 1}</span>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{tCategory(transaction.category)}</p>
                      </div>
                      <div className="text-right shrink-0 min-w-[5rem]">
                        <p className="text-xs font-semibold text-red-500">-{formatAmount(transaction.amount)}</p>
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