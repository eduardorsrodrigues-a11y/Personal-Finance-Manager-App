import { Menu, X, Globe, LogIn, LogOut, ChevronDown, PiggyBank, Languages } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useCurrency, currencies } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { languages } from '../translations';

export function MobileHeader() {
  const { currency, setCurrency } = useCurrency();
  const { user, isGuest, loading, signInWithGoogle, signOut } = useAuth();
  const { t, currentLanguage, setLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
    setIsCurrencyOpen(false);
    setIsLanguageOpen(false);
  }

  return (
    <>
      {/* Header bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-[210] h-14 bg-card border-b border-border flex items-center px-4">
        <button
          onClick={() => (isMenuOpen ? closeMenu() : setIsMenuOpen(true))}
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="absolute left-0 right-0 flex justify-center items-center gap-2 pointer-events-none">
          <div className="w-7 h-7 rounded-lg border border-teal-400/60 bg-white/10 flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.12)] p-0.5">
              <img src="/logo.svg" alt="" className="w-full h-full object-contain" />
            </div>
          <div>
            <p className="text-sm font-black uppercase tracking-wide leading-tight text-foreground">Flow Wealth</p>
            <p className="text-[8px] text-muted-foreground tracking-widest uppercase">Track. Budget. Grow.</p>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[150] bg-black/40" onClick={closeMenu} />
      )}

      {/* Slide-down panel */}
      <div
        className={`lg:hidden fixed top-14 left-0 right-0 z-[200] bg-card border-b border-border shadow-2xl text-foreground overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-[600px] opacity-100 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Budgets nav link */}
        <div className="border-b border-border">
          <Link
            to="/budgets"
            onClick={closeMenu}
            className="flex items-center gap-3 px-4 py-4 w-full hover:bg-muted transition-colors"
          >
            <PiggyBank className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{t('nav.budgets')}</span>
          </Link>
        </div>

        {/* Currency section */}
        <div>
          <button
            onClick={() => { setIsCurrencyOpen(!isCurrencyOpen); setIsLanguageOpen(false); }}
            className="flex items-center gap-3 px-4 py-4 w-full hover:bg-muted transition-colors"
          >
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium flex-1 text-left text-foreground">{t('nav.currency')}</span>
            <span className="text-xs bg-muted text-foreground px-2 py-0.5 rounded-full">{currency.code}</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isCurrencyOpen ? 'rotate-180' : ''}`} />
          </button>

          {isCurrencyOpen && (
            <div className="max-h-48 overflow-y-auto border-t border-border">
              {currencies.map((cur) => (
                <button
                  key={cur.code}
                  onClick={() => { setCurrency(cur); setIsCurrencyOpen(false); }}
                  className={`w-full text-left px-6 py-2.5 hover:bg-muted transition-colors ${currency.code === cur.code ? 'bg-muted' : ''}`}
                >
                  <div className="text-sm font-medium">{cur.code}</div>
                  <div className="text-xs text-muted-foreground">{cur.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Language section */}
        <div className="border-t border-border">
          <button
            onClick={() => { setIsLanguageOpen(!isLanguageOpen); setIsCurrencyOpen(false); }}
            className="flex items-center gap-3 px-4 py-4 w-full hover:bg-muted transition-colors"
          >
            <Languages className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium flex-1 text-left text-foreground">{t('nav.language')}</span>
            <span className="text-xs bg-muted text-foreground px-2 py-0.5 rounded-full">{currentLanguage.code.toUpperCase()}</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isLanguageOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLanguageOpen && (
            <div className="max-h-48 overflow-y-auto border-t border-border">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); setIsLanguageOpen(false); }}
                  className={`w-full text-left px-6 py-2.5 hover:bg-muted transition-colors ${currentLanguage.code === lang.code ? 'bg-muted' : ''}`}
                >
                  <div className="text-sm font-medium">{lang.nativeName}</div>
                  <div className="text-xs text-muted-foreground">{lang.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Login / Logout / Guest section */}
        <div className="border-t border-border">
          {loading ? (
            <div className="px-4 py-4 text-xs text-muted-foreground">{t('nav.loading')}</div>
          ) : user ? (
            <button
              onClick={() => { signOut(); closeMenu(); }}
              className="flex items-center gap-3 px-4 py-4 w-full hover:bg-muted transition-colors"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-foreground">{t('nav.signOut')}</span>
                {user.name && <span className="text-xs text-muted-foreground">{user.name}</span>}
              </div>
            </button>
          ) : isGuest ? (
            <button
              onClick={() => { signInWithGoogle(); closeMenu(); }}
              className="flex items-center gap-3 px-4 py-4 w-full hover:bg-muted transition-colors"
            >
              <LogIn className="w-5 h-5 text-teal-500" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-teal-500">{t('nav.signIn')}</span>
                <span className="text-xs text-muted-foreground">{t('nav.dataMigrate')}</span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => { signInWithGoogle(); closeMenu(); }}
              className="flex items-center gap-3 px-4 py-4 w-full hover:bg-muted transition-colors"
            >
              <LogIn className="w-5 h-5 text-teal-500" />
              <span className="text-sm font-medium text-teal-500">{t('nav.signIn')}</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
