import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, Trash2, ShoppingCart } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Transaction, useTransactions } from '../context/TransactionContext';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { getAvailableMonths, filterTransactionsByMonth } from '../utils/dateUtils';
import { useCurrency } from '../context/CurrencyContext';
import { getCategoryConfig } from '../utils/categoryConfig';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

type FilterType = 'all' | 'income' | 'expense';

export function TransactionHistory() {
  const { transactions, deleteTransaction } = useTransactions();
  const { formatAmount } = useCurrency();
  const { t, tCategory } = useLanguage();
  const { showToast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
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
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 'N' keyboard shortcut → open new transaction modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setModalMode('add');
        setEditingTransaction(null);
        setIsModalOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;
      if (delta > 4 && y > 80) {
        setIsHidden(true);
      } else if (delta < -4) {
        setIsHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setSelectedMonth(initialMonthParam || 'all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMonthParam]);

  useEffect(() => {
    setSelectedCategory(initialCategoryParam || 'all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategoryParam]);

  const availableMonths = useMemo(() => getAvailableMonths(transactions), [transactions]);

  const availableCategories = useMemo(() => {
    const cats = new Set(transactions.map(tx => tx.category));
    return Array.from(cats).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter((tx) => {
      const matchesFilter = filter === 'all' || tx.type === filter;
      const matchesSearch =
        searchQuery === '' ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tx => tx.category === selectedCategory);
    }
    return filtered;
  }, [transactions, filter, searchQuery, selectedCategory]);

  const filteredByMonthTransactions = useMemo(
    () => filterTransactionsByMonth(filteredTransactions, selectedMonth),
    [filteredTransactions, selectedMonth],
  );

  const groupedTransactions = filteredByMonthTransactions.reduce((acc, tx) => {
    const date = new Date(tx.date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, typeof filteredTransactions>);

  const openAdd = () => {
    setModalMode('add');
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const typeButtonClass = (ft: FilterType) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
      filter === ft
        ? ft === 'income'
          ? 'bg-emerald-500 text-white'
          : ft === 'expense'
          ? 'bg-red-500 text-white'
          : 'bg-primary text-primary-foreground'
        : 'bg-muted text-muted-foreground'
    }`;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky header ── */}
      <header className={`border-b border-border bg-card sticky top-14 lg:top-0 z-40 transition-transform duration-300 ease-in-out ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="px-4 lg:px-8 py-3 lg:py-5">
          {/* Title + Add */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-semibold">{t('transactions.title')}</h1>
            <button
              onClick={openAdd}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('transactions.addTransaction')}</span>
            </button>
          </div>

          {/* Search + type pills */}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('transactions.searchPlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-sm bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-1.5 shrink-0">
              {(['all', 'income', 'expense'] as FilterType[]).map((ft) => (
                <button key={ft} onClick={() => setFilter(ft)} className={typeButtonClass(ft)}>
                  {ft === 'all' ? t('transactions.all') : ft === 'income' ? t('transactions.income') : t('transactions.expense')}
                </button>
              ))}
            </div>
            {/* Desktop: selects inline */}
            <div className="hidden lg:flex gap-2 shrink-0">
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-input-background rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="all">{t('transactions.allCategories')}</option>
                {availableCategories.map(c => <option key={c} value={c}>{tCategory(c)}</option>)}
              </select>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 bg-input-background rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="all">{t('transactions.allTime')}</option>
                <option value="this-year">This year</option>
                {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Mobile: Category + Time */}
          <div className="grid grid-cols-2 gap-2 lg:hidden">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-input-background rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="all">{t('transactions.allCategories')}</option>
              {availableCategories.map(c => <option key={c} value={c}>{tCategory(c)}</option>)}
            </select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 bg-input-background rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="all">{t('transactions.allTime')}</option>
              <option value="this-year">This year</option>
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* ── Transaction list ── */}
      <div className="px-4 lg:px-8 py-6 lg:py-8">
        {Object.keys(groupedTransactions).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
              <div key={date}>
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">{date}</h3>
                </div>
                <div className="bg-card border border-border rounded-xl divide-y divide-border">
                  {dateTransactions.map((transaction) => {
                    const { icon: Icon, bg, text } = getCategoryConfig(transaction.category);
                    return (
                      <div
                        key={transaction.id}
                        className="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setModalMode('edit');
                          setEditingTransaction(transaction);
                          setIsModalOpen(true);
                        }}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                          <Icon className={`w-4 h-4 ${text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">{tCategory(transaction.category)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className={`font-semibold text-sm ${
                            transaction.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingDelete(transaction);
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
            <h3 className="font-semibold mb-2">{t('transactions.noTransactions')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? t('transactions.adjustFilters') : t('transactions.startAdding')}
            </p>
            {!searchQuery && (
              <button
                onClick={openAdd}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t('transactions.addTransaction')}
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

      <DeleteConfirmationModal
        isOpen={pendingDelete !== null}
        description={pendingDelete?.description ?? ''}
        amount={pendingDelete?.amount ?? 0}
        category={pendingDelete?.category ?? ''}
        type={pendingDelete?.type ?? 'expense'}
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) {
            await deleteTransaction(pendingDelete.id);
            showToast(t('delete.toast'));
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
