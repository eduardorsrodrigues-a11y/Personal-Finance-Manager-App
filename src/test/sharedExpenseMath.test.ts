import { describe, it, expect } from 'vitest';
import { equalSplit, computeBalances, simplifyDebts, splitsMatchTotal, allocateCustomSplit } from '../../api/_lib/sharedExpenseMath.js';

describe('equalSplit', () => {
  it('splits evenly when divisible', () => {
    expect(equalSplit(90, ['a', 'b', 'c'])).toEqual({ a: 30, b: 30, c: 30 });
  });

  it('distributes leftover cents to the first members', () => {
    const r = equalSplit(100, ['a', 'b', 'c']);
    expect(r).toEqual({ a: 33.34, b: 33.33, c: 33.33 });
    expect(splitsMatchTotal(100, Object.values(r))).toBe(true);
  });

  it('handles awkward decimals', () => {
    const r = equalSplit(10.01, ['a', 'b']);
    expect(r).toEqual({ a: 5.01, b: 5 });
  });

  it('returns empty for no members', () => {
    expect(equalSplit(10, [])).toEqual({});
  });
});

describe('computeBalances', () => {
  it('credits the payer and debits each share', () => {
    const b = computeBalances(['a', 'b', 'c'], [
      { amount: 90, paidBy: 'a', splits: [{ memberId: 'a', amount: 30 }, { memberId: 'b', amount: 30 }, { memberId: 'c', amount: 30 }] },
    ]);
    expect(b).toEqual({ a: 60, b: -30, c: -30 });
  });

  it('nets multiple expenses and settlements to zero overall', () => {
    const b = computeBalances(['a', 'b'], [
      { amount: 50, paidBy: 'a', splits: [{ memberId: 'a', amount: 25 }, { memberId: 'b', amount: 25 }] },
      // b pays a back 25 (settlement)
      { amount: 25, paidBy: 'b', splits: [{ memberId: 'a', amount: 25 }] },
    ]);
    expect(b).toEqual({ a: 0, b: 0 });
  });

  it('supports uneven custom splits', () => {
    const b = computeBalances(['a', 'b'], [
      { amount: 100, paidBy: 'b', splits: [{ memberId: 'a', amount: 70 }, { memberId: 'b', amount: 30 }] },
    ]);
    expect(b).toEqual({ a: -70, b: 70 });
  });
});

describe('allocateCustomSplit', () => {
  it('splits equally when nothing is locked', () => {
    expect(allocateCustomSplit(90, ['a', 'b', 'c'], {})).toEqual({ shares: { a: 30, b: 30, c: 30 }, remainingCents: 0 });
  });

  it('spreads what is left over the untouched participants', () => {
    const r = allocateCustomSplit(100, ['a', 'b', 'c'], { a: 50 });
    expect(r).toEqual({ shares: { a: 50, b: 25, c: 25 }, remainingCents: 0 });
  });

  it('keeps the total exact with leftover cents', () => {
    const r = allocateCustomSplit(100, ['a', 'b', 'c', 'd'], { a: 0.01 });
    expect(r.remainingCents).toBe(0);
    expect(splitsMatchTotal(100, Object.values(r.shares))).toBe(true);
  });

  it('reports unassigned cents when everyone is locked', () => {
    expect(allocateCustomSplit(100, ['a', 'b'], { a: 30, b: 40 }).remainingCents).toBe(3000);
  });

  it('reports overflow and zeroes auto participants when locked exceed total', () => {
    expect(allocateCustomSplit(50, ['a', 'b'], { a: 60 })).toEqual({ shares: { a: 60, b: 0 }, remainingCents: -1000 });
  });

  it('gives auto participants 0 when locked shares use up the total', () => {
    expect(allocateCustomSplit(50, ['a', 'b'], { a: 50 })).toEqual({ shares: { a: 50, b: 0 }, remainingCents: 0 });
  });
});

describe('simplifyDebts', () => {
  it('returns no debts when settled', () => {
    expect(simplifyDebts({ a: 0, b: 0 })).toEqual([]);
  });

  it('matches debtors to creditors', () => {
    const debts = simplifyDebts({ a: 60, b: -30, c: -30 });
    expect(debts).toHaveLength(2);
    expect(debts).toEqual(expect.arrayContaining([
      { from: 'b', to: 'a', amount: 30 },
      { from: 'c', to: 'a', amount: 30 },
    ]));
  });

  it('handles chains with multiple creditors', () => {
    const debts = simplifyDebts({ a: 40, b: 10, c: -50 });
    expect(debts).toEqual([
      { from: 'c', to: 'a', amount: 40 },
      { from: 'c', to: 'b', amount: 10 },
    ]);
  });
});
