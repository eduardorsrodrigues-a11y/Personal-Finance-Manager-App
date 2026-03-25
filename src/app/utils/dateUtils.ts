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
  if (selectedMonth === 'all') {
    return transactions;
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

export function getMonthYearFromDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });
}
