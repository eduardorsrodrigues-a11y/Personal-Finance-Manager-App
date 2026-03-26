import { LayoutDashboard, List, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { AddTransactionModal } from './AddTransactionModal';

export function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();
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
            <span className="text-xs">Dashboard</span>
          </Link>

          {/* Add — visually distinct, disabled when not logged in */}
          <div className="flex flex-col items-center justify-center flex-1 -mt-5">
            <button
              onClick={() => user && setIsAddModalOpen(true)}
              disabled={!user}
              className={`flex flex-col items-center justify-center ${!user ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="bg-emerald-500 rounded-full p-3 shadow-lg">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs mt-1 text-muted-foreground">Add</span>
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
            <span className="text-xs">Transactions</span>
          </Link>
        </div>
      </nav>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </>
  );
}
