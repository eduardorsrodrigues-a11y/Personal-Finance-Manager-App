import { LayoutDashboard, List, Globe } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useCurrency, currencies } from '../context/CurrencyContext';
import { useState } from 'react';

export function MobileNav() {
  const location = useLocation();
  const { currency, setCurrency } = useCurrency();
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: List },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors flex-1 ${
                isActive
                  ? 'text-emerald-500'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Currency Button */}
        <div className="relative flex-1">
          <button
            onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors text-muted-foreground w-full"
          >
            <Globe className="w-5 h-5" />
            <span className="text-xs">{currency.code}</span>
          </button>
          
          {isCurrencyMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsCurrencyMenuOpen(false)}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto z-20">
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
    </nav>
  );
}
