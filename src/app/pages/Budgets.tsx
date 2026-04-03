import { useState, useEffect } from 'react';
import { Check, Sparkles, ChevronRight, RotateCcw, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
import { SmartBudgetWizard, type SmartBudgetStored } from '../components/SmartBudgetWizard';
import { useBudgets } from '../context/BudgetContext';
import { useCurrency } from '../context/CurrencyContext';
import { CATEGORY_CONFIG } from '../utils/categoryConfig';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import {
  NEEDS_CATEGORIES, WANTS_CATEGORIES, FIXED_CATEGORIES,
  type AllocatorResult,
} from '../utils/budgetAllocator';

const EXPENSE_CATEGORIES = [
  'Food', 'Groceries', 'Housing', 'Utilities', 'Transportation',
  'Shopping', 'Health', 'Entertainment', 'Travel', 'Family & Personal', 'Gifts', 'Gym & Sports', 'Other',
];

const ALL_SMART_CATEGORIES = [...NEEDS_CATEGORIES, ...WANTS_CATEGORIES];

export function Budgets() {
  const { budgets, smartIncome, setBudgetForCategory, setBudgetsAll, loading } = useBudgets();
  const { currency, formatAmount } = useCurrency();
  const { t, tCategory } = useLanguage();
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [justSaved, setJustSaved] = useState<Record<string, boolean>>({});
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardInitialReveal, setWizardInitialReveal] = useState<SmartBudgetStored | undefined>(undefined);

  const isSmartMode = smartIncome !== null && smartIncome > 0;

  useEffect(() => {
    if (!loading) {
      const initial: Record<string, string> = {};
      for (const cat of EXPENSE_CATEGORIES) {
        initial[cat] = budgets[cat] != null && budgets[cat] > 0 ? String(budgets[cat]) : '';
      }
      setDrafts(initial);
    }
  }, [loading, budgets]);

  const handleBlur = async (category: string) => {
    const raw = drafts[category] ?? '';
    const amount = raw === '' ? 0 : parseFloat(raw);
    if (isNaN(amount) || amount < 0) return;

    const current = budgets[category] ?? 0;
    if (amount === current) return;

    await setBudgetForCategory(category, amount);
    setJustSaved((s) => ({ ...s, [category]: true }));
    setTimeout(() => setJustSaved((s) => ({ ...s, [category]: false })), 2000);
    showToast(
      amount === 0
        ? `${tCategory(category)} budget removed`
        : `${tCategory(category)} budget set to ${formatAmount(amount)}`
    );
  };

  const setBudgetCount = EXPENSE_CATEGORIES.filter(
    (c) => budgets[c] != null && budgets[c] > 0
  ).length;

  // Build a synthetic AllocatorResult from stored income + current budgets
  const buildRevealData = (): SmartBudgetStored | undefined => {
    if (!smartIncome) return undefined;
    const totalBudgeted = ALL_SMART_CATEGORIES.reduce((s, c) => s + (budgets[c] ?? 0), 0);
    const savings = smartIncome - totalBudgeted;
    const savingsPct = smartIncome > 0 ? (savings / smartIncome) * 100 : 0;
    const result: AllocatorResult = {
      income: smartIncome,
      allocations: ALL_SMART_CATEGORIES.map(cat => ({
        category: cat,
        amount: budgets[cat] ?? 0,
        pct: smartIncome > 0 ? ((budgets[cat] ?? 0) / smartIncome) * 100 : 0,
        fixed: FIXED_CATEGORIES.has(cat),
        bucket: NEEDS_CATEGORIES.includes(cat) ? 'needs' : 'wants',
      })),
      savings,
      savingsPct,
      savingsLevel: savingsPct >= 20 ? 'high' : savingsPct >= 10 ? 'medium' : 'low',
      needsPct: 50,
      wantsPct: 30,
      futurePct: 20,
    };
    const amounts: Record<string, number> = {};
    for (const cat of ALL_SMART_CATEGORIES) amounts[cat] = budgets[cat] ?? 0;
    return { result, amounts };
  };

  const openWizardFresh = () => {
    setWizardInitialReveal(undefined);
    setIsWizardOpen(true);
  };

  const openWizardReveal = () => {
    setWizardInitialReveal(buildRevealData());
    setIsWizardOpen(true);
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    setWizardInitialReveal(undefined);
  };

  const clearSmartMode = async () => {
    await setBudgetsAll(budgets, undefined);
  };

  // Smart budget summary
  const totalBudgeted = EXPENSE_CATEGORIES.reduce((s, c) => s + (budgets[c] ?? 0), 0);
  const smartSavings = (smartIncome ?? 0) - totalBudgeted;
  const smartSavingsPct = smartIncome ? (smartSavings / smartIncome) * 100 : 0;
  const savingsLevel = smartSavingsPct >= 20 ? 'high' : smartSavingsPct >= 10 ? 'medium' : 'low';
  const savingsColor = { high: 'text-emerald-600', medium: 'text-amber-600', low: 'text-red-500' }[savingsLevel];

  // ── Smart budget category row ──────────────────────────────
  const renderSmartRow = (name: string) => {
    const { icon: Icon, bg, text, hex } = CATEGORY_CONFIG[name];
    const amount = budgets[name] ?? 0;
    const pctOfIncome = smartIncome ? (amount / smartIncome) * 100 : 0;
    const isSet = amount > 0;

    return (
      <button
        key={name}
        onClick={openWizardReveal}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
          <Icon className={`w-4 h-4 ${text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{tCategory(name)}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, pctOfIncome)}%`, backgroundColor: isSet ? hex : '#9ca3af' }}
              />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{pctOfIncome.toFixed(0)}%</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          {isSet ? (
            <span className="text-sm font-semibold" style={{ color: hex }}>{formatAmount(amount)}</span>
          ) : (
            <span className="text-xs text-muted-foreground">{t('budgets.noLimit')}</span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
    );
  };

  const renderSectionHeader = (emoji: string, label: string, color: string) => (
    <div className="px-4 py-2 bg-muted/50 border-b border-border">
      <p className={`text-xs font-semibold uppercase tracking-wider ${color}`}>{emoji}  {label}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="px-4 lg:px-8 py-4 lg:py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-semibold">{t('budgets.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('budgets.subtitle')}</p>
            </div>
            {isSmartMode ? (
              <button
                onClick={openWizardReveal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                Re-adjust
              </button>
            ) : (
              <button
                onClick={openWizardFresh}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                Smart Setup
              </button>
            )}
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold">{setBudgetCount}</p>
              <p className="text-xs text-muted-foreground">of {EXPENSE_CATEGORIES.length} set</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-6 lg:py-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('budgets.loading')}</p>
        ) : isSmartMode ? (
          /* ── Smart Budget View ───────────────────────────── */
          <div className="max-w-3xl space-y-4">
            {/* Summary card */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-teal-500" />
                <span className="text-sm font-semibold text-teal-600">Smart Budget Active</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Wallet className="w-3.5 h-3.5" />
                    <p className="text-xs">Income</p>
                  </div>
                  <p className="font-semibold text-sm">
                    {formatAmount(smartIncome!)}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                  </p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <p className="text-xs">Budgeted</p>
                  </div>
                  <p className="font-semibold text-sm">
                    {formatAmount(totalBudgeted)}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                  </p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <PiggyBank className="w-3.5 h-3.5" />
                    <p className="text-xs">Savings</p>
                  </div>
                  <p className={`font-semibold text-sm ${savingsColor}`}>
                    {formatAmount(Math.max(0, smartSavings))}
                    <span className="text-xs font-normal opacity-75"> ({Math.max(0, smartSavingsPct).toFixed(0)}%)</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Tap any category to open the smart allocator and rebalance.
              </p>
            </div>

            {/* Needs */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {renderSectionHeader('🏠', 'Needs', 'text-blue-600')}
              <div className="divide-y divide-border">
                {NEEDS_CATEGORIES.map(name => renderSmartRow(name))}
              </div>
            </div>

            {/* Wants */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {renderSectionHeader('✨', 'Wants', 'text-purple-600')}
              <div className="divide-y divide-border">
                {WANTS_CATEGORIES.map(name => renderSmartRow(name))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{t('budgets.hint')}</p>

            <button
              onClick={clearSmartMode}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Switch to manual budget mode
            </button>
          </div>
        ) : (
          /* ── Normal Budget View ──────────────────────────── */
          <>
            <div className="bg-card border border-border rounded-xl divide-y divide-border max-w-3xl">
              {EXPENSE_CATEGORIES.map((name) => {
                const { icon: Icon, bg, text, hex } = CATEGORY_CONFIG[name];
                const isSet = budgets[name] != null && budgets[name] > 0;
                return (
                  <div key={name} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon className={`w-4 h-4 ${text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tCategory(name)}</p>
                      <p className="text-xs">
                        {isSet ? (
                          <span style={{ color: hex }}>{formatAmount(budgets[name]!)}/mo</span>
                        ) : (
                          <span className="text-muted-foreground">{t('budgets.noLimit')}</span>
                        )}
                      </p>
                    </div>
                    <div className="relative shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        {currency.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder={t('budgets.noLimit')}
                        value={drafts[name] ?? ''}
                        onChange={(e) => setDrafts((d) => ({ ...d, [name]: e.target.value }))}
                        onBlur={() => handleBlur(name)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        className="w-32 rounded-lg border border-border bg-input-background pl-7 pr-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className={`w-5 shrink-0 transition-opacity duration-300 ${justSaved[name] ? 'opacity-100' : 'opacity-0'}`}>
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-muted-foreground max-w-3xl">{t('budgets.hint')}</p>
          </>
        )}
      </div>

      <SmartBudgetWizard
        isOpen={isWizardOpen}
        onClose={handleWizardClose}
        initialReveal={wizardInitialReveal}
      />
    </div>
  );
}
