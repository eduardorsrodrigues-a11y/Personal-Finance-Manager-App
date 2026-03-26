import { LayoutDashboard, List, PiggyBank, Globe, ChevronDown, LogOut, LogIn, Languages } from 'lucide-react';
import { FlowWealthLogo } from './FlowWealthLogo';
import { Link, useLocation } from 'react-router';
import { useCurrency, currencies } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { languages } from '../translations';
import { useState } from 'react';

export function Sidebar() {
  const location = useLocation();
  const { currency, setCurrency } = useCurrency();
  const { user, isGuest, signOut, signInWithGoogle } = useAuth();
  const { t, currentLanguage, setLanguage } = useLanguage();
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/transactions', label: t('nav.transactions'), icon: List },
    { path: '/budgets', label: t('nav.budgets'), icon: PiggyBank },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-border bg-sidebar h-screen sticky top-0">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <FlowWealthLogo size={36} />
          <span className="font-semibold text-sidebar-foreground tracking-tight">Flow Wealth</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Guest: sign-in prompt */}
      {isGuest && (
        <div className="px-4 pb-2 border-t border-sidebar-border pt-4">
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogIn className="w-5 h-5 text-emerald-500" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-emerald-600">{t('nav.signIn')}</span>
              <span className="text-xs text-muted-foreground">{t('nav.syncToCloud')}</span>
            </div>
          </button>
        </div>
      )}

      {/* Authenticated: sign out */}
      {user && (
        <div className="px-4 pb-2 border-t border-sidebar-border pt-4">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <div className="flex flex-col items-start">
              <span className="text-sm">{t('nav.signOut')}</span>
              {user.name && <span className="text-xs text-muted-foreground">{user.name}</span>}
            </div>
          </button>
        </div>
      )}

      {/* Currency Selector */}
      <div className="px-4 pt-4 border-t border-sidebar-border">
        <div className="relative">
          <button
            onClick={() => { setIsCurrencyMenuOpen(!isCurrencyMenuOpen); setIsLanguageMenuOpen(false); }}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium">{currency.code} ({currency.symbol})</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isCurrencyMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isCurrencyMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsCurrencyMenuOpen(false)} />
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto z-20">
                {currencies.map((cur) => (
                  <button
                    key={cur.code}
                    onClick={() => { setCurrency(cur); setIsCurrencyMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-muted transition-colors ${currency.code === cur.code ? 'bg-muted' : ''}`}
                  >
                    <div className="text-sm font-medium">{cur.code}</div>
                    <div className="text-xs text-muted-foreground">{cur.name}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Language Selector */}
      <div className="px-4 pb-4 pt-2">
        <div className="relative">
          <button
            onClick={() => { setIsLanguageMenuOpen(!isLanguageMenuOpen); setIsCurrencyMenuOpen(false); }}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5" />
              <span className="text-sm font-medium">{currentLanguage.nativeName}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLanguageMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsLanguageMenuOpen(false)} />
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto z-20">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setIsLanguageMenuOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-muted transition-colors ${currentLanguage.code === lang.code ? 'bg-muted' : ''}`}
                  >
                    <div className="text-sm font-medium">{lang.nativeName}</div>
                    <div className="text-xs text-muted-foreground">{lang.name}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
