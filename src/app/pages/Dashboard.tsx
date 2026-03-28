import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
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

  // Get available months for filters
  const availableMonths = useMemo(() => getAvailableMonths(transactions), [transactions]);

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


  // Top 3 highest expenses
  const top3Expenses = useMemo(
    () =>
      monthFilteredTransactions
        .filter((t) => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3),
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

        {/* Chart and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Expenses by Category */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">{tr('dashboard.expensesByCategory')}</h2>

            {chartData.length > 0 ? (() => {
              const sorted = [...chartData].sort((a, b) => b.value - a.value);
              const maxValue = sorted[0]?.value ?? 1;
              return (
                <>
                  {/* Compact donut — purely visual, no labels */}
                  <div className="relative flex justify-center mb-5">
                    <PieChart width={148} height={148}>
                      <Pie
                        data={sorted}
                        cx={74}
                        cy={74}
                        innerRadius={44}
                        outerRadius={68}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                        cursor="pointer"
                        onClick={(data) => { if (data?.name) handleCategoryDrilldown(data.name); }}
                      >
                        {sorted.map((entry, i) => (
                          <Cell key={i} fill={getCategoryConfig(entry.name).hex} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [formatAmount(value), tCategory(name)]}
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
                      <p className="text-sm font-bold leading-tight">{formatAmount(totalExpenses)}</p>
                    </div>
                  </div>

                  {/* Category bars — always shows all categories */}
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
                          {/* Icon */}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                            <Icon className={`w-3.5 h-3.5 ${text}`} />
                          </div>

                          {/* Bar + labels — always flex-1, bar always same width */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5 mb-1">
                              {/* Category name — truncates to give room to amount */}
                              <span className="text-xs font-medium truncate flex-1 min-w-0">
                                {tCategory(name)}
                              </span>
                              {/* % — fixed small width */}
                              <span className="text-[10px] text-muted-foreground shrink-0 w-7 text-right">
                                {(pct * 100).toFixed(0)}%
                              </span>
                              {/* Amount — fixed min-width so bars stay consistent */}
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
                            {/* Bar always spans full flex-1 width */}
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
                </>
              );
            })() : (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                {tr('dashboard.noExpenseData')}
              </div>
            )}
          </div>

          {/* Top 3 Highest Expenses */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-6">Top 3 Expenses</h2>
            <div className="space-y-3">
              {top3Expenses.length > 0 ? (
                top3Expenses.map((transaction, idx) => {
                  const { icon: Icon, bg, text } = getCategoryConfig(transaction.category);
                  return (
                    <button
                      key={transaction.id}
                      onClick={() => setEditingTransaction(transaction)}
                      className="w-full flex items-center gap-4 rounded-lg hover:bg-muted transition-colors px-2 py-2 -mx-2 text-left"
                    >
                      <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">#{idx + 1}</span>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon className={`w-5 h-5 ${text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">{tCategory(transaction.category)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-red-500">-{formatAmount(transaction.amount)}</p>
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