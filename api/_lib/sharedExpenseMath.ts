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

/**
 * Custom split where some shares were typed by hand ("locked") and the rest
 * fill in automatically: whatever the locked shares leave of the total is split
 * equally between the remaining participants. `participantIds` sets the order
 * (leftover cents go to the first auto participants).
 *
 * Returns every participant's share plus the cents still unassigned: positive
 * when nobody is left to absorb the rest, negative when locked shares exceed
 * the total (auto participants then get 0).
 */
export function allocateCustomSplit(
  total: number,
  participantIds: string[],
  locked: Record<string, number>,
): { shares: Record<string, number>; remainingCents: number } {
  const shares: Record<string, number> = {};
  let lockedCents = 0;
  const autoIds: string[] = [];
  for (const id of participantIds) {
    if (id in locked) {
      const c = Math.max(0, toCents(locked[id]));
      shares[id] = fromCents(c);
      lockedCents += c;
    } else {
      autoIds.push(id);
    }
  }
  const leftCents = toCents(total) - lockedCents;
  if (autoIds.length === 0 || leftCents <= 0) {
    for (const id of autoIds) shares[id] = 0;
    return { shares, remainingCents: leftCents };
  }
  Object.assign(shares, equalSplit(fromCents(leftCents), autoIds));
  return { shares, remainingCents: 0 };
}

/** True when the split amounts add up exactly (to the cent) to the total. */
export function splitsMatchTotal(total: number, splitAmounts: number[]): boolean {
  return splitAmounts.reduce((sum, a) => sum + toCents(a), 0) === toCents(total);
}
