import { Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

type FilterType = 'all' | 'income' | 'expense';

interface TransactionFiltersProps {
  selectedType: FilterType;
  onTypeChange: (type: FilterType) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
  availableCategories: string[];
  showTypeFilter?: boolean;
  showCategoryFilter?: boolean;
}

export function TransactionFilters({
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  selectedMonth,
  onMonthChange,
  availableMonths,
  availableCategories,
  showTypeFilter = true,
  showCategoryFilter = true,
}: TransactionFiltersProps) {
  const { t, tCategory } = useLanguage();

  return (
    <div className="space-y-4">
      {showTypeFilter && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('transactions.filterByType')}</label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onTypeChange('all')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors text-sm ${selectedType === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {t('transactions.all')}
            </button>
            <button
              onClick={() => onTypeChange('income')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors text-sm ${selectedType === 'income' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {t('transactions.income')}
            </button>
            <button
              onClick={() => onTypeChange('expense')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors text-sm ${selectedType === 'expense' ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {t('transactions.expense')}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {showCategoryFilter && (
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('transactions.category')}</label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            >
              <option value="all">{t('transactions.allCategories')}</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>{tCategory(category)}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('transactions.timePeriod')}</label>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground hidden sm:block" />
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="flex-1 px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            >
              <option value="all">{t('transactions.allTime')}</option>
              <option value="this-year">This year</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
