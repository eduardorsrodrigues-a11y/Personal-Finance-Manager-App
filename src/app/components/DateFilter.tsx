import { Calendar } from 'lucide-react';

interface DateFilterProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
}

export function DateFilter({ selectedMonth, onMonthChange, availableMonths }: DateFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-5 h-5 text-muted-foreground hidden sm:block" />
      <select
        value={selectedMonth}
        onChange={(e) => onMonthChange(e.target.value)}
        className="px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
      >
        <option value="all">All time</option>
        {availableMonths.map((month) => (
          <option key={month} value={month}>
            {month}
          </option>
        ))}
      </select>
    </div>
  );
}
