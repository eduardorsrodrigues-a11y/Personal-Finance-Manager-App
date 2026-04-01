import { useState } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import { usePWA } from '../context/PWAContext';

export function InstallPrompt() {
  const { showInstallBanner, showIOSBanner, promptInstall, dismissInstall } = usePWA();
  const [showSteps, setShowSteps] = useState(false);

  // iOS Safari
  if (showIOSBanner) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/60 z-[249]" onClick={dismissInstall} />

        {/* Bottom sheet */}
        <div className="fixed bottom-0 left-0 right-0 z-[250] animate-fade-in-up">
          <div className="bg-card rounded-t-3xl shadow-2xl p-6 pb-10">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="MyMoneyMate" className="w-9 h-9 object-contain shrink-0" />
                <div>
                  <p className="font-bold text-base">MyMoneyMate</p>
                  <p className="text-xs text-muted-foreground">Works offline · No App Store needed</p>
                </div>
              </div>
              <button onClick={dismissInstall} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!showSteps ? (
              /* CTA state */
              <button
                onClick={() => setShowSteps(true)}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                Install App
              </button>
            ) : (
              /* Steps state */
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                  <p className="text-sm">Tap the <span className="inline-flex items-center gap-1 font-semibold text-blue-500"><Share2 className="w-3.5 h-3.5" />Share</span> button below</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                  <p className="text-sm">Tap <span className="font-semibold">"Add to Home Screen"</span></p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                  <p className="text-sm">Tap <span className="font-semibold">"Add"</span> to confirm</p>
                </div>

                {/* Animated arrow pointing to Safari's share button */}
                <div className="flex justify-center pt-1">
                  <div className="flex flex-col items-center gap-1 text-emerald-500">
                    <p className="text-xs font-medium">Share button is down here</p>
                    <svg className="w-5 h-5 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <polyline points="19 12 12 19 5 12" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Chrome / Android
  if (showInstallBanner) {
    return (
      <>
        <div className="fixed inset-0 bg-black/60 z-[249]" onClick={dismissInstall} />
        <div className="fixed bottom-0 left-0 right-0 z-[250] animate-fade-in-up">
          <div className="bg-card rounded-t-3xl shadow-2xl p-6 pb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="MyMoneyMate" className="w-9 h-9 object-contain shrink-0" />
                <div>
                  <p className="font-bold text-base">MyMoneyMate</p>
                  <p className="text-xs text-muted-foreground">Works offline · Installs in seconds</p>
                </div>
              </div>
              <button onClick={dismissInstall} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={promptInstall}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              Install App
            </button>
          </div>
        </div>
      </>
    );
  }

  return null;
}
