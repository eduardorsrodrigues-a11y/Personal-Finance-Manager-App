import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

const DISMISSED_KEY = 'fw_install_dismissed';

function detectIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|edgios/i.test(ua);
  const isStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  return isIOS && isSafari && !isStandalone;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextType {
  canInstall: boolean;
  showInstallBanner: boolean;
  showIOSBanner: boolean;
  promptInstall: () => Promise<void>;
  dismissInstall: () => void;
  isOnline: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isIOSSafari = detectIOSSafari();

  // Track online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Capture beforeinstallprompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    const installedHandler = () => setCanInstall(false);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  // Engagement: 30s timer
  useEffect(() => {
    const timer = setTimeout(() => setEngaged(true), 30_000);
    return () => clearTimeout(timer);
  }, []);

  // Engagement: first transaction event
  useEffect(() => {
    const handler = () => setEngaged(true);
    window.addEventListener('fw:first-transaction', handler);
    return () => window.removeEventListener('fw:first-transaction', handler);
  }, []);

  // Show banner when eligible (Chrome/Android)
  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (canInstall && engaged && !dismissed) {
      setShowInstallBanner(true);
    }
  }, [canInstall, engaged]);

  // Show iOS guidance banner when eligible
  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (isIOSSafari && engaged && !dismissed) {
      setShowIOSBanner(true);
    }
  }, [isIOSSafari, engaged]);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismissInstall = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setShowInstallBanner(false);
    setShowIOSBanner(false);
  }, []);

  return (
    <PWAContext.Provider value={{ canInstall, showInstallBanner, showIOSBanner, promptInstall, dismissInstall, isOnline }}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const ctx = useContext(PWAContext);
  if (!ctx) throw new Error('usePWA must be used within PWAProvider');
  return ctx;
}
