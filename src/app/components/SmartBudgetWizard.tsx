import { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, TrendingUp } from 'lucide-react';
import { useBudgets } from '../context/BudgetContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { getCategoryConfig } from '../utils/categoryConfig';
import {
  computeBudget, FIXED_CATEGORIES,
  NEEDS_CATEGORIES, WANTS_CATEGORIES,
  type AllocatorInputs, type HousingSituation, type FinancialGoal, type AllocatorResult,
} from '../utils/budgetAllocator';

export const SMART_BUDGET_KEY = 'mmm_smart_budget';

export interface SmartBudgetStored {
  result: AllocatorResult;
  amounts: Record<string, number>;
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 'loading' | 'macro' | 'micro';

interface WizardData {
  income: string;
  housingSituation: '' | HousingSituation;
  housingAmount: string;
  hasDebt: '' | 'yes' | 'no';
  debtAmount: string;
  utilities: string;
  health: string;
  groceries: string;
  goal: '' | FinancialGoal;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialReveal?: SmartBudgetStored;
}

const SLIDER_STEP = 25;
const TICK_EVERY  = 100;

function snapToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function OptionCard({ label, description, selected, onClick }: {
  label: string; description?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
        selected ? 'border-teal-500 bg-teal-500/5' : 'border-border hover:border-teal-300'
      }`}
    >
      <p className="text-sm font-medium">{label}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </button>
  );
}

function FixedInput({ label, symbol, value, onChange, placeholder = '0' }: {
  label: string; symbol: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">{symbol}</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="no-spin w-full pl-7 pr-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}

export function SmartBudgetWizard({ isOpen, onClose, initialReveal }: Props) {
  const { setBudgetsAll } = useBudgets();
  const { currency, formatAmount } = useCurrency();
  const { tCategory } = useLanguage();
  const { showToast } = useToast();

  const [step, setStep] = useState<WizardStep>(1);
  const [computeError, setComputeError] = useState('');
  const [result, setResult] = useState<AllocatorResult | null>(null);
  const [applying, setApplying] = useState(false);

  // Macro screen state
  const [macroWantsPct, setMacroWantsPct] = useState(20);

  // Micro screen state
  const [wantsPool, setWantsPool] = useState(0);
  const [fixedAmounts, setFixedAmounts] = useState<Record<string, number>>({});
  const [microAmounts, setMicroAmounts] = useState<Record<string, number>>({});

  const isReadjustRef = useRef(false);

  const [data, setData] = useState<WizardData>({
    income: '', housingSituation: '', housingAmount: '',
    hasDebt: '', debtAmount: '',
    utilities: '', health: '', groceries: '', goal: '',
  });

  const initialRevealRef = useRef(initialReveal);
  initialRevealRef.current = initialReveal;

  // Enter key → Next / Continue / Apply
  const enterActionRef = useRef<() => void>(() => {});
  enterActionRef.current = () => {
    if (typeof step === 'number' && canNext()) handleNext();
    else if (step === 'macro') handleEnterMicro();
    else if (step === 'micro' && !applying) handleApply();
  };
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
      enterActionRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Open / close effect
  useEffect(() => {
    if (isOpen) {
      const ir = initialRevealRef.current;
      if (ir) {
        // Re-adjust: pre-populate from stored budget
        isReadjustRef.current = true;
        const inc = ir.result.income;

        const fa: Record<string, number> = {};
        for (const cat of NEEDS_CATEGORIES) fa[cat] = ir.amounts[cat] ?? 0;
        setFixedAmounts(fa);

        const ma: Record<string, number> = {};
        for (const cat of WANTS_CATEGORIES) ma[cat] = ir.amounts[cat] ?? 0;
        setMicroAmounts(ma);

        const storedPool = ir.result.wantsPool;
        const pct = inc > 0 ? Math.round((storedPool / inc) * 100) : 20;
        setMacroWantsPct(Math.max(0, pct));
        setWantsPool(storedPool);

        setResult(ir.result);
        setStep('macro');
        setApplying(false);
        setComputeError('');
      }
    } else {
      // Reset on close
      isReadjustRef.current = false;
      setStep(1);
      setData({ income: '', housingSituation: '', housingAmount: '', hasDebt: '', debtAmount: '', utilities: '', health: '', groceries: '', goal: '' });
      setResult(null);
      setComputeError('');
      setApplying(false);
      setMacroWantsPct(20);
      setWantsPool(0);
      setFixedAmounts({});
      setMicroAmounts({});
    }
  }, [isOpen]);

  // Loading → compute → macro
  useEffect(() => {
    if (step !== 'loading') return;
    const timer = setTimeout(() => {
      const inc = parseFloat(data.income) || 0;
      const housing = data.housingSituation === 'rent-free' ? 0 : parseFloat(data.housingAmount) || 0;
      const debt = data.hasDebt === 'yes' ? parseFloat(data.debtAmount) || 0 : 0;
      const inputs: AllocatorInputs = {
        income: inc,
        housing,
        utilities: parseFloat(data.utilities) || 0,
        health: parseFloat(data.health) || 0,
        groceries: parseFloat(data.groceries) || 0,
        debt,
        housingSituation: data.housingSituation as HousingSituation,
        goal: data.goal as FinancialGoal,
      };
      const computed = computeBudget(inputs);
      if (computed.error) {
        setComputeError(computed.error);
        setStep(2);
      } else {
        const fa: Record<string, number> = {};
        for (const a of computed.allocations) {
          if (a.bucket === 'needs') fa[a.category] = a.amount;
        }
        setFixedAmounts(fa);
        const maxPct = inc > 0 ? Math.floor(((inc - computed.needsActual) / inc) * 100) : 20;
        setMacroWantsPct(Math.min(20, maxPct));
        setResult(computed);
        setStep('macro');
      }
    }, 1600);
    return () => clearTimeout(timer);
  }, [step]);

  if (!isOpen) return null;

  const set = (key: keyof WizardData, value: string) => setData(d => ({ ...d, [key]: value }));

  const canNext = (): boolean => {
    if (step === 1) return parseFloat(data.income) > 0;
    if (step === 2) {
      if (!data.housingSituation) return false;
      if (data.housingSituation !== 'rent-free' && !data.housingAmount) return false;
      return true;
    }
    if (step === 3) {
      if (!data.hasDebt) return false;
      if (data.hasDebt === 'yes' && !(parseFloat(data.debtAmount) > 0)) return false;
      return true;
    }
    if (step === 4) return true;
    if (step === 5) return !!data.goal;
    return false;
  };

  const handleNext = () => {
    if (step === 5) { setStep('loading'); return; }
    if (typeof step === 'number') setStep((step + 1) as WizardStep);
  };

  const handleBack = () => {
    if (step === 'micro') { setStep('macro'); return; }
    if (step === 'macro') {
      if (!isReadjustRef.current) setStep(5);
      return;
    }
    if (typeof step === 'number' && step > 1) setStep((step - 1) as WizardStep);
  };

  const handleEnterMicro = () => {
    if (!result) return;
    const pool = Math.round(result.income * macroWantsPct / 100);
    setWantsPool(pool);
    if (!isReadjustRef.current) {
      const init: Record<string, number> = {};
      for (const cat of WANTS_CATEGORIES) init[cat] = 0;
      setMicroAmounts(init);
    }
    setStep('micro');
  };

  const handleApply = async () => {
    setApplying(true);
    const rounded: Record<string, number> = {};
    for (const cat of NEEDS_CATEGORIES) rounded[cat] = Math.round(fixedAmounts[cat] ?? 0);
    for (const cat of WANTS_CATEGORIES) rounded[cat] = Math.round(microAmounts[cat] ?? 0);
    await setBudgetsAll(rounded, result?.income);
    showToast('Smart budget applied successfully!');
    onClose();
  };

  // Macro derived values
  const macroIncome = result?.income ?? 0;
  const macroNeedsActual = result?.needsActual ?? 0;
  const maxWantsPct = macroIncome > 0 ? Math.floor(((macroIncome - macroNeedsActual) / macroIncome) * 100) : 20;
  const actualWants = Math.round(macroIncome * macroWantsPct / 100);
  const actualSavings = macroIncome - macroNeedsActual - actualWants;

  // Micro derived values
  const microAllocated = Object.values(microAmounts).reduce((s, a) => s + a, 0);
  const microRemaining = wantsPool - microAllocated;

  const isQuestionStep = typeof step === 'number';
  const stepNum = isQuestionStep ? (step as number) : 5;

  const renderStep = () => {
    // ── Loading ────────────────────────────────────────────────
    if (step === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-500 animate-spin" />
            <Sparkles className="w-6 h-6 text-teal-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-base">Crunching the numbers...</p>
            <p className="text-sm text-muted-foreground mt-1">Building your personalised budget</p>
          </div>
        </div>
      );
    }

    // ── Macro Budget Allocation ────────────────────────────────
    if (step === 'macro' && result) {
      const needsBarPct  = macroIncome > 0 ? (macroNeedsActual / macroIncome) * 100 : 0;
      const wantsBarPct  = macroIncome > 0 ? (actualWants / macroIncome) * 100 : 0;
      const savingsBarPct = macroIncome > 0 ? (Math.max(0, actualSavings) / macroIncome) * 100 : 0;
      const macroPct     = maxWantsPct > 0 ? Math.round((macroWantsPct / maxWantsPct) * 100) : 0;

      const macroTicks: number[] = [];
      for (let v = 0; v <= maxWantsPct; v += 5) macroTicks.push(v);

      return (
        <div className="space-y-6 pb-4">
          <div>
            <p className="text-base font-semibold mb-1">Your Budget Overview</p>
            <p className="text-sm text-muted-foreground">Here's how your {formatAmount(macroIncome)}/mo splits across the three buckets.</p>
          </div>

          {/* Stacked bar */}
          <div>
            <div className="h-4 rounded-full overflow-hidden flex gap-0.5 bg-muted">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${needsBarPct}%` }} />
              <div className="h-full bg-purple-500 transition-all" style={{ width: `${wantsBarPct}%` }} />
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${savingsBarPct}%` }} />
            </div>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Needs</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Wants</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Savings</div>
            </div>
          </div>

          {/* Needs card — locked */}
          <div className="p-4 rounded-xl border border-border bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <p className="text-sm font-semibold">Needs</p>
              </div>
              <span className="text-xs text-muted-foreground">Locked — from your inputs</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Max Recommended</p>
                <p className="text-lg font-bold text-blue-600">{formatAmount(macroIncome * 0.6)}</p>
                <p className="text-xs text-muted-foreground">60%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Actual</p>
                <p className="text-lg font-bold">{formatAmount(macroNeedsActual)}</p>
                <p className="text-xs text-muted-foreground">{macroIncome > 0 ? Math.round((macroNeedsActual / macroIncome) * 100) : 0}%</p>
              </div>
            </div>
            {(() => {
              const rec = macroIncome * 0.6;
              const state = macroNeedsActual < rec * 0.97 ? 'low' : macroNeedsActual > rec * 1.03 ? 'high' : 'neutral';
              const msg   = state === 'low'     ? 'Great job! Keeping fixed costs low gives you a great potential to grow your portfolio.'
                          : state === 'high'    ? 'We noticed your fixed costs are high, but we will create a plan to improve this.'
                          :                       'Your essential spending is perfectly balanced.';
              const color = state === 'low' ? 'text-emerald-600' : state === 'high' ? 'text-amber-600' : 'text-muted-foreground';
              return <p className={`text-xs mt-3 pt-2.5 border-t border-border/50 ${color}`}>{msg}</p>;
            })()}
          </div>

          {/* Wants card — adjustable slider */}
          <div className="p-4 rounded-xl border border-border bg-purple-50/50 dark:bg-purple-950/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <p className="text-sm font-semibold">Wants</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Max Recommended</p>
                <p className="text-lg font-bold text-purple-600">{formatAmount(macroIncome * 0.2)}</p>
                <p className="text-xs text-muted-foreground">20%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Actual</p>
                <p className="text-lg font-bold">{formatAmount(actualWants)}</p>
                <p className="text-xs text-muted-foreground">{macroWantsPct}%</p>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={maxWantsPct}
              step={1}
              value={macroWantsPct}
              onChange={e => setMacroWantsPct(Number(e.target.value))}
              style={{ '--pct': `${macroPct}` } as React.CSSProperties}
              className="smart-slider w-full"
            />
            <div className="relative h-3" style={{ marginInline: '11px' }}>
              {macroTicks.map(tick => {
                const tickPct = maxWantsPct > 0 ? (tick / maxWantsPct) * 100 : 0;
                return (
                  <div key={tick} className="absolute top-1 -translate-x-1/2" style={{ left: `${tickPct}%` }}>
                    <div className={`w-1.5 h-1.5 rounded-full ${tick <= macroWantsPct ? 'bg-purple-400' : 'bg-muted-foreground/25'}`} />
                  </div>
                );
              })}
            </div>
            {(() => {
              const rec   = macroIncome * 0.2;
              const state = actualWants < rec * 0.97 ? 'low' : actualWants > rec * 1.03 ? 'high' : 'neutral';
              const msg   = state === 'low'  ? 'Great discipline! This frees up cash and gives you a great potential to grow your portfolio.'
                          : state === 'high' ? "You're over the limit. Try scaling back to protect your savings."
                          :                    'Your lifestyle spending is right on target.';
              const color = state === 'low' ? 'text-emerald-600' : state === 'high' ? 'text-amber-600' : 'text-muted-foreground';
              return <p className={`text-xs mt-3 pt-2.5 border-t border-border/50 ${color}`}>{msg}</p>;
            })()}
          </div>

          {/* Savings card — derived */}
          <div className="p-4 rounded-xl border border-border bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <p className="text-sm font-semibold">Savings</p>
              </div>
              <span className="text-xs text-muted-foreground">Derived automatically</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Min Recommended</p>
                <p className="text-lg font-bold text-emerald-600">{formatAmount(macroIncome * 0.2)}</p>
                <p className="text-xs text-muted-foreground">20%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Actual</p>
                <p className={`text-lg font-bold ${actualSavings < 0 ? 'text-red-500' : ''}`}>
                  {formatAmount(Math.max(0, actualSavings))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {macroIncome > 0 ? Math.max(0, Math.round((actualSavings / macroIncome) * 100)) : 0}%
                </p>
              </div>
            </div>
            {(() => {
              const rec    = macroIncome * 0.2;
              const actual = Math.max(0, actualSavings);
              const state  = actual > rec * 1.03 ? 'high' : actual < rec * 0.97 ? 'low' : 'neutral';
              const msg    = state === 'high'    ? 'Fantastic! You are saving aggressively.'
                           : state === 'low'     ? "Savings are a bit low. Try cutting back on 'Wants'."
                           :                       "Spot on! You're hitting the 20% savings goal.";
              const color  = state === 'high' ? 'text-emerald-600' : state === 'low' ? 'text-amber-600' : 'text-muted-foreground';
              return <p className={`text-xs mt-3 pt-2.5 border-t border-border/50 ${color}`}>{msg}</p>;
            })()}
          </div>
        </div>
      );
    }

    // ── Micro Allocation ───────────────────────────────────────
    if (step === 'micro') {
      return (
        <div className="pb-4">
          {/* Remaining counter */}
          <div className={`mb-6 p-3 rounded-xl border-2 text-center ${
            microRemaining === 0 ? 'border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/30' :
            microRemaining > 0  ? 'border-teal-300   bg-teal-50/80   dark:bg-teal-950/30'    :
                                  'border-red-300    bg-red-50/80    dark:bg-red-950/30'
          }`}>
            <p className="text-xs text-muted-foreground">Remaining to allocate</p>
            <p className={`text-2xl font-bold ${
              microRemaining === 0 ? 'text-emerald-600' :
              microRemaining > 0  ? 'text-teal-600'    : 'text-red-500'
            }`}>
              {formatAmount(Math.max(0, microRemaining))}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">of {formatAmount(wantsPool)} total</p>
          </div>

          {/* Per-category sliders — all share wantsPool as the uniform scale */}
          {(() => {
            // Fixed scale for every slider so tick marks are always consistent.
            // Clamping in onChange prevents exceeding the pool; the max attribute
            // never changes, which keeps the visual scale identical across categories.
            const sliderMax = Math.max(SLIDER_STEP, Math.ceil(wantsPool / SLIDER_STEP) * SLIDER_STEP);
            const catTicks: number[] = [];
            for (let v = 0; v <= sliderMax; v += TICK_EVERY) catTicks.push(v);

            return (
              <div className="space-y-6">
                {WANTS_CATEGORIES.map(cat => {
                  const { icon: Icon, bg, text } = getCategoryConfig(cat);
                  const amt = microAmounts[cat] ?? 0;
                  const pct = sliderMax > 0 ? Math.round((amt / sliderMax) * 100) : 0;

                  return (
                    <div key={cat} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${bg}`}>
                        <Icon className={`w-4 h-4 ${text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-medium truncate">{tCategory(cat)}</span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <span className="text-xs text-muted-foreground">{currency.symbol}</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              value={amt}
                              onChange={e => {
                                const raw = Math.max(0, Number(e.target.value) || 0);
                                const maxCat = (microAmounts[cat] ?? 0) + Math.max(0, microRemaining);
                                setMicroAmounts(prev => ({ ...prev, [cat]: Math.min(raw, maxCat) }));
                              }}
                              onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                              className="no-spin w-16 text-right text-sm font-semibold bg-transparent border-b-2 border-border focus:border-teal-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={sliderMax}
                          step={SLIDER_STEP}
                          value={Math.min(amt, sliderMax)}
                          onChange={e => {
                            const raw = Number(e.target.value);
                            const maxCat = (microAmounts[cat] ?? 0) + Math.max(0, microRemaining);
                            setMicroAmounts(prev => ({ ...prev, [cat]: snapToStep(Math.min(raw, maxCat), SLIDER_STEP) }));
                          }}
                          style={{ '--pct': `${pct}` } as React.CSSProperties}
                          className="smart-slider w-full"
                        />
                        <div className="relative h-3" style={{ marginInline: '11px' }}>
                          {catTicks.map(tick => {
                            const tickPct = sliderMax > 0 ? (tick / sliderMax) * 100 : 0;
                            return (
                              <div key={tick} className="absolute top-1 -translate-x-1/2" style={{ left: `${tickPct}%` }}>
                                <div className={`w-1.5 h-1.5 rounded-full ${tick <= amt ? 'bg-teal-400' : 'bg-muted-foreground/25'}`} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      );
    }

    // ── Step 1: Income ─────────────────────────────────────────
    if (step === 1) return (
      <div className="space-y-4">
        <div>
          <p className="text-base font-semibold mb-1">What is your average monthly take-home pay?</p>
          <p className="text-sm text-muted-foreground mb-4">After taxes & deductions</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency.symbol}</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={data.income}
              onChange={e => set('income', e.target.value)}
              placeholder="e.g. 3500"
              className="no-spin w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-input-background text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">This lets us calculate personalised allocation amounts for each category.</p>
        </div>
      </div>
    );

    // ── Step 2: Housing ────────────────────────────────────────
    if (step === 2) return (
      <div className="space-y-4">
        {computeError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{computeError}</div>
        )}
        <div>
          <p className="text-base font-semibold mb-1">What does your living situation look like?</p>
          <p className="text-sm text-muted-foreground mb-3">Select one</p>
          <div className="space-y-2">
            {([
              { value: 'renting',   label: 'Renting',             desc: 'I pay monthly rent' },
              { value: 'mortgage',  label: 'Paying a Mortgage',   desc: 'I have a home loan payment' },
              { value: 'family',    label: 'Living with Family',  desc: 'I pay reduced or shared rent' },
              { value: 'rent-free', label: 'Rent-Free',           desc: 'No housing payment at the moment' },
            ] as const).map(opt => (
              <OptionCard key={opt.value} label={opt.label} description={opt.desc}
                selected={data.housingSituation === opt.value}
                onClick={() => set('housingSituation', opt.value)} />
            ))}
          </div>
        </div>
        {data.housingSituation && data.housingSituation !== 'rent-free' && (
          <FixedInput label="Monthly housing payment" symbol={currency.symbol}
            value={data.housingAmount} onChange={v => set('housingAmount', v)} placeholder="e.g. 1200" />
        )}
      </div>
    );

    // ── Step 3: Debt Profile ───────────────────────────────────
    if (step === 3) return (
      <div className="space-y-4">
        <div>
          <p className="text-base font-semibold mb-1">Do you have significant monthly debt payments?</p>
          <p className="text-sm text-muted-foreground mb-4">Credit cards, student loans, car notes — excluding housing</p>
          <div className="space-y-2">
            <OptionCard label="Yes" selected={data.hasDebt === 'yes'} onClick={() => set('hasDebt', 'yes')} />
            <OptionCard label="No"  selected={data.hasDebt === 'no'}  onClick={() => set('hasDebt', 'no')} />
          </div>
        </div>
        {data.hasDebt === 'yes' && (
          <FixedInput
            label="Total monthly debt payment"
            symbol={currency.symbol}
            value={data.debtAmount}
            onChange={v => set('debtAmount', v)}
            placeholder="e.g. 400"
          />
        )}
      </div>
    );

    // ── Step 4: Fixed Monthly Needs ────────────────────────────
    if (step === 4) return (
      <div className="space-y-4">
        <div>
          <p className="text-base font-semibold mb-1">Any other fixed monthly bills?</p>
          <p className="text-sm text-muted-foreground mb-4">Enter 0 if not applicable</p>
          <div className="grid grid-cols-1 gap-3">
            <FixedInput label="Utilities (electricity, water, internet…)" symbol={currency.symbol} value={data.utilities} onChange={v => set('utilities', v)} />
            <FixedInput label="Health / Insurance"                         symbol={currency.symbol} value={data.health}    onChange={v => set('health', v)} />
            <FixedInput label="Groceries (estimated monthly spend)"         symbol={currency.symbol} value={data.groceries} onChange={v => set('groceries', v)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">These amounts are treated as fixed Needs in your budget.</p>
      </div>
    );

    // ── Step 5: Financial Goal ─────────────────────────────────
    if (step === 5) return (
      <div>
        <p className="text-base font-semibold mb-1">What is your main financial focus right now?</p>
        <p className="text-sm text-muted-foreground mb-4">This helps us frame your personalised plan</p>
        <div className="space-y-2">
          {([
            { value: 'save',          label: 'Save',              desc: 'Build your cash reserves safely.' },
            { value: 'tracking',      label: 'Tracking Expenses', desc: 'Just monitor where my money goes.' },
            { value: 'grow-portfolio',label: 'Grow Portfolio',    desc: 'Focus on long-term wealth building.' },
            { value: 'pay-debt',      label: 'Pay Debt',          desc: 'Aggressively eliminate outstanding balances.' },
          ] as const).map(opt => (
            <OptionCard key={opt.value} label={opt.label} description={opt.desc}
              selected={data.goal === opt.value}
              onClick={() => set('goal', opt.value)} />
          ))}
        </div>
      </div>
    );

    return null;
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-500" />
          <span className="font-semibold text-sm">Smart Budget Setup</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar (question steps only) */}
      {isQuestionStep && (
        <div className="px-4 lg:px-6 pt-4 shrink-0">
          <div className="flex gap-1 mb-1">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${n <= stepNum ? 'bg-teal-500' : 'bg-muted'}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Step {stepNum} of 5</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6">
        <div className="max-w-lg mx-auto">
          {renderStep()}
        </div>
      </div>

      {/* Navigation (question steps only) */}
      {isQuestionStep && (
        <div className="px-4 lg:px-6 py-4 border-t border-border bg-card shrink-0">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canNext()}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 5 ? <><Sparkles className="w-4 h-4" /> Generate My Budget</> : <>Next <ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      )}

      {/* Macro footer */}
      {step === 'macro' && (
        <div className="px-4 lg:px-6 py-4 border-t border-border bg-card shrink-0">
          <div className="max-w-lg mx-auto flex gap-3">
            {!isReadjustRef.current && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              onClick={handleEnterMicro}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors"
            >
              Allocate Wants <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Micro footer */}
      {step === 'micro' && (
        <div className="px-4 lg:px-6 py-4 border-t border-border bg-card shrink-0">
          <div className="max-w-lg mx-auto flex gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleApply}
              disabled={applying}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              <TrendingUp className="w-4 h-4" />
              {applying ? 'Applying…' : 'Apply Budget'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
