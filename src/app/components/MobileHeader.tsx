import { Menu, X, Globe, LogIn, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useCurrency, currencies } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

export function MobileHeader() {
  const { currency, setCurrency } = useCurrency();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
    setIsCurrencyOpen(false);
  }

  return (
    <>
      {/* Header bar — always on top */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-[210] h-14 bg-card border-b border-border flex items-center px-4">
        <button
          onClick={() => (isMenuOpen ? closeMenu() : setIsMenuOpen(true))}
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Logo centered */}
        <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
          <span className="text-lg font-bold text-blue-600">Expense Manager</span>
        </div>
      </header>

      {/* Backdrop */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[150] bg-black/40"
          onClick={closeMenu}
        />
      )}

      {/* Slide-down panel — collapses via max-h so it never peeks */}
      <div
        className={`lg:hidden fixed top-14 left-0 right-0 z-[200] bg-card border-b border-border shadow-2xl text-foreground overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-[500px] opacity-100 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Currency section */}
        <div>
          <button
            onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
            className="flex items-center gap-3 px-4 py-4 w-full hover:bg-muted transition-colors"
          >
            <Globe className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium flex-1 text-left text-foreground">Currency</span>
            <span className="text-xs bg-muted text-foreground px-2 py-0.5 rounded-full">{currency.code}</span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                isCurrencyOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isCurrencyOpen && (
            <div className="max-h-48 overflow-y-auto border-t border-border">
              {currencies.map((cur) => (
                <button
                  key={cur.code}
                  onClick={() => {
                    setCurrency(cur);
                    setIsCurrencyOpen(false);
                  }}
                  className={`w-full text-left px-6 py-2.5 hover:bg-muted transition-colors ${
                    currency.code === cur.code ? 'bg-muted' : ''
                  }`}
                >
                  <div className="text-sm font-medium">{cur.code}</div>
                  <div className="text-xs text-muted-foreground">{cur.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Login / Logout section */}
        <div className="border-t border-border">
          {loading ? (
            <div className="px-4 py-4 text-xs text-muted-foreground">Loading...</div>
          ) : user ? (
            <button
              onClick={() => { signOut(); closeMenu(); }}
              className="flex items-center gap-3 px-4 py-4 w-full hover:bg-muted transition-colors"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-foreground">Sign out</span>
                {user.name && (
                  <span className="text-xs text-muted-foreground">{user.name}</span>
                )}
              </div>
            </button>
          ) : (
            <button
              onClick={() => { signInWithGoogle(); closeMenu(); }}
              className="flex items-center gap-3 px-4 py-4 w-full hover:bg-muted transition-colors"
            >
              <LogIn className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-500">Sign in with Google</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
