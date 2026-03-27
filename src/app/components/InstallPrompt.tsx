import { Smartphone, X, Download } from 'lucide-react';
import { usePWA } from '../context/PWAContext';

export function InstallPrompt() {
  const { showInstallBanner, promptInstall, dismissInstall } = usePWA();

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-80 z-[250] animate-fade-in-up">
      <div className="bg-card border border-emerald-200 rounded-2xl shadow-xl shadow-black/10 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Install Flow Wealth</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add to your home screen for the full native experience — works offline too.
            </p>
          </div>
          <button
            onClick={dismissInstall}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 -mt-0.5"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={promptInstall}
          className="mt-3 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          Install App
        </button>
      </div>
    </div>
  );
}
