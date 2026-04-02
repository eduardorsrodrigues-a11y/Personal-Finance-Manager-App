import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Lock, RotateCcw, TrendingUp, PiggyBank } from 'lucide-react';
import { useBudgets } from '../context/BudgetContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { getCategoryConfig } from '../utils/categoryConfig';
import {
  computeBudget, rebalance, getBucketMap, FIXED_CATEGORIES,
  NEEDS_CATEGORIES, WANTS_CATEGORIES,
  type AllocatorInputs, type HousingSituation, type Dependents,
  type DebtLevel, type FinancialGoal, type AllocatorResult,
} from '../utils/budgetAllocator';

type WizardStep = 1 | 2 | 3 | 4 | 5 | 'loading' | 'reveal';

interface WizardData {
  income: string;
  housingSituation: '' | HousingSituation;
  housingAmount: string;
  utilities: string;
  health: string;
  gym: string;
  dependents: '' | Dependents;
  debt: '' | DebtLevel;
  goal: '' | FinancialGoal;
}

interface Notification {
  changedCategory: string;
  adjustedFrom: string;
  delta: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// ── Small helpers ──────────────────────────────────────────────

function OptionCard({ label, description, selected, onClick }: {
  label: string; description?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
        selected
          ? 'border-teal-500 bg-teal-500/5'
          : 'border-border hover:border-teal-300'
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
          min="0"
          step="1"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-7 pr-3 py-2 rounded-lg border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

export function SmartBudgetWizard({ isOpen, onClose }: Props) {
  const { setBudgetForCategory } = useBudgets();
  const { currency, formatAmount } = useCurrency();
  const { tCategory } = useLanguage();
  const { showToast } = useToast();

  const [step, setStep] = useState<WizardStep>(1);
  const [computeError, setComputeError] = useState('');
  const [result, setResult] = useState<AllocatorResult | null>(null);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [prevAmounts, setPrevAmounts] = useState<Record<string, number> | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [applying, setApplying] = useState(false);

  const [data, setData] = useState<WizardData>({
    income: '',
    housingSituation: '',
    housingAmount: '',
    utilities: '',
    health: '',
    gym: '',
    dependents: '',
    debt: '',
    goal: '',
  });

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setData({ income: '', housingSituation: '', housingAmount: '', utilities: '', health: '', gym: '', dependents: '', debt: '', goal: '' });
      setResult(null);
      setAmounts({});
      setPrevAmounts(null);
      setNotification(null);
      setComputeError('');
      setApplying(false);
    }
  }, [isOpen]);

  // Trigger computation after loading delay
  useEffect(() => {
    if (step !== 'loading') return;
    const timer = setTimeout(() => {
      const inputs: AllocatorInputs = {
        income: parseFloat(data.income) || 0,
        housing: data.housingSituation === 'rent-free' ? 0 : parseFloat(data.housingAmount) || 0,
        utilities: parseFloat(data.utilities) || 0,
        health: parseFloat(data.health) || 0,
        gym: parseFloat(data.gym) || 0,
        housingSituation: data.housingSituation as HousingSituation,
        dependents: data.dependents as Dependents,
        debt: data.debt as DebtLevel,
        goal: data.goal as FinancialGoal,
      };
      const computed = computeBudget(inputs);
      if (computed.error) {
        setComputeError(computed.error);
        setStep(2);
      } else {
        setResult(computed);
        const init: Record<string, number> = {};
        for (const a of computed.allocations) init[a.category] = Math.round(a.amount);
        setAmounts(init);
        setStep('reveal');
      }
    }, 1600);
    return () => clearTimeout(timer);
  }, [step]);

  if (!isOpen) return null;

  const set = (key: keyof WizardData, value: string) =>
    setData(d => ({ ...d, [key]: value }));

  // Validation per step
  const canNext = (): boolean => {
    if (step === 1) return parseFloat(data.income) > 0;
    if (step === 2) {
      if (!data.housingSituation) return false;
      if (data.housingSituation !== 'rent-free' && !data.housingAmount) return false;
      return true;
    }
    if (step === 3) return !!data.dependents;
    if (step === 4) return !!data.debt;
    if (step === 5) return !!data.goal;
    return false;
  };

  const handleNext = () => {
    if (step === 5) { setStep('loading'); return; }
    if (typeof step === 'number') setStep((step + 1) as WizardStep);
  };

  const handleBack = () => {
    if (step === 'reveal') { setStep(5); return; }
    if (typeof step === 'number' && step > 1) setStep((step - 1) as WizardStep);
  };

  // Slider committed (on mouse/touch release)
  const handleSliderCommit = (category: string, newAmount: number) => {
    if (!result || FIXED_CATEGORIES.has(category)) return;
    const bucketMap = getBucketMap(result.allocations);
    const snap = { ...amounts };
    const res = rebalance(amounts, category, newAmount, bucketMap);
    if (res) {
      setPrevAmounts(snap);
      setAmounts(res.updated);
      setNotification({ changedCategory: category, adjustedFrom: res.adjustedFrom, delta: res.delta });
    }
  };

