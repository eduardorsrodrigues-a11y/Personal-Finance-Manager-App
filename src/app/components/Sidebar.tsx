import { LayoutDashboard, List, DollarSign, Globe, ChevronDown, LogOut, LogIn } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useCurrency, currencies } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export function Sidebar() {
  const location = useLocation();
  const { currency, setCurrency } = useCurrency();
  const { user, isGuest, signOut, signInWithGoogle } = useAuth();
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: List },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-border bg-sidebar h-screen sticky top-0">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-sidebar-foreground">FinanceManager</span>
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

      {/* Guest: sign-in prompt with migration note */}
      {isGuest && (
        <div className="px-4 pb-2 border-t border-sidebar-border pt-4">
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogIn className="w-5 h-5 text-emerald-500" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-emerald-600">Sign in with Google</span>
              <span className="text-xs text-muted-foreground">Your data will sync to cloud</span>
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
              <span className="text-sm">Sign out</span>
              {user.name && (
                <span className="text-xs text-muted-foreground">{user.name}</span>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Currency Selector */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="relative">
          <button
            onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
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
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsCurrencyMenuOpen(false)}
              />
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto z-20">
                {currencies.map((cur) => (
                  <button
                    key={cur.code}
                    onClick={() => {
                      setCurrency(cur);
                      setIsCurrencyMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-muted transition-colors ${
                      currency.code === cur.code ? 'bg-muted' : ''
                    }`}
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
    </aside>
  );
}
