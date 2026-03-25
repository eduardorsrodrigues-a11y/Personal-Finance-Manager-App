import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Plus, ShoppingCart, Home, Utensils, Car, Film, Heart, Zap, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTransactions } from '../context/TransactionContext';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { TransactionFilters } from '../components/TransactionFilters';
import { getAvailableMonths, filterTransactionsByMonth } from '../utils/dateUtils';
import { useCurrency } from '../context/CurrencyContext';

type FilterType = 'all' | 'income' | 'expense';

const categoryIcons: Record<string, any> = {
  Food: Utensils,
  Housing: Home,
  Utilities: Zap,
  Transportation: Car,
  Shopping: ShoppingCart,
  Health: Heart,
  Entertainment: Film,
  Salary: DollarSign,
  Freelance: DollarSign,
  Investment: DollarSign,
  Business: DollarSign,
  Other: ShoppingCart,
};

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6'];

export function Dashboard() {
  const { transactions } = useTransactions();
  const { formatAmount } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get available months and categories for filters
  const availableMonths = useMemo(() => getAvailableMonths(transactions), [transactions]);
  
  const availableCategories = useMemo(() => {
    const categories = new Set(transactions.map(t => t.category));
    return Array.from(categories).sort();
  }, [transactions]);

  // Filter transactions by selected month, type, and category
  const filteredTransactions = useMemo(() => {
    let filtered = filterTransactionsByMonth(transactions, selectedMonth);
    
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    return filtered;
  }, [transactions, selectedMonth, filterType, selectedCategory]);

  // Calculate totals from filtered transactions
  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Calculate expenses by category from filtered transactions
  const expensesByCategory = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  // Recent transactions (last 5) from filtered transactions
  const recentTransactions = filteredTransactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="px-4 lg:px-8 py-4 lg:py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-semibold mb-1">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back! Here's your financial overview.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Transaction</span>
            </button>
          </div>
          
          {/* Filters */}
          <TransactionFilters
            selectedType={filterType}
            onTypeChange={setFilterType}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            availableMonths={availableMonths}
            availableCategories={availableCategories}
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
              <p className="text-sm text-muted-foreground mb-1">Total Income</p>
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
              <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
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
              <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
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
            <h2 className="font-semibold mb-6">Expenses by Category</h2>
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
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `$${value.toFixed(2)}`}
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
                No expense data available
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-6">Recent Transactions</h2>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => {
                  const Icon = categoryIcons[transaction.category] || ShoppingCart;
                  return (
                    <div key={transaction.id} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">{transaction.category}</p>
                      </div>
                      <div className="text-right">
                      <p
  className={`font-semibold ${
    transaction.type === 'income' ? 'text-emerald-600' : 'text-red-500'
  }`}
>
  {transaction.type === 'income' ? '+' : '-'}
  {formatAmount(transaction.amount)}
</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No transactions yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}