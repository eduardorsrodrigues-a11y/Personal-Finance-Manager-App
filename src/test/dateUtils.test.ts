import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { filterTransactionsByMonth, formatPeriodLabel } from '../app/utils/dateUtils';
import type { Transaction } from '../app/context/TransactionContext';

function tx(date: string, id = date): Transaction {
  return { id, type: 'expense', amount: 10, description: 'test', date, category: 'Food' };
}

const TRANSACTIONS: Transaction[] = [
  tx('2025-01-15'),
  tx('2025-06-20'),
  tx('2025-12-31'),
  tx('2024-03-10'),
];

describe('filterTransactionsByMonth', () => {
  it('returns all transactions for "all"', () => {
    expect(filterTransactionsByMonth(TRANSACTIONS, 'all')).toHaveLength(4);
  });

  it('returns all transactions for empty string', () => {
    expect(filterTransactionsByMonth(TRANSACTIONS, '')).toHaveLength(4);
  });

  it('filters to current year for "this-year"', () => {
    // Mock current date to 2025
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-07-01'));
    const result = filterTransactionsByMonth(TRANSACTIONS, 'this-year');
    expect(result.map(t => t.id)).toEqual(['2025-01-15', '2025-06-20', '2025-12-31']);
    vi.useRealTimers();
  });

  it('filters to current month for "this-month"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-10'));
    const result = filterTransactionsByMonth(TRANSACTIONS, 'this-month');
    expect(result.map(t => t.id)).toEqual(['2025-06-20']);
    vi.useRealTimers();
  });

  it('returns empty array when no transactions match this-month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01'));
    const result = filterTransactionsByMonth(TRANSACTIONS, 'this-month');
    expect(result).toHaveLength(0);
    vi.useRealTimers();
  });

  it('filters by custom date range', () => {
    const result = filterTransactionsByMonth(TRANSACTIONS, 'custom:2025-01-01:2025-06-30');
    expect(result.map(t => t.id)).toEqual(['2025-01-15', '2025-06-20']);
  });

  it('custom range end date is inclusive (end of day)', () => {
    const result = filterTransactionsByMonth(TRANSACTIONS, 'custom:2025-06-20:2025-06-20');
    expect(result.map(t => t.id)).toEqual(['2025-06-20']);
  });

  it('returns empty array for empty input', () => {
    expect(filterTransactionsByMonth([], 'all')).toHaveLength(0);
    expect(filterTransactionsByMonth([], 'this-month')).toHaveLength(0);
  });
});

describe('formatPeriodLabel', () => {
  it('labels known periods', () => {
    expect(formatPeriodLabel('all')).toBe('All time');
    expect(formatPeriodLabel('')).toBe('All time');
    expect(formatPeriodLabel('this-year')).toBe('This year');
    expect(formatPeriodLabel('this-month')).toBe('This month');
  });

  it('formats custom range label', () => {
    const label = formatPeriodLabel('custom:2025-01-01:2025-03-31');
    expect(label).toContain('Jan');
    expect(label).toContain('Mar');
  });

  it('returns raw string for unrecognised period', () => {
    expect(formatPeriodLabel('January 2025')).toBe('January 2025');
  });
});
