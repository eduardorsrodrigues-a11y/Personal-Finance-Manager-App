/**
 * Pure money math for Shared Expenses. Shared by the API and the client.
 * All arithmetic is done in integer cents to avoid floating-point drift.
 */

export const toCents = (n: number): number => Math.round(n * 100);
export const fromCents = (c: number): number => c / 100;

/**
 * Splits `total` equally between `memberIds`. Leftover cents go to the first
 * members in order, so the parts always add up exactly to the total.
 */
export function equalSplit(total: number, memberIds: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  if (memberIds.length === 0) return result;
  const totalCents = toCents(total);
  const base = Math.floor(totalCents / memberIds.length);
  let remainder = totalCents - base * memberIds.length;
  for (const id of memberIds) {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    result[id] = fromCents(base + extra);
  }
  return result;
}

export type BalanceExpense = {
  amount: number;
  paidBy: string;
  splits: Array<{ memberId: string; amount: number }>;
};

/**
 * Net balance per member: positive means the group owes them money,
 * negative means they owe the group.
 *
 * For an expense the payer is credited the full amount and every member is
 * debited their share. A settlement (payer → recipient) uses the same rule:
 * the payer is credited and the recipient (sole split) is debited.
 */
export function computeBalances(memberIds: string[], expenses: BalanceExpense[]): Record<string, number> {
  const cents: Record<string, number> = {};
  for (const id of memberIds) cents[id] = 0;
  for (const e of expenses) {
    cents[e.paidBy] = (cents[e.paidBy] ?? 0) + toCents(e.amount);
    for (const s of e.splits) {
      cents[s.memberId] = (cents[s.memberId] ?? 0) - toCents(s.amount);
    }
  }
  const result: Record<string, number> = {};
  for (const [id, c] of Object.entries(cents)) result[id] = fromCents(c);
  return result;
}

export type Debt = { from: string; to: string; amount: number };

/**
 * Turns net balances into a short list of "X pays Y" transfers by greedily
 * matching the largest debtor with the largest creditor.
 */
export function simplifyDebts(balances: Record<string, number>): Debt[] {
  const debtors: Array<{ id: string; c: number }> = [];
  const creditors: Array<{ id: string; c: number }> = [];
  for (const [id, amount] of Object.entries(balances)) {
    const c = toCents(amount);
    if (c < 0) debtors.push({ id, c: -c });
    else if (c > 0) creditors.push({ id, c });
  }
  debtors.sort((a, b) => b.c - a.c);
  creditors.sort((a, b) => b.c - a.c);

  const debts: Debt[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].c, creditors[j].c);
    debts.push({ from: debtors[i].id, to: creditors[j].id, amount: fromCents(pay) });
    debtors[i].c -= pay;
    creditors[j].c -= pay;
    if (debtors[i].c === 0) i++;
    if (creditors[j].c === 0) j++;
  }
  return debts;
}

/** True when the split amounts add up exactly (to the cent) to the total. */
export function splitsMatchTotal(total: number, splitAmounts: number[]): boolean {
  return splitAmounts.reduce((sum, a) => sum + toCents(a), 0) === toCents(total);
}
