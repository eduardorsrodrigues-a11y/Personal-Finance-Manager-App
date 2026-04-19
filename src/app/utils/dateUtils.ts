import { Transaction } from '../context/TransactionContext';

export function getAvailableMonths(transactions: Transaction[]): string[] {
  const monthsSet = new Set<string>();
  
  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const monthYear = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
    monthsSet.add(monthYear);
  });

  // Convert to array and sort in descending order (most recent first)
  return Array.from(monthsSet).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB.getTime() - dateA.getTime();
  });
}

export function filterTransactionsByMonth(
  transactions: Transaction[],
  selectedMonth: string
): Transaction[] {
  if (!selectedMonth || selectedMonth === 'all') {
    return transactions;
  }

  if (selectedMonth === 'this-year') {
    const year = new Date().getFullYear();
    return transactions.filter((t) => new Date(t.date).getFullYear() === year);
  }

  if (selectedMonth === 'this-month') {
    const now = new Date();
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }

  if (selectedMonth.startsWith('custom:')) {
    const [, start, end] = selectedMonth.split(':');
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= startDate && d <= endDate;
    });
  }

  return transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    const monthYear = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
    return monthYear === selectedMonth;
  });
}

export function formatPeriodLabel(selectedMonth: string): string {
  if (!selectedMonth || selectedMonth === 'all') return 'All time';
  if (selectedMonth === 'this-year') return 'This year';
  if (selectedMonth === 'this-month') return 'This month';
  if (selectedMonth.startsWith('custom:')) {
    const [, start, end] = selectedMonth.split(':');
    const fmt = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  }
  return selectedMonth;
}

export function getCurrentMonthLabel(): string {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

export function getMonthYearFromDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });
}
