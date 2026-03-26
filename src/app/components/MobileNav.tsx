import { LayoutDashboard, List, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useState } from 'react';
import { AddTransactionModal } from './AddTransactionModal';

export function MobileNav() {
  const location = useLocation();
  const { user, isGuest } = useAuth();
  const { t } = useLanguage();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <>
      {/* Bottom nav bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {/* Dashboard */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors flex-1 ${
              location.pathname === '/' ? 'text-emerald-500' : 'text-muted-foreground'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs">{t('nav.dashboard')}</span>
          </Link>

          {/* Add */}
          <div className="flex flex-col items-center justify-center flex-1">
            <button
              onClick={() => (user || isGuest) && setIsAddModalOpen(true)}
              disabled={!user && !isGuest}
              className={`flex flex-col items-center justify-center ${!user && !isGuest ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="bg-emerald-500 rounded-full p-3 shadow-lg">
                <Plus className="w-6 h-6 text-white" />
              </div>
            </button>
          </div>

          {/* Transactions */}
          <Link
            to="/transactions"
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors flex-1 ${
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
