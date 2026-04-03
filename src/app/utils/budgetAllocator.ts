export type HousingSituation = 'renting' | 'mortgage' | 'family' | 'rent-free';
export type Dependents = 'none' | '1-2' | '3+';
export type DebtLevel = 'none' | 'very-little' | 'manageable' | 'high';
export type FinancialGoal = 'emergency-fund' | 'paying-debt' | 'investing' | 'wealth-building' | 'tracking';

export interface AllocatorInputs {
  income: number;
  housing: number;
  utilities: number;
  health: number;
  gym: number;
  housingSituation: HousingSituation;
  dependents: Dependents;
  debt: DebtLevel;
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
  needsPct: number;
  wantsPct: number;
  futurePct: number;
  income: number;
  error?: string;
}

export const FIXED_CATEGORIES = new Set(['Housing', 'Utilities', 'Health', 'Gym & Sports']);

// Display order for the reveal
export const NEEDS_CATEGORIES = ['Housing', 'Utilities', 'Health', 'Groceries', 'Transportation', 'Family & Personal'];
export const WANTS_CATEGORIES = ['Food', 'Shopping', 'Entertainment', 'Travel', 'Gifts', 'Gym & Sports', 'Other'];

const NEEDS_FLUID_WEIGHTS: Record<string, number> = {
  Groceries: 0.4,
  Transportation: 0.4,
  'Family & Personal': 0.2,
};

const WANTS_FLUID_WEIGHTS: Record<string, number> = {
  Food: 0.3,
  Shopping: 0.2,
  Entertainment: 0.2,
  Travel: 0.1,
  Gifts: 0.1,
  Other: 0.1,
};

export function computeBudget(inputs: AllocatorInputs): AllocatorResult {
  const { income, housing, utilities, health, gym, housingSituation, dependents, debt, goal } = inputs;

  // Phase 1: Validation
  const totalFixed = housing + utilities + health + gym;
  if (totalFixed > income) {
    return {
      allocations: [], savings: 0, savingsPct: 0, savingsLevel: 'low',
      needsPct: 50, wantsPct: 30, futurePct: 20, income,
      error: `Your fixed monthly contracts (${totalFixed.toFixed(2)}) exceed your take-home pay (${income.toFixed(2)}). Please review and adjust your fixed amounts to continue.`,
    };
  }

  // Phase 2: Macro allocation — 50/30/20 baseline + modifiers
  let needsPct = 50, wantsPct = 30, futurePct = 20;

  if (housingSituation === 'rent-free') { needsPct -= 15; wantsPct += 5; futurePct += 10; }
  if (dependents === '1-2')             { needsPct += 10; wantsPct -= 5; futurePct -= 5; }
  else if (dependents === '3+')         { needsPct += 15; wantsPct -= 10; futurePct -= 5; }
  if (debt === 'high')                  { wantsPct -= 10; futurePct += 10; }
  if (goal === 'tracking')              { needsPct += 15; wantsPct -= 10; futurePct -= 5; }
  else if (goal === 'emergency-fund')   { wantsPct -= 5; futurePct += 5; }

  // Clamp & normalize to 100
  needsPct = Math.max(0, needsPct);
  wantsPct = Math.max(0, wantsPct);
  futurePct = Math.max(0, futurePct);
  const macroSum = needsPct + wantsPct + futurePct;
  needsPct = (needsPct / macroSum) * 100;
  wantsPct = (wantsPct / macroSum) * 100;
  futurePct = (futurePct / macroSum) * 100;

  let needsBudget = income * (needsPct / 100);
  let wantsBudget = income * (wantsPct / 100);
  const futureBudget = income * (futurePct / 100);

  // Phase 3A: Needs bucket
  const fixedNeedsTotal = housing + utilities + health;
  let remainingNeeds = needsBudget - fixedNeedsTotal;
  if (remainingNeeds < 0) {
    wantsBudget += remainingNeeds; // borrow deficit from wants
    remainingNeeds = 0;
  }

  const allocMap: Record<string, CategoryAllocation> = {};

  allocMap['Housing']   = { category: 'Housing',   amount: housing,   pct: p(housing,   income), fixed: true,  bucket: 'needs' };
  allocMap['Utilities'] = { category: 'Utilities', amount: utilities, pct: p(utilities, income), fixed: true,  bucket: 'needs' };
  allocMap['Health']    = { category: 'Health',    amount: health,    pct: p(health,    income), fixed: true,  bucket: 'needs' };

  for (const [cat, w] of Object.entries(NEEDS_FLUID_WEIGHTS)) {
    const amount = Math.max(0, Math.round(remainingNeeds * w));
    allocMap[cat] = { category: cat, amount, pct: p(amount, income), fixed: false, bucket: 'needs' };
  }

  // Phase 3B: Wants bucket
  const remainingWants = Math.max(0, wantsBudget - gym);
  allocMap['Gym & Sports'] = { category: 'Gym & Sports', amount: gym, pct: p(gym, income), fixed: true, bucket: 'wants' };

  for (const [cat, w] of Object.entries(WANTS_FLUID_WEIGHTS)) {
    const amount = Math.max(0, Math.round(remainingWants * w));
    allocMap[cat] = { category: cat, amount, pct: p(amount, income), fixed: false, bucket: 'wants' };
  }

  const allocations: CategoryAllocation[] = [
    ...NEEDS_CATEGORIES.map(c => allocMap[c]).filter(Boolean),
    ...WANTS_CATEGORIES.map(c => allocMap[c]).filter(Boolean),
  ];

  // Phase 3C: Savings
  const savings = futureBudget;
  const savingsPct = income > 0 ? (savings / income) * 100 : 0;

  return {
    allocations,
    savings,
    savingsPct,
    savingsLevel: savingsPct >= 20 ? 'high' : savingsPct >= 10 ? 'medium' : 'low',
    needsPct, wantsPct, futurePct,
    income,
  };
}

function p(amount: number, income: number): number {
  return income > 0 ? (amount / income) * 100 : 0;
}

export function getBucketMap(allocations: CategoryAllocation[]): Record<string, 'needs' | 'wants'> {
  return Object.fromEntries(allocations.map(a => [a.category, a.bucket]));
}

// Phase 4: Smart readjustment engine
// Distributes the delta proportionally (by current allocation) across all
// eligible fluid categories below the changed one.
export function rebalance(
  amounts: Record<string, number>,
  changedCategory: string,
  newAmount: number,
  _bucketMap: Record<string, 'needs' | 'wants'>,
  belowCategories?: Set<string>,
): { updated: Record<string, number> } | null {
  const delta = newAmount - (amounts[changedCategory] ?? 0);
  if (Math.abs(delta) < 0.5) return null;

  // Eligible absorbers: fluid, non-zero, and within the allowed set
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

  // Each candidate absorbs its proportional share of the delta
  for (const cat of candidates) {
    const share = delta * (amounts[cat] / totalBase);
    updated[cat] = Math.max(0, updated[cat] - share);
  }

  return { updated };
}
