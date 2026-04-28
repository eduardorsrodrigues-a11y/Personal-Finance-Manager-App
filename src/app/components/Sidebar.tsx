import { LayoutDashboard, List, PiggyBank, TrendingUp, Globe, ChevronDown, LogOut, LogIn, Languages, Settings, PiggyBank as SavingsIcon, Building2 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useCurrency, currencies } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { languages } from '../translations';
import { useState } from 'react';

const mainNav = [
  { path: '/',             label: 'nav.dashboard',    icon: LayoutDashboard },
  { path: '/transactions', label: 'nav.transactions', icon: List },
  { path: '/budgets',      label: 'nav.budgets',      icon: PiggyBank },
];

const planningNav = [
  { path: '/invest',   label: 'Invest',         icon: TrendingUp, badge: 'NEW' },
];

const accountNav = [
  { path: '/settings',      label: 'Settings',      icon: Settings  },
  { path: '/bank-accounts', label: 'Bank Accounts',  icon: Building2 },
];

export function Sidebar() {
  const location = useLocation();
  const { currency, setCurrency } = useCurrency();
  const { user, isGuest, signOut, signInWithGoogle } = useAuth();
  const { t, currentLanguage, setLanguage } = useLanguage();
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
    }`;

  const sectionLabel = (label: string) => (
    <div className="px-4 pt-4 pb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-sidebar-foreground/30">
      {label}
    </div>
  );

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-border bg-sidebar h-screen sticky top-0">
      {/* Logo/Brand */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="MyMoneyMate" className="w-11 h-11 object-contain shrink-0" />
          <div>
            <p className="text-base font-black text-white uppercase tracking-wide leading-tight">MyMoneyMate</p>
            <p className="text-[10px] text-teal-300 tracking-[0.18em] uppercase font-medium">Track. Budget. Grow.</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {mainNav.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link to={item.path} className={linkClass(item.path)}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{t(item.label)}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {sectionLabel('Planning')}
        <ul className="space-y-0.5">
          {planningNav.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link to={item.path} className={linkClass(item.path)}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                  {'badge' in item && item.badge && (
                    <span className="ml-auto text-[9px] font-bold bg-teal-500 text-white px-1.5 py-0.5 rounded-full tracking-wide">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
          <li>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/40 cursor-default select-none">
              <SavingsIcon className="w-5 h-5 shrink-0" />
              <span>Savings Goals</span>
              <span className="ml-auto text-[9px] font-bold bg-sidebar-foreground/20 text-sidebar-foreground/50 px-1.5 py-0.5 rounded-full tracking-wide">SOON</span>
            </div>
          </li>
        </ul>

        {sectionLabel('Account')}
        <ul className="space-y-0.5">
          {accountNav.map(item => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link to={item.path} className={linkClass(item.path)}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Guest: sign-in prompt */}
      {isGuest && (
        <div className="px-3 pb-2 border-t border-sidebar-border pt-3">
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogIn className="w-5 h-5 text-teal-400" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-teal-400">{t('nav.signIn')}</span>
              <span className="text-xs text-muted-foreground">{t('nav.syncToCloud')}</span>
            </div>
          </button>
        </div>
      )}

      {/* Authenticated: sign out */}
      {user && (
        <div className="px-3 pb-2 border-t border-sidebar-border pt-3">
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
      <div className="px-3 pt-3 border-t border-sidebar-border">
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
      <div className="px-3 pb-2 pt-2">
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
      {/* Contact */}
      <div className="px-3 pb-4 pt-1 text-center">
        <a
          href="mailto:hello@mymoneymate.app"
          className="text-[10px] text-sidebar-foreground/30 hover:text-sidebar-foreground/60 transition-colors"
        >
          hello@mymoneymate.app
        </a>
      </div>
    </aside>
  );
}
