import { useState, useEffect, useRef, useMemo } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Lock, LockOpen, TrendingUp, PiggyBank } from 'lucide-react';
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

export const SMART_BUDGET_KEY = 'mmm_smart_budget';

export interface SmartBudgetStored {
  result: AllocatorResult;
  amounts: Record<string, number>;
}

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


interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialReveal?: SmartBudgetStored;
}

// ── Step helpers ───────────────────────────────────────────────

const SLIDER_STEP = 25;   // slider snaps every 25
const TICK_EVERY  = 100;  // visible tick marks every 100

function snapToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
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

// ── Main component ─────────────────────────────────────────────

export function SmartBudgetWizard({ isOpen, onClose, initialReveal }: Props) {
  const { setBudgetsAll } = useBudgets();
  const { currency, formatAmount } = useCurrency();
  const { tCategory } = useLanguage();
  const { showToast } = useToast();

  const [step, setStep] = useState<WizardStep>(1);
  const [computeError, setComputeError] = useState('');
  const [result, setResult] = useState<AllocatorResult | null>(null);
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  const [applying, setApplying] = useState(false);
  const [savingsDraft, setSavingsDraft] = useState<number | null>(null);
  const [fixSavings, setFixSavings] = useState(true);
  const [unlockedFixed, setUnlockedFixed] = useState<Set<string>>(new Set());

  const [data, setData] = useState<WizardData>({
    income: '', housingSituation: '', housingAmount: '',
    utilities: '', health: '', gym: '', dependents: '', debt: '', goal: '',
  });

  // Refs for correct rebalancing (amounts may already be updated before commit fires)
  const dragStartAmounts = useRef<Record<string, number>>({});
  const inputStartRef = useRef<Record<string, number>>({});

  // Derive slider bounds from result
  const maxSlider = result ? Math.round(result.income * 0.7) : 0;
  const categoryTicks = useMemo(() => {
    if (!maxSlider) return [];
    const t: number[] = [];
    for (let v = 0; v <= maxSlider; v += TICK_EVERY) t.push(v);
    return t;
  }, [maxSlider]);

  const savingsTicks = useMemo(() => {
    if (!result) return [];
    const t: number[] = [];
    for (let v = 0; v <= result.income; v += TICK_EVERY) t.push(v);
    return t;
  }, [result]);

  const initialRevealRef = useRef(initialReveal);
  initialRevealRef.current = initialReveal;

  // Enter key → Next / Apply
  const enterActionRef = useRef<() => void>(() => {});
  enterActionRef.current = () => {
    if (typeof step === 'number' && canNext()) handleNext();
    else if (step === 'reveal' && !applying) handleApply();
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

  useEffect(() => {
    if (isOpen) {
      const ir = initialRevealRef.current;
      if (ir) {
        const ms = Math.round(ir.result.income * 0.7);
        const snapped: Record<string, number> = {};
        for (const [cat, amt] of Object.entries(ir.amounts)) {
          snapped[cat] = snapToStep(Math.min(ms, Math.max(0, amt)), SLIDER_STEP);
        }
        setResult(ir.result);
        setAmounts(snapped);
        setStep('reveal');
        setSavingsDraft(null);
        setApplying(false);
        setComputeError('');
        setFixSavings(true);
        setUnlockedFixed(new Set());
      }
    } else {
      setStep(1);
      setData({ income: '', housingSituation: '', housingAmount: '', utilities: '', health: '', gym: '', dependents: '', debt: '', goal: '' });
      setResult(null);
      setAmounts({});
      setComputeError('');
      setApplying(false);
      setSavingsDraft(null);
      setFixSavings(true);
      setUnlockedFixed(new Set());
      dragStartAmounts.current = {};
      inputStartRef.current = {};
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
        const ms = Math.round(computed.income * 0.7);
        const init: Record<string, number> = {};
        for (const a of computed.allocations) {
          init[a.category] = snapToStep(Math.round(a.amount), SLIDER_STEP);
        }
        setResult(computed);
        setAmounts(init);
        setStep('reveal');
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

  const relockIfFixed = (category: string) => {
    if (FIXED_CATEGORIES.has(category)) {
      setUnlockedFixed(prev => { const s = new Set(prev); s.delete(category); return s; });
    }
  };

  // Rebalance using the snapshot from BEFORE the drag/type started.
  // Only categories rendered BELOW the changed one are eligible to absorb.
  // If none are available, savings absorbs the change (no loop).
  const handleCommit = (category: string, newAmount: number, baseAmounts: Record<string, number>) => {
    const effectivelyFixed = FIXED_CATEGORIES.has(category) && !unlockedFixed.has(category);
    if (!result || effectivelyFixed) return;
    const delta = newAmount - (baseAmounts[category] ?? 0);
    if (Math.abs(delta) < 1) return;

    if (!fixSavings) {
      // Free mode: only update this category; savings absorbs the change
      setAmounts(prev => ({ ...prev, [category]: newAmount }));
      return;
    }

    // Fixed-savings mode: only absorb from categories BELOW this one in display order
    const displayOrder = [...NEEDS_CATEGORIES, ...WANTS_CATEGORIES];
    const changedIdx = displayOrder.indexOf(category);
    const belowCategories = new Set(
      displayOrder.slice(changedIdx + 1).filter(c => !FIXED_CATEGORIES.has(c)),
    );

    if (belowCategories.size === 0) {
      // Nothing below to absorb — fall back to savings absorbing the difference
      setAmounts(prev => ({ ...prev, [category]: newAmount }));
      return;
    }

    const bucketMap = getBucketMap(result.allocations);
    const res = rebalance(baseAmounts, category, newAmount, bucketMap, belowCategories);
    if (res) {
      setAmounts(res.updated);
    } else {
      // No fluid categories below had capacity — savings absorbs
      setAmounts(prev => ({ ...prev, [category]: newAmount }));
    }
  };

  const adjustForSavings = (newSavings: number) => {
    if (!result) return;
    const fixedTotal = result.allocations.filter(a => a.fixed).reduce((s, a) => s + (amounts[a.category] ?? 0), 0);
    const currentFluidTotal = result.allocations.filter(a => !a.fixed).reduce((s, a) => s + (amounts[a.category] ?? 0), 0);
    const targetFluidTotal = Math.max(0, result.income - Math.max(0, newSavings) - fixedTotal);
    if (currentFluidTotal === 0) return;
    const ratio = targetFluidTotal / currentFluidTotal;
    const updated = { ...amounts };
    result.allocations.filter(a => !a.fixed).forEach(a => {
      updated[a.category] = snapToStep(Math.max(0, Math.round((amounts[a.category] ?? 0) * ratio)), SLIDER_STEP);
    });
    setAmounts(updated);
  };

const handleApply = async () => {
    setApplying(true);
    const rounded: Record<string, number> = {};
    for (const [cat, amt] of Object.entries(amounts)) rounded[cat] = Math.round(amt);
    await setBudgetsAll(rounded, result?.income);
    showToast('Smart budget applied successfully!');
    onClose();
  };

  // Live savings
  const totalAllocated = Object.values(amounts).reduce((s, a) => s + a, 0);
  const liveSavings = (result?.income ?? 0) - totalAllocated;
  const displayedSavings = savingsDraft !== null ? savingsDraft : Math.max(0, liveSavings);
  const displayedSavingsPct = result ? (displayedSavings / result.income) * 100 : 0;
  const liveSavingsPct = result ? (liveSavings / result.income) * 100 : 0;
  const liveSavingsLevel = liveSavingsPct >= 20 ? 'high' : liveSavingsPct >= 10 ? 'medium' : 'low';

  const savingsColors = {
    high: 'bg-emerald-50 border-emerald-300 text-emerald-700',
    medium: 'bg-amber-50 border-amber-300 text-amber-700',
    low: 'bg-red-50 border-red-300 text-red-700',
  };
  const savingsLabels = { high: 'High Savings', medium: 'Medium Savings', low: 'Low Savings' };

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
      const savingsPct = Math.round(Math.max(0, displayedSavingsPct));
      const savingsPctForSlider = Math.round(Math.max(0, displayedSavings) / result.income * 100);

      const renderSection = (title: string, categories: string[], accent: string) => {
        const sectionAllocs = result.allocations.filter(a => categories.includes(a.category));
        return (
          <div className="mb-6">
            <p className={`text-xs font-semibold uppercase tracking-wider mb-4 ${accent}`}>{title}</p>
            <div className="space-y-6">
              {sectionAllocs.map(alloc => {
                const { icon: Icon, bg, text } = getCategoryConfig(alloc.category);
                const isNativeFixed = FIXED_CATEGORIES.has(alloc.category);
                const isUnlocked = unlockedFixed.has(alloc.category);
                const isFixed = isNativeFixed && !isUnlocked;
                const amt = amounts[alloc.category] ?? 0;
                const pct = maxSlider > 0 ? Math.round((amt / maxSlider) * 100) : 0;

                return (
                  <div key={alloc.category} className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${bg}`}>
                      <Icon className={`w-4 h-4 ${text}`} />
                    </div>

                    {/* Content: name + input row, then slider */}
                    <div className="flex-1 min-w-0">
                      {/* Name + editable amount */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-sm font-medium truncate">{tCategory(alloc.category)}</span>
                          {isNativeFixed && (
                            isUnlocked ? (
                              <LockOpen className="w-3 h-3 text-teal-500 shrink-0" />
                            ) : (
                              <button
                                type="button"
                                onClick={() => setUnlockedFixed(prev => new Set([...prev, alloc.category]))}
                                className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
                                title="Click to temporarily unlock"
                              >
                                <Lock className="w-3 h-3 text-muted-foreground" />
                              </button>
                            )
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <span className="text-xs text-muted-foreground">{currency.symbol}</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            max={maxSlider}
                            value={amt}
                            disabled={isFixed}
                            onFocus={() => { inputStartRef.current[alloc.category] = amt; }}
                            onChange={e => {
                              if (isFixed) return;
                              const v = Math.max(0, Math.min(maxSlider, Number(e.target.value) || 0));
                              setAmounts(prev => ({ ...prev, [alloc.category]: v }));
                            }}
                            onBlur={e => {
                              if (isFixed) return;
                              const raw = Math.max(0, Math.min(maxSlider, Number(e.target.value) || 0));
                              const base = { ...amounts, [alloc.category]: inputStartRef.current[alloc.category] ?? raw };
                              setAmounts(prev => ({ ...prev, [alloc.category]: raw }));
                              handleCommit(alloc.category, raw, base);
                              relockIfFixed(alloc.category);
                            }}
                            onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                            className="no-spin w-16 text-right text-sm font-semibold bg-transparent border-b-2 border-border focus:border-teal-500 focus:outline-none disabled:opacity-40"
                          />
                        </div>
                      </div>

                      {/* Slider */}
                      <input
                        type="range"
                        min={0}
                        max={maxSlider}
                        step={SLIDER_STEP}
                        value={amt}
                        disabled={isFixed}
                        onMouseDown={() => { dragStartAmounts.current = { ...amounts }; }}
                        onTouchStart={() => { dragStartAmounts.current = { ...amounts }; }}
                        onChange={e => {
                          if (!isFixed) setAmounts(prev => ({ ...prev, [alloc.category]: Number(e.target.value) }));
                        }}
                        onMouseUp={e => {
                          handleCommit(alloc.category, Number((e.target as HTMLInputElement).value), dragStartAmounts.current);
                          relockIfFixed(alloc.category);
                        }}
                        onTouchEnd={e => {
                          handleCommit(alloc.category, Number((e.currentTarget as HTMLInputElement).value), dragStartAmounts.current);
                          relockIfFixed(alloc.category);
                        }}
                        style={{ '--pct': `${pct}` } as React.CSSProperties}
                        className={`smart-slider w-full ${isFixed ? 'opacity-40' : ''}`}
                      />

                      {/* Tick marks */}
                      <div className="relative h-3" style={{ marginInline: '11px' }}>
                        {categoryTicks.map(tick => {
                          const tickPct = maxSlider > 0 ? (tick / maxSlider) * 100 : 0;
                          return (
                            <div
                              key={tick}
                              className="absolute top-1 -translate-x-1/2"
                              style={{ left: `${tickPct}%` }}
                            >
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
          </div>
        );
      };

      return (
        <div className="pb-4">

          {/* Fix Savings toggle */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/50 rounded-xl mb-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Fix Savings Amount</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {fixSavings
                  ? 'Other categories auto-adjust to keep savings constant'
                  : 'Savings adjusts freely when you change a category'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={fixSavings}
              onClick={() => setFixSavings(f => !f)}
              className={`relative shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${fixSavings ? 'bg-teal-500' : 'bg-muted-foreground/30'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${fixSavings ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Savings card with slider */}
          <div className={`p-4 rounded-xl border-2 mb-6 ${savingsColors[liveSavingsLevel]}`}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <PiggyBank className="w-3.5 h-3.5" />
                  <p className="text-xs font-semibold uppercase tracking-wide">{savingsLabels[liveSavingsLevel]}</p>
                </div>
                <p className="text-xl font-bold">
                  {formatAmount(Math.max(0, displayedSavings))}<span className="text-xs font-normal opacity-75">/mo</span>
                </p>
              </div>
              <p className="text-4xl font-black">{savingsPct}%</p>
            </div>
            <p className="text-xs mb-3 opacity-70">Drag to adjust savings — spending categories rebalance automatically</p>
            <input
              type="range"
              min={0}
              max={result.income}
              step={SLIDER_STEP}
              value={savingsDraft ?? Math.max(0, liveSavings)}
              onChange={e => setSavingsDraft(Number(e.target.value))}
              onMouseUp={e => { adjustForSavings(Number((e.target as HTMLInputElement).value)); setSavingsDraft(null); }}
              onTouchEnd={e => { adjustForSavings(Number((e.currentTarget as HTMLInputElement).value)); setSavingsDraft(null); }}
              style={{ '--pct': `${savingsPctForSlider}` } as React.CSSProperties}
              className="smart-slider w-full"
            />
            {/* Savings tick marks */}
            <div className="relative h-3 mt-0.5" style={{ marginInline: '11px' }}>
              {savingsTicks.map(tick => {
                const tickPct = result.income > 0 ? (tick / result.income) * 100 : 0;
                const activeVal = savingsDraft ?? Math.max(0, liveSavings);
                return (
                  <div key={tick} className="absolute top-1 -translate-x-1/2" style={{ left: `${tickPct}%` }}>
                    <div className={`w-1.5 h-1.5 rounded-full ${tick <= activeVal ? 'opacity-60 bg-current' : 'bg-current opacity-20'}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Budget breakdown */}
          {renderSection('🏠  Needs', NEEDS_CATEGORIES, 'text-blue-600')}
          {renderSection('✨  Wants', WANTS_CATEGORIES, 'text-purple-600')}

          <p className="text-xs text-muted-foreground text-center mt-2">
            <Lock className="w-3 h-3 inline mr-1" />Tap the lock icon to temporarily unlock a fixed category
          </p>
        </div>
      );
    }

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
              {step === 5 ? <><Sparkles className="w-4 h-4" /> Generate My Budget</> : <>Next <ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      )}

      {/* Reveal footer */}
      {step === 'reveal' && (
        <div className="px-4 lg:px-6 py-4 border-t border-border bg-card shrink-0">
          <div className="max-w-lg mx-auto flex gap-3">
            {!initialReveal && (
              <button onClick={handleBack} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
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
