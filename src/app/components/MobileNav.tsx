import { LayoutDashboard, List, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect, useRef } from 'react';
import { AddTransactionModal } from './AddTransactionModal';

export function MobileNav() {
  const location = useLocation();
  const { user, isGuest } = useAuth();
  const { t } = useLanguage();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      // Only react to intentional scroll movements (ignore iOS bounce / momentum end)
      if (delta > 4 && currentY > 80) {
        setVisible(false);
      } else if (delta < -4 || currentY < 10) {
        setVisible(true);
      }

      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 transition-transform duration-300 ease-in-out"
        style={{ transform: visible ? 'translateY(0)' : 'translateY(calc(100% + 0.75rem))' }}
      >
        <div className="relative flex items-start justify-around h-20 px-2 pt-3">

          {/* Dashboard */}
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors flex-1 ${
              location.pathname === '/' ? 'text-emerald-500' : 'text-muted-foreground'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs">{t('nav.dashboard')}</span>
          </Link>

          {/* Add — floats just above the nav */}
          <div className="flex flex-col items-center flex-1">
            <button
              onClick={() => (user || isGuest) && setIsAddModalOpen(true)}
              disabled={!user && !isGuest}
              className={`absolute -top-3 ${!user && !isGuest ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="bg-emerald-500 rounded-full p-3.5 shadow-xl shadow-emerald-300/60">
                <Plus className="w-6 h-6 text-white" />
              </div>
            </button>
          </div>

          {/* Transactions */}
          <Link
            to="/transactions"
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors flex-1 ${
              location.pathname === '/transactions' ? 'text-emerald-500' : 'text-muted-foreground'
            }`}
          >
            <List className="w-5 h-5" />
            <span className="text-xs">{t('nav.transactions')}</span>
          </Link>

        </div>
      </nav>

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </>
  );
}
