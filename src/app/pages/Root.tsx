import { Outlet } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { AuthProvider } from '../context/AuthContext';
import { TransactionProvider } from '../context/TransactionContext';
import { CurrencyProvider } from '../context/CurrencyContext';

export function Root() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <TransactionProvider>
          <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 pb-20 lg:pb-0">
              <Outlet />
            </main>
            <MobileNav />
          </div>
        </TransactionProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}