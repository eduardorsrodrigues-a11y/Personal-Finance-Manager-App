import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Trash2, ShoppingCart, Home, Utensils, Car, Film, Heart, Zap, DollarSign } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Transaction, useTransactions } from '../context/TransactionContext';
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

export function TransactionHistory() {
  const { transactions, deleteTransaction } = useTransactions();
  const { formatAmount } = useCurrency();
  const [searchParams] = useSearchParams();
  const initialMonthParam = searchParams.get('month');
  const initialCategoryParam = searchParams.get('category');
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonthParam || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryParam || 'all');

  // Keep state in sync with URL query params (for Dashboard drilldown).
  useEffect(() => {
    setSelectedMonth(initialMonthParam || 'all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMonthParam]);

  useEffect(() => {
    setSelectedCategory(initialCategoryParam || 'all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategoryParam]);

  // Get available months and categories
  const availableMonths = useMemo(() => getAvailableMonths(transactions), [transactions]);
  
  const availableCategories = useMemo(() => {
    const categories = new Set(transactions.map(t => t.category));
    return Array.from(categories).sort();
  }, [transactions]);

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction) => {
      const matchesFilter = filter === 'all' || transaction.type === filter;
      const matchesSearch =
        searchQuery === '' ||
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    return filtered;
  }, [transactions, filter, searchQuery, selectedCategory]);

  // Filter transactions by month
  const filteredByMonthTransactions = useMemo(() => {
    return filterTransactionsByMonth(filteredTransactions, selectedMonth);
  }, [filteredTransactions, selectedMonth]);

  // Group by date
  const groupedTransactions = filteredByMonthTransactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, typeof filteredTransactions>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="px-4 lg:px-8 py-4 lg:py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-semibold mb-1">Transaction History</h1>
              <p className="text-sm text-muted-foreground">
                View and manage all your transactions
              </p>
            </div>
            <button
              onClick={() => {
                setModalMode('add');
                setEditingTransaction(null);
                setIsModalOpen(true);
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Transaction</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-10 pr-4 py-2.5 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Filters */}
          <TransactionFilters
            selectedType={filter}
            onTypeChange={setFilter}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            availableMonths={availableMonths}
            availableCategories={availableCategories}
          />
        </div>
      </header>

      {/* Transaction List */}
      <div className="px-4 lg:px-8 py-6 lg:py-8">
        {Object.keys(groupedTransactions).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">{date}</h3>
                </div>

                {/* Transactions */}
                <div className="bg-card border border-border rounded-xl divide-y divide-border">
                  {dateTransactions.map((transaction) => {
                    const Icon = categoryIcons[transaction.category] || ShoppingCart;
                    return (
                      <div
                        key={transaction.id}
                    className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors group cursor-pointer"
                    onClick={() => {
                      setModalMode('edit');
                      setEditingTransaction(transaction);
                      setIsModalOpen(true);
                    }}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            transaction.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{transaction.category}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <p
                              className={`font-semibold ${
                                transaction.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                              }`}
                            >
                              {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void deleteTransaction(transaction.id);
                            }}
                            className="transition-colors text-muted-foreground hover:text-destructive p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No transactions found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first transaction'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  setModalMode('add');
                  setEditingTransaction(null);
                  setIsModalOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Transaction
              </button>
            )}
          </div>
        )}
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        initialTransaction={editingTransaction}
      />
    </div>
  );
}