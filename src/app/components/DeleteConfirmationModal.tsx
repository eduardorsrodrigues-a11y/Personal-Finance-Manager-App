import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
}

export function DeleteConfirmationModal({
  isOpen,
  onCancel,
  onConfirm,
  description,
  amount,
  category,
  type,
}: DeleteConfirmationModalProps) {
  const { t, tCategory } = useLanguage();
  const { formatAmount } = useCurrency();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  const sign = type === 'income' ? '+' : '-';
  const amountColor = type === 'income' ? 'text-emerald-600' : 'text-red-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-card rounded-xl shadow-lg w-full max-w-sm">
        {/* Icon + title */}
        <div className="flex flex-col items-center pt-8 pb-4 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="font-semibold text-lg">{t('delete.title')}</h2>
          <p className="text-sm text-muted-foreground mt-2">{t('delete.message')}</p>
        </div>

        {/* Transaction snippet */}
        <div className="mx-6 mb-6 px-4 py-3 bg-muted rounded-lg flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{description}</p>
            <p className="text-xs text-muted-foreground">{tCategory(category)}</p>
          </div>
          <span className={`font-semibold text-sm shrink-0 ${amountColor}`}>
            {sign}{formatAmount(amount)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            {t('delete.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isDeleting && (
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {t('delete.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
