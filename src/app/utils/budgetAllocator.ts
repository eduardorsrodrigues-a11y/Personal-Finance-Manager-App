export type HousingSituation = 'renting' | 'mortgage' | 'family' | 'rent-free';
export type FinancialGoal = 'save' | 'tracking' | 'grow-portfolio' | 'pay-debt';

export interface AllocatorInputs {
  income: number;
  housing: number;
  utilities: number;
  health: number;
  groceries: number;
  debt: number;           // exact monthly amount
  housingSituation: HousingSituation;
  goal: FinancialGoal;
}

export interface CategoryAllocation {
  category: string;
  amount: number;
  pct: number;        // % of income
  fixed: boolean;     // locked floor — cannot be auto-reduced
  bucket: 'needs' | 'wants';
}

export interface AllocatorResult {
  allocations: CategoryAllocation[];
  savings: number;
  savingsPct: number;
  savingsLevel: 'high' | 'medium' | 'low';
  needsPct: number;     // recommended (60)
  wantsPct: number;     // recommended (20)
  futurePct: number;    // recommended (20)
  needsActual: number;  // sum of user-provided fixed inputs
  wantsPool: number;    // actual wants pool (income − needsActual, capped at 20%)
  income: number;
  error?: string;
}

export const FIXED_CATEGORIES = new Set(['Housing', 'Debt Payments', 'Utilities', 'Health', 'Groceries']);

// Display order
export const NEEDS_CATEGORIES = ['Housing', 'Debt Payments', 'Utilities', 'Health', 'Groceries'];
export const WANTS_CATEGORIES = ['Food', 'Shopping', 'Entertainment', 'Travel', 'Gifts', 'Gym & Sports', 'Transportation', 'Family & Personal', 'Other'];

export function computeBudget(inputs: AllocatorInputs): AllocatorResult {
  const { income, housing, utilities, health, groceries, debt } = inputs;

  // Phase 1: Validation
  const needsActual = housing + debt + utilities + health + groceries;
  if (needsActual > income) {
    return {
      allocations: [], savings: 0, savingsPct: 0, savingsLevel: 'low',
      needsPct: 60, wantsPct: 20, futurePct: 20,
      needsActual, wantsPool: 0, income,
      error: `Your fixed monthly expenses (${needsActual.toFixed(2)}) exceed your take-home pay (${income.toFixed(2)}). Please review and adjust your inputs to continue.`,
    };
  }

  // Phase 2: 60/20/20 recommended baseline (fixed, no modifiers)
  const needsPct = 60;
  const wantsPct = 20;
  const futurePct = 20;

  // Phase 3: Actual allocation
  // Wants pool is capped at 20% of income; whatever is left goes to savings
  const wantsPool = Math.min(income - needsActual, income * (wantsPct / 100));
  const savings = income - needsActual - wantsPool;
  const savingsPct = income > 0 ? (savings / income) * 100 : 0;

  // Fixed needs with exact user-provided amounts; wants all start at 0
  const allocMap: Record<string, CategoryAllocation> = {};
  allocMap['Housing']       = { category: 'Housing',       amount: housing,   pct: p(housing,   income), fixed: true,  bucket: 'needs' };
  allocMap['Debt Payments'] = { category: 'Debt Payments', amount: debt,      pct: p(debt,      income), fixed: true,  bucket: 'needs' };
  allocMap['Utilities']     = { category: 'Utilities',     amount: utilities, pct: p(utilities, income), fixed: true,  bucket: 'needs' };
  allocMap['Health']        = { category: 'Health',        amount: health,    pct: p(health,    income), fixed: true,  bucket: 'needs' };
  allocMap['Groceries']     = { category: 'Groceries',     amount: groceries, pct: p(groceries, income), fixed: true,  bucket: 'needs' };

  for (const cat of WANTS_CATEGORIES) {
    allocMap[cat] = { category: cat, amount: 0, pct: 0, fixed: false, bucket: 'wants' };
  }

  const allocations: CategoryAllocation[] = [
    ...NEEDS_CATEGORIES.map(c => allocMap[c]).filter(Boolean),
    ...WANTS_CATEGORIES.map(c => allocMap[c]).filter(Boolean),
  ];

  return {
    allocations,
    savings,
    savingsPct,
    savingsLevel: savingsPct >= 20 ? 'high' : savingsPct >= 10 ? 'medium' : 'low',
    needsPct, wantsPct, futurePct,
    needsActual, wantsPool,
    income,
  };
}

function p(amount: number, income: number): number {
  return income > 0 ? (amount / income) * 100 : 0;
}

export function getBucketMap(allocations: CategoryAllocation[]): Record<string, 'needs' | 'wants'> {
  return Object.fromEntries(allocations.map(a => [a.category, a.bucket]));
}

// Kept for potential external use; no longer used inside the wizard
export function rebalance(
  amounts: Record<string, number>,
  changedCategory: string,
  newAmount: number,
  _bucketMap: Record<string, 'needs' | 'wants'>,
  belowCategories?: Set<string>,
): { updated: Record<string, number> } | null {
  const delta = newAmount - (amounts[changedCategory] ?? 0);
  if (Math.abs(delta) < 0.5) return null;

  const candidates = Object.keys(amounts).filter(c =>
    c !== changedCategory &&
    !FIXED_CATEGORIES.has(c) &&
    amounts[c] > 0 &&
    (!belowCategories || belowCategories.has(c)),
  );

  if (candidates.length === 0) return null;

  const totalBase = candidates.reduce((s, c) => s + amounts[c], 0);
  if (totalBase === 0) return null;

  const updated = { ...amounts, [changedCategory]: newAmount };
  for (const cat of candidates) {
    const share = delta * (amounts[cat] / totalBase);
    updated[cat] = Math.round(Math.max(0, updated[cat] - share));
  }

  return { updated };
}
