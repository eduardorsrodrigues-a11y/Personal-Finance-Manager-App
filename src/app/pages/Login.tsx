import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Cloud, Monitor } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function Login() {
  const { user, isGuest, loading, signInWithGoogle, enterGuestMode } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (user || isGuest)) navigate('/', { replace: true });
  }, [loading, user, isGuest, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">

        {/* Logo */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-blue-600">{t('login.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('login.subtitle')}</p>
        </div>

        {/* Option 1 — Google sign in */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-emerald-500" />
            <h2 className="font-semibold">{t('login.googleTitle')}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{t('login.googleDesc')}</p>
          <button
            disabled={loading}
            onClick={signInWithGoogle}
            className="w-full py-3 rounded-lg font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('login.googleButton')}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs uppercase tracking-wide">{t('login.or')}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Option 2 — Guest mode */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">{t('login.guestTitle')}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{t('login.guestDesc')}</p>
          <button
            onClick={enterGuestMode}
            className="w-full py-3 rounded-lg font-semibold border border-border hover:bg-accent transition-colors"
          >
            {t('login.guestButton')}
          </button>
        </div>

      </div>
    </div>
  );
}