  const handleUndo = () => {
    if (prevAmounts) { setAmounts(prevAmounts); setPrevAmounts(null); setNotification(null); }
  };

  const handleApply = async () => {
    setApplying(true);
    for (const [category, amount] of Object.entries(amounts)) {
      await setBudgetForCategory(category, Math.round(amount));
    }
    showToast('Smart budget applied successfully!');
    onClose();
  };

  // Live savings from current slider state
  const totalAllocated = Object.values(amounts).reduce((s, a) => s + a, 0);
  const liveSavings = (result?.income ?? 0) - totalAllocated;
  const liveSavingsPct = result ? (liveSavings / result.income) * 100 : 0;
  const liveSavingsLevel = liveSavingsPct >= 20 ? 'high' : liveSavingsPct >= 10 ? 'medium' : 'low';

  const savingsColors = {
    high: 'bg-emerald-50 border-emerald-300 text-emerald-700',
    medium: 'bg-amber-50 border-amber-300 text-amber-700',
    low: 'bg-red-50 border-red-300 text-red-700',
  };
  const savingsLabels = {
    high: 'High Savings',
    medium: 'Medium Savings',
    low: 'Low Savings',
  };

  // ── Render helpers ───────────────────────────────────────────

  const renderStep = () => {
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

    if (step === 'reveal' && result) {
      const maxSlider = Math.round(result.income * 0.7);

      const renderSection = (title: string, categories: string[], accent: string) => {
        const sectionAllocs = result.allocations.filter(a => categories.includes(a.category));
        return (
          <div className="mb-6">
            <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${accent}`}>{title}</p>
            <div className="space-y-3">
              {sectionAllocs.map(alloc => {
                const { icon: Icon, bg, text } = getCategoryConfig(alloc.category);
                const isFixed = alloc.fixed;
                const amt = amounts[alloc.category] ?? 0;
                return (
                  <div key={alloc.category} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-medium truncate">{tCategory(alloc.category)}</span>
                        {isFixed && <Lock className="w-2.5 h-2.5 text-muted-foreground shrink-0" />}
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={maxSlider}
                        step={1}
                        value={amt}
                        disabled={isFixed}
                        onChange={e => {
                          if (!isFixed) setAmounts(prev => ({ ...prev, [alloc.category]: Number(e.target.value) }));
                        }}
                        onMouseUp={e => handleSliderCommit(alloc.category, Number((e.target as HTMLInputElement).value))}
                        onTouchEnd={e => handleSliderCommit(alloc.category, Number((e.currentTarget as HTMLInputElement).value))}
                        className={`w-full h-1.5 rounded-full appearance-none outline-none cursor-pointer accent-teal-500 ${isFixed ? 'opacity-40 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <span className="text-xs font-semibold shrink-0 min-w-[4rem] text-right">{formatAmount(amt)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      };

      return (
        <div className="pb-4">
          {/* Notification banner */}
          {notification && (
            <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-teal-800">
                  <span className="font-semibold">Smart Allocation: </span>
                  {notification.delta > 0 ? 'Increased' : 'Decreased'} {tCategory(notification.changedCategory)} by {formatAmount(Math.abs(notification.delta))}. Deducted from {tCategory(notification.adjustedFrom)} to balance your budget.
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={handleUndo} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-teal-300 text-teal-700 hover:bg-teal-100">
                  <RotateCcw className="w-3 h-3" /> Undo
                </button>
                <button onClick={() => setNotification(null)} className="text-xs px-2 py-1 rounded-lg bg-teal-500 text-white">
                  OK
                </button>
              </div>
            </div>
          )}

          {/* Savings card */}
          <div className={`p-4 rounded-xl border-2 mb-5 ${savingsColors[liveSavingsLevel]}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <PiggyBank className="w-3.5 h-3.5" />
                  <p className="text-xs font-semibold uppercase tracking-wide">{savingsLabels[liveSavingsLevel]}</p>
                </div>
                <p className="text-lg font-bold">{formatAmount(Math.max(0, liveSavings))}<span className="text-xs font-normal">/mo</span></p>
              </div>
              <p className="text-3xl font-black">{Math.max(0, liveSavingsPct).toFixed(0)}%</p>
            </div>
            <p className="text-xs mt-1 opacity-75">of income set aside for savings & future goals</p>
          </div>

          {/* Budget breakdown */}
          {renderSection('🏠  Needs', NEEDS_CATEGORIES, 'text-blue-600')}
          {renderSection('✨  Wants', WANTS_CATEGORIES, 'text-purple-600')}

          <p className="text-xs text-muted-foreground text-center mt-2">
            <Lock className="w-3 h-3 inline mr-1" />Fixed amounts cannot be auto-adjusted by Smart Allocation
          </p>
        </div>
      );
    }

    // Step 1: Income
    if (step === 1) return (
      <div className="space-y-4">
        <div>
          <p className="text-base font-semibold mb-1">What is your average monthly take-home pay?</p>
          <p className="text-sm text-muted-foreground mb-4">After taxes & deductions</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency.symbol}</span>
            <input
              type="number" min="0" step="1"
              value={data.income}
              onChange={e => set('income', e.target.value)}
              placeholder="e.g. 3500"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-input-background text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">This lets us calculate personalised allocation amounts for each category.</p>
        </div>
      </div>
    );

    // Step 2: Housing + Fixed costs
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
              { value: 'renting', label: 'Renting', desc: 'I pay monthly rent' },
              { value: 'mortgage', label: 'Paying a Mortgage', desc: 'I have a home loan payment' },
              { value: 'family', label: 'Living with Family', desc: 'I pay reduced or shared rent' },
              { value: 'rent-free', label: 'Rent-Free', desc: 'No housing payment at the moment' },
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

        <div>
          <p className="text-sm font-medium mb-2 mt-2">Other fixed monthly bills <span className="text-muted-foreground font-normal">(enter 0 if not applicable)</span></p>
          <div className="grid grid-cols-1 gap-2">
            <FixedInput label="Utilities (electricity, water, internet…)" symbol={currency.symbol} value={data.utilities} onChange={v => set('utilities', v)} />
            <FixedInput label="Health / Insurance" symbol={currency.symbol} value={data.health} onChange={v => set('health', v)} />
            <FixedInput label="Gym & Sports memberships" symbol={currency.symbol} value={data.gym} onChange={v => set('gym', v)} />
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Lock className="w-3 h-3" /> These amounts are locked — Smart Allocation won't reduce them automatically.
          </p>
        </div>
      </div>
    );

    // Step 3: Dependents
    if (step === 3) return (
      <div>
        <p className="text-base font-semibold mb-1">How many dependents do you support?</p>
        <p className="text-sm text-muted-foreground mb-4">Kids, elderly parents, or anyone who relies on you financially</p>
        <div className="space-y-2">
          {([
            { value: 'none', label: 'Just me', desc: 'No dependents' },
            { value: '1-2', label: '1–2 dependents', desc: 'Kids increase essential costs' },
            { value: '3+', label: '3+ dependents', desc: 'Larger families prioritise essentials' },
          ] as const).map(opt => (
            <OptionCard key={opt.value} label={opt.label} description={opt.desc}
              selected={data.dependents === opt.value}
              onClick={() => set('dependents', opt.value)} />
          ))}
        </div>
      </div>
    );

    // Step 4: Debt
    if (step === 4) return (
      <div>
        <p className="text-base font-semibold mb-1">Do you have significant debt?</p>
        <p className="text-sm text-muted-foreground mb-1">Credit cards, student loans, car notes</p>
        <p className="text-xs text-muted-foreground mb-4 italic">Housing is not part of this debt profile.</p>
        <div className="space-y-2">
          {([
            { value: 'none', label: 'None', desc: "Debt-free!" },
            { value: 'very-little', label: 'Very little', desc: 'Small balances, not a concern' },
            { value: 'manageable', label: 'Manageable', desc: 'Standard payments, on track' },
            { value: 'high', label: 'High — aggressive payoff needed', desc: 'Restricts lifestyle to clear debt faster' },
          ] as const).map(opt => (
            <OptionCard key={opt.value} label={opt.label} description={opt.desc}
              selected={data.debt === opt.value}
              onClick={() => set('debt', opt.value)} />
          ))}
        </div>
      </div>
    );

    // Step 5: Goal
    if (step === 5) return (
      <div>
        <p className="text-base font-semibold mb-1">What is your main financial focus right now?</p>
        <p className="text-sm text-muted-foreground mb-4">This shapes how we prioritise your budget</p>
        <div className="space-y-2">
          {([
            { value: 'emergency-fund', label: 'Building an Emergency Fund', desc: 'Slight squeeze on lifestyle for a cash buffer' },
            { value: 'paying-debt', label: 'Paying Down Debt', desc: 'Redirect funds to clear balances faster' },
            { value: 'investing', label: 'Investing', desc: 'Grow wealth through markets' },
            { value: 'wealth-building', label: 'Wealth Building', desc: 'Long-term financial independence' },
            { value: 'tracking', label: 'Just tracking my expenses', desc: 'Realistic budgets for high cost-of-living' },
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

  const isQuestionStep = typeof step === 'number';
  const stepNum = isQuestionStep ? (step as number) : 5;
  const showProgress = step !== 'loading' && step !== 'reveal';
  const showNav = step !== 'loading' && step !== 'reveal';

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

      {/* Progress bar */}
      {showProgress && (
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

      {/* Navigation */}
      {showNav && (
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
              {step === 5 ? (
                <><Sparkles className="w-4 h-4" /> Generate My Budget</>
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Reveal footer */}
      {step === 'reveal' && (
        <div className="px-4 lg:px-6 py-4 border-t border-border bg-card shrink-0">
          <div className="max-w-lg mx-auto flex gap-3">
            <button onClick={handleBack} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors">
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
