import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useBudgets } from '../context/BudgetContext';
import { useCurrency } from '../context/CurrencyContext';
import { CATEGORY_CONFIG } from '../utils/categoryConfig';
import { useLanguage } from '../context/LanguageContext';

const EXPENSE_CATEGORIES = [
  'Food', 'Groceries', 'Housing', 'Utilities', 'Transportation',
  'Shopping', 'Health', 'Entertainment', 'Travel', 'Family & Personal', 'Gifts', 'Gym & Sports', 'Other',
];

export function Budgets() {
  const { budgets, setBudgetForCategory, loading } = useBudgets();
  const { currency } = useCurrency();
  const { t, tCategory } = useLanguage();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!loading) {
      const initial: Record<string, string> = {};
      for (const cat of EXPENSE_CATEGORIES) {
        initial[cat] = budgets[cat] != null ? String(budgets[cat]) : '';
      }
      setDrafts(initial);
    }
  }, [loading, budgets]);

  const handleSave = async (category: string) => {
    const raw = drafts[category] ?? '';
    const amount = raw === '' ? 0 : parseFloat(raw);
    if (isNaN(amount) || amount < 0) return;

    setSaving((s) => ({ ...s, [category]: true }));
    await setBudgetForCategory(category, amount);
    setSaving((s) => ({ ...s, [category]: false }));
    setSaved((s) => ({ ...s, [category]: true }));
    setTimeout(() => setSaved((s) => ({ ...s, [category]: false })), 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="px-4 lg:px-8 py-4 lg:py-6">
          <h1 className="font-semibold mb-1">{t('budgets.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('budgets.subtitle')}
          </p>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-6 lg:py-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('budgets.loading')}</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            {EXPENSE_CATEGORIES.map((name) => {
              const { icon: Icon, bg, text } = CATEGORY_CONFIG[name];
              return (
                <div
                  key={name}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 lg:flex-col lg:items-start lg:gap-4"
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                    <Icon className={`w-5 h-5 ${text}`} />
                  </div>

                  {/* Category name */}
                  <span className="font-medium text-sm flex-1 min-w-0 truncate">{tCategory(name)}</span>

                  {/* Input with currency prefix */}
                  <div className="relative shrink-0 lg:w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">
                      {currency.symbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder={t('budgets.noLimit')}
                      value={drafts[name] ?? ''}
                      onChange={(e) => setDrafts((d) => ({ ...d, [name]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleSave(name)}
                      className="w-28 lg:w-full rounded-lg border border-border bg-background pl-7 pr-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Save button */}
                  <button
                    onClick={() => handleSave(name)}
                    disabled={saving[name]}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 lg:w-full ${
                      saved[name]
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    } disabled:opacity-50`}
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline lg:inline">{saved[name] ? t('budgets.saved') : t('budgets.save')}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          {t('budgets.hint')}
        </p>
      </div>
    </div>
  );
}
