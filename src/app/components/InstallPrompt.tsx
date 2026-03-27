import { Smartphone, X, Download, Share } from 'lucide-react';
import { usePWA } from '../context/PWAContext';

// iOS Share icon — matches the Safari share button exactly
function IOSShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

export function InstallPrompt() {
  const { showInstallBanner, showIOSBanner, promptInstall, dismissInstall } = usePWA();

  // iOS Safari guidance banner
  if (showIOSBanner) {
    return (
      <div className="fixed bottom-24 lg:bottom-6 left-4 right-4 z-[250] animate-fade-in-up">
        <div className="bg-card border border-emerald-200 rounded-2xl shadow-xl shadow-black/10 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Install Flow Wealth</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add to your Home Screen for the full native experience — works offline too.
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

          {/* Step-by-step iOS instructions */}
          <div className="mt-3 bg-muted rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2.5 text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <span className="text-muted-foreground">Tap the</span>
              <span className="inline-flex items-center gap-1 font-medium text-blue-500">
                <Share className="w-3.5 h-3.5" /> Share
              </span>
              <span className="text-muted-foreground">button in Safari</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <span className="text-muted-foreground">Scroll down and tap</span>
              <span className="font-medium">"Add to Home Screen"</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <span className="text-muted-foreground">Tap</span>
              <span className="font-medium">"Add"</span>
              <span className="text-muted-foreground">to confirm</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chrome / Android native install banner
  if (showInstallBanner) {
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

  return null;
}
