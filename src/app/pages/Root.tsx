import { Outlet } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { MobileHeader } from '../components/MobileHeader';
import { AuthProvider } from '../context/AuthContext';
import { TransactionProvider } from '../context/TransactionContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { BudgetProvider } from '../context/BudgetContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ToastProvider } from '../context/ToastContext';
import { PWAProvider } from '../context/PWAContext';
import { InstallPrompt } from '../components/InstallPrompt';
import { SyncIndicator } from '../components/SyncIndicator';

export function Root() {
  return (
    <PWAProvider>
    <LanguageProvider>
    <AuthProvider>
      <CurrencyProvider>
        <TransactionProvider>
          <BudgetProvider>
          <ToastProvider>
            <div className="flex min-h-screen bg-background">
              <Sidebar />
              <MobileHeader />
              <main className="flex-1 pt-14 pb-20 lg:pt-0 lg:pb-0">
                <Outlet />
              </main>
              <MobileNav />
              <InstallPrompt />
              <div className="fixed top-16 lg:top-4 right-4 z-[100] pointer-events-none">
                <div className="pointer-events-auto">
                  <SyncIndicator />
                </div>
              </div>
            </div>
          </ToastProvider>
          </BudgetProvider>
        </TransactionProvider>
      </CurrencyProvider>
    </AuthProvider>
    </LanguageProvider>
    </PWAProvider>
  );
}
