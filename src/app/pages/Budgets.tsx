import { useState } from 'react';
import { X, Sparkles, ChevronRight, RotateCcw, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
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

const ALL_SMART_CATEGORIES = [...NEEDS_CATEGORIES, ...WANTS_CATEGORIES];

const SLIDER_STEP = 25;
const TICK_EVERY  = 100;

function snapToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function Budgets() {
  const { budgets, smartIncome, setBudgetForCategory, setBudgetsAll, loading } = useBudgets();
  const { currency, formatAmount } = useCurrency();
  const { t, tCategory } = useLanguage();
  const { showToast } = useToast();

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardInitialReveal, setWizardInitialReveal] = useState<SmartBudgetStored | undefined>(undefined);

  // Single-category edit modal (manual mode)
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState(0);

  const isSmartMode = smartIncome !== null && smartIncome > 0;

  // ── Smart wizard helpers ───────────────────────────────────
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

  const openWizardFresh   = () => { setWizardInitialReveal(undefined); setIsWizardOpen(true); };
  const openWizardReveal  = () => { setWizardInitialReveal(buildRevealData()); setIsWizardOpen(true); };
  const handleWizardClose = () => { setIsWizardOpen(false); setWizardInitialReveal(undefined); };
  const clearSmartMode    = async () => { await setBudgetsAll(budgets, undefined); };

  // Smart budget summary numbers
  const totalBudgeted   = ALL_SMART_CATEGORIES.reduce((s, c) => s + (budgets[c] ?? 0), 0);
  const smartSavings    = (smartIncome ?? 0) - totalBudgeted;
  const smartSavingsPct = smartIncome ? (smartSavings / smartIncome) * 100 : 0;
  const savingsLevel    = smartSavingsPct >= 20 ? 'high' : smartSavingsPct >= 10 ? 'medium' : 'low';
  const savingsColor    = { high: 'text-emerald-600', medium: 'text-amber-600', low: 'text-red-500' }[savingsLevel];

  // ── Manual edit modal helpers ──────────────────────────────
  const openEdit = (name: string) => {
    setEditingDraft(budgets[name] ?? 0);
    setEditingCategory(name);
  };
  const closeEdit = () => setEditingCategory(null);

  const handleSaveEdit = async () => {
    if (!editingCategory) return;
    const amount = Math.round(editingDraft);
    await setBudgetForCategory(editingCategory, amount);
    showToast(
      amount === 0
        ? `${tCategory(editingCategory)} budget removed`
        : `${tCategory(editingCategory)} budget set to ${formatAmount(amount)}`,
    );
    closeEdit();
  };

  // Slider max: at least 2000, or 3× current budget rounded to nearest 100
  const editMaxSlider = editingCategory
    ? Math.max(Math.ceil(((budgets[editingCategory] ?? 0) * 3) / 100) * 100, 2000)
    : 2000;

  const editTicks: number[] = [];
  for (let v = 0; v <= editMaxSlider; v += TICK_EVERY) editTicks.push(v);

  // ── Shared row & section renderers ────────────────────────
  const renderSectionHeader = (emoji: string, label: string, color: string) => (
    <div className="px-4 py-2 bg-muted/50 border-b border-border">
      <p className={`text-xs font-semibold uppercase tracking-wider ${color}`}>{emoji}  {label}</p>
    </div>
  );

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
          {isSet
            ? <span className="text-sm font-semibold" style={{ color: hex }}>{formatAmount(amount)}</span>
            : <span className="text-xs text-muted-foreground">{t('budgets.noLimit')}</span>}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
    );
  };

  const renderManualRow = (name: string) => {
    const { icon: Icon, bg, text, hex } = CATEGORY_CONFIG[name];
    const amount = budgets[name] ?? 0;
    const isSet = amount > 0;
    return (
      <button
        key={name}
        onClick={() => openEdit(name)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
          <Icon className={`w-4 h-4 ${text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{tCategory(name)}</p>
        </div>
        <div className="text-right shrink-0">
          {isSet
            ? <span className="text-sm font-semibold" style={{ color: hex }}>{formatAmount(amount)}</span>
            : <span className="text-xs text-muted-foreground">{t('budgets.noLimit')}</span>}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
    );
  };

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
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-6 lg:py-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('budgets.loading')}</p>
        ) : isSmartMode ? (
          /* ── Smart Budget View ───────────────────────────── */
          <div className="space-y-4">
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
            </div>

            {/* Needs + Wants — side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {renderSectionHeader('🏠', 'Needs', 'text-blue-600')}
                <div className="divide-y divide-border">
                  {NEEDS_CATEGORIES.map(name => renderSmartRow(name))}
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {renderSectionHeader('✨', 'Wants', 'text-purple-600')}
                <div className="divide-y divide-border">
                  {WANTS_CATEGORIES.map(name => renderSmartRow(name))}
                </div>
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
          /* ── Manual Budget View ──────────────────────────── */
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {renderSectionHeader('🏠', 'Needs', 'text-blue-600')}
                <div className="divide-y divide-border">
                  {NEEDS_CATEGORIES.map(name => renderManualRow(name))}
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {renderSectionHeader('✨', 'Wants', 'text-purple-600')}
                <div className="divide-y divide-border">
                  {WANTS_CATEGORIES.map(name => renderManualRow(name))}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t('budgets.hint')}</p>
          </div>
        )}
      </div>

      <SmartBudgetWizard
        isOpen={isWizardOpen}
        onClose={handleWizardClose}
        initialReveal={wizardInitialReveal}
      />

      {/* ── Single-category edit modal ─────────────────────── */}
      {editingCategory && (() => {
        const { icon: Icon, bg, text, hex } = CATEGORY_CONFIG[editingCategory];
        const pct = editMaxSlider > 0 ? Math.round((editingDraft / editMaxSlider) * 100) : 0;
        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
            onClick={closeEdit}
          >
            <div
              className="bg-card w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
                    <Icon className={`w-4 h-4 ${text}`} />
                  </div>
                  <p className="font-semibold text-sm">{tCategory(editingCategory)}</p>
                </div>
                <button onClick={closeEdit} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Slider + input */}
              <div className="px-5 py-5">
                {/* Amount input */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <p className="text-sm text-muted-foreground">Monthly limit</p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">{currency.symbol}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={editingDraft}
                      onChange={e => setEditingDraft(Math.max(0, Number(e.target.value) || 0))}
                      onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                      style={{ color: editingDraft > 0 ? hex : undefined }}
                      className="no-spin w-24 text-right text-lg font-bold bg-transparent border-b-2 border-border focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={0}
                  max={editMaxSlider}
                  step={SLIDER_STEP}
                  value={Math.min(editingDraft, editMaxSlider)}
                  onChange={e => setEditingDraft(Number(e.target.value))}
                  style={{ '--pct': `${pct}` } as React.CSSProperties}
                  className="smart-slider w-full"
                />

                {/* Tick marks */}
                <div className="relative h-3 mt-0.5" style={{ marginInline: '11px' }}>
                  {editTicks.map(tick => {
                    const tickPct = editMaxSlider > 0 ? (tick / editMaxSlider) * 100 : 0;
                    return (
                      <div key={tick} className="absolute top-1 -translate-x-1/2" style={{ left: `${tickPct}%` }}>
                        <div className={`w-1.5 h-1.5 rounded-full ${tick <= editingDraft ? 'bg-teal-400' : 'bg-muted-foreground/25'}`} />
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{formatAmount(0)}</span>
                  <span className="text-xs text-muted-foreground">{formatAmount(editMaxSlider)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-5 pb-5">
                <button
                  onClick={() => setEditingDraft(0)}
                  className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  Remove limit
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
