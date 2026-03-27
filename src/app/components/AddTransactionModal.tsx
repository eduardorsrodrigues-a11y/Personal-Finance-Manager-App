import React, { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Transaction, useTransactions } from '../context/TransactionContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { useToast } from '../context/ToastContext';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'add' | 'edit';
  initialTransaction?: Transaction | null;
}

const expenseCategories = ['Food', 'Groceries', 'Housing', 'Utilities', 'Transportation', 'Shopping', 'Health', 'Entertainment', 'Travel', 'Family & Personal', 'Gifts', 'Other'];
const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Business', 'RSUs', 'Cashback', 'Holiday Allowance', 'Meal Allowance', 'Other'];

export function AddTransactionModal({
  isOpen,
  onClose,
  mode = 'add',
  initialTransaction,
}: AddTransactionModalProps) {
  const { addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { currency } = useCurrency();
  const { t, tCategory } = useLanguage();
  const { showToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && initialTransaction) {
      setType(initialTransaction.type);
      setAmount(String(initialTransaction.amount));
      setDescription(initialTransaction.description);
      setDate(initialTransaction.date);
      setCategory(initialTransaction.category);
      return;
    }

    setType('expense');
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('');
  }, [isOpen, mode, initialTransaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || !description || !category || isSubmitting) return;

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!Number.isFinite(parsedAmount)) return;

    setIsSubmitting(true);
    try {
      if (mode === 'edit' && initialTransaction) {
        await updateTransaction(initialTransaction.id, { type, amount: parsedAmount, description, date, category });
        showToast(t('toasts.updated'));
      } else {
        await addTransaction({ type, amount: parsedAmount, description, date, category });
        showToast(t('toasts.added'));
      }
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-semibold">{mode === 'edit' ? t('modal.editTitle') : t('modal.addTitle')}</h2>
          <div className="flex items-center gap-2">
            {mode === 'edit' && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                aria-label={t('delete.title')}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategory(''); }}
              className={`flex-1 py-2 rounded-md transition-colors ${type === 'expense' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              {t('modal.expense')}
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategory(''); }}
              className={`flex-1 py-2 rounded-md transition-colors ${type === 'income' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              {t('modal.income')}
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm mb-2 text-muted-foreground">{t('modal.amount')}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">
                {currency.symbol}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 text-2xl bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm mb-2 text-muted-foreground">{t('modal.description')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('modal.enterDescription')}
              className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm mb-2 text-muted-foreground">{t('modal.date')}</label>
            <div className="overflow-hidden rounded-lg">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ WebkitAppearance: 'none', maxWidth: '100%', boxSizing: 'border-box' }}
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm mb-2 text-muted-foreground">{t('modal.category')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              <option value="">{t('modal.selectCategory')}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{tCategory(cat)}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${
              type === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {isSubmitting && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {mode === 'edit' ? t('modal.confirm') : t('modal.addTransaction')}
          </button>
        </form>
      </div>
      </div>
    </div>

    {mode === 'edit' && initialTransaction && (
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        description={initialTransaction.description}
        amount={initialTransaction.amount}
        category={initialTransaction.category}
        type={initialTransaction.type}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          await deleteTransaction(initialTransaction.id);
          showToast(t('delete.toast'));
          setShowDeleteConfirm(false);
          onClose();
        }}
      />
    )}
    </>
  );
}
