import { Calendar } from 'lucide-react';

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
}: TransactionFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Type Filter Chips */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">Filter by Type</label>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => onTypeChange('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors text-sm ${
              selectedType === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onTypeChange('income')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors text-sm ${
              selectedType === 'income'
                ? 'bg-emerald-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Income
          </button>
          <button
            onClick={() => onTypeChange('expense')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors text-sm ${
              selectedType === 'expense'
                ? 'bg-red-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Expense
          </button>
        </div>
      </div>

      {/* Category and Date Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Category Filter */}
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          >
            <option value="all">All Categories</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Month Filter */}
        <div className="flex-1">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Time Period</label>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground hidden sm:block" />
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="flex-1 px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            >
              <option value="all">All time</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
