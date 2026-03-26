import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router';
import { useTransactions } from '../context/TransactionContext';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { TransactionFilters } from '../components/TransactionFilters';
import { getAvailableMonths, filterTransactionsByMonth } from '../utils/dateUtils';
import { useCurrency } from '../context/CurrencyContext';
import { useBudgets } from '../context/BudgetContext';
import { getCategoryConfig } from '../utils/categoryConfig';
import { useLanguage } from '../context/LanguageContext';

const RADIAN = Math.PI / 180;

function renderPieLabel({ cx, cy, midAngle, outerRadius, percent, name }: {
  cx: number; cy: number; midAngle: number; outerRadius: number; percent: number; name: string;
}) {
  if (percent < 0.04) return null;
  const radius = outerRadius + 48;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const { icon: Icon, hex } = getCategoryConfig(name);
  const size = 21;
  return (
    <g>
      <foreignObject x={x - size / 2} y={y - size - 1} width={size} height={size} style={{ overflow: 'visible' }}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
          <Icon style={{ width: size, height: size, color: hex }} />
        </div>
      </foreignObject>
      <text x={x} y={y + 17} textAnchor="middle" fill={hex} fontSize={16} fontWeight={500}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
}

export function Dashboard() {
  const { transactions } = useTransactions();
  const { formatAmount } = useCurrency();
  const { budgets } = useBudgets();
  const { t: tr, tCategory } = useLanguage();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<import('../context/TransactionContext').Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

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

  const categoryTotals = useMemo(
    () =>
      Object.entries(
        monthFilteredTransactions.reduce((acc, transaction) => {
          acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
          return acc;
        }, {} as Record<string, number>),
      )
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total),
    [monthFilteredTransactions],
  );

  // Recent transactions (last 5) from month-filtered transactions
  const recentTransactions = monthFilteredTransactions.slice(0, 5);

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
              <h1 className="font-semibold mb-1">{tr('dashboard.title')}</h1>
              <p className="text-sm text-muted-foreground">
                {tr('dashboard.subtitle')}
              </p>
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
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* Total Income */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{tr('dashboard.totalIncome')}</p>
              <p className="text-3xl font-semibold text-emerald-600">
                {formatAmount(totalIncome)}
              </p>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{tr('dashboard.totalExpenses')}</p>
              <p className="text-3xl font-semibold text-red-500">
                {formatAmount(totalExpenses)}
              </p>
            </div>
          </div>

          {/* Current Balance */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{tr('dashboard.currentBalance')}</p>
              <p className={`text-3xl font-semibold ${balance >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                {formatAmount(balance)}
              </p>
            </div>
          </div>
        </div>

        {/* Chart and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Expenses by Category Chart */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-6">{tr('dashboard.expensesByCategory')}</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryConfig(entry.name).hex} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatAmount(value)}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {tr('dashboard.noExpenseData')}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold mb-3">{tr('dashboard.totalByCategory')}</h3>
              {categoryTotals.length > 0 ? (
                <div className="space-y-1">
                  {categoryTotals.map(({ category, total }) => {
                    const { icon: Icon, bg, text } = getCategoryConfig(category);
                    const budget = budgets[category];
                    const hasBudget = budget != null && budget > 0;
                    const isOverBudget = hasBudget && total >= budget;
                    const amountColor = hasBudget
                      ? isOverBudget ? 'text-red-500' : 'text-emerald-600'
                      : 'text-foreground';
                    return (
                      <button
                        key={category}
                        onClick={() => handleCategoryDrilldown(category)}
                        className="w-full flex items-center gap-4 rounded-lg hover:bg-muted transition-colors px-2 py-1 -mx-2 text-left"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                          <Icon className={`w-5 h-5 ${text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{tCategory(category)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-semibold text-sm ${amountColor}`}>
                            {formatAmount(total)}
                          </p>
                          {hasBudget && (
                            <p className="text-xs text-muted-foreground">
                              {tr('dashboard.of')} {formatAmount(budget)}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{tr('dashboard.noCategoryTotals')}</p>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-6">{tr('dashboard.recentTransactions')}</h2>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => {
                  const { icon: Icon, bg, text } = getCategoryConfig(transaction.category);
                  return (
                    <button
                      key={transaction.id}
                      onClick={() => setEditingTransaction(transaction)}
                      className="w-full flex items-center gap-4 rounded-lg hover:bg-muted transition-colors px-2 py-1 -mx-2 text-left"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon className={`w-5 h-5 ${text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">{tCategory(transaction.category)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-semibold ${
                          transaction.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatAmount(transaction.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {tr('dashboard.noTransactions')}
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