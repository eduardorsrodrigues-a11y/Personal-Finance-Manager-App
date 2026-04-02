import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useBudgets } from '../context/BudgetContext';
import { useCurrency } from '../context/CurrencyContext';
import { CATEGORY_CONFIG } from '../utils/categoryConfig';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const EXPENSE_CATEGORIES = [
  'Food', 'Groceries', 'Housing', 'Utilities', 'Transportation',
  'Shopping', 'Health', 'Entertainment', 'Travel', 'Family & Personal', 'Gifts', 'Gym & Sports', 'Other',
];

export function Budgets() {
  const { budgets, setBudgetForCategory, loading } = useBudgets();
  const { currency, formatAmount } = useCurrency();
  const { t, tCategory } = useLanguage();
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [justSaved, setJustSaved] = useState<Record<string, boolean>>({});

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="px-4 lg:px-8 py-4 lg:py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-semibold">{t('budgets.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('budgets.subtitle')}</p>
            </div>
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
        ) : (
          <div className="bg-card border border-border rounded-xl divide-y divide-border max-w-3xl">
            {EXPENSE_CATEGORIES.map((name) => {
              const { icon: Icon, bg, text, hex } = CATEGORY_CONFIG[name];
              const isSet = budgets[name] != null && budgets[name] > 0;
              return (
                <div key={name} className="flex items-center gap-3 px-4 py-3">
                  {/* Category icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                    <Icon className={`w-4 h-4 ${text}`} />
                  </div>

                  {/* Name + current status */}
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

                  {/* Budget input */}
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

                  {/* Saved checkmark */}
                  <div className={`w-5 shrink-0 transition-opacity duration-300 ${justSaved[name] ? 'opacity-100' : 'opacity-0'}`}>
                    <Check className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground max-w-3xl">{t('budgets.hint')}</p>
      </div>
    </div>
  );
}
