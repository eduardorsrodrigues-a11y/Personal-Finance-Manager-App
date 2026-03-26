import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VALUE_PROPS = [
  {
    headline: 'Keep track',
    sub: 'of every transaction, anywhere, anytime.',
  },
  {
    headline: 'Save',
    sub: 'build habits that compound over time.',
  },
  {
    headline: 'Make your money worth more',
    sub: 'understand exactly where every cent goes.',
  },
];

const GOOGLE_FEATURES = [
  'Data safely synced across all your devices',
  'Never lose your data',
  'Access from any browser, anytime',
  'Secure & private — no passwords needed',
];

const GUEST_LIMITATIONS = [
  { ok: true,  text: 'No account needed, start immediately' },
  { ok: false, text: 'Data stored only on this device' },
  { ok: false, text: 'No cloud backup or sync' },
];

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.96 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export function Login() {
  const { user, isGuest, loading, signInWithGoogle, enterGuestMode } = useAuth();
  const navigate = useNavigate();

  const [propIndex, setPropIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!loading && (user || isGuest)) navigate('/', { replace: true });
  }, [loading, user, isGuest, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPropIndex((i) => (i + 1) % VALUE_PROPS.length);
        setVisible(true);
      }, 450);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const prop = VALUE_PROPS[propIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-10">

      {/* Hero */}
      <div className="text-center space-y-4">
        {/* Animated value prop */}
        <div className="h-14 flex flex-col items-center justify-center">
          <div
            style={{
              transition: 'opacity 0.45s ease, transform 0.45s ease',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(-10px)',
            }}
            className="text-center"
          >
            <p className="text-xl font-semibold text-foreground">{prop.headline}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{prop.sub}</p>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-1.5">
          {VALUE_PROPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-500"
              style={{
                width: i === propIndex ? 20 : 6,
                height: 6,
                background: i === propIndex ? '#10b981' : 'var(--border)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">

        {/* Google — recommended */}
        <div className="relative flex flex-col rounded-2xl border-2 border-emerald-500 bg-card shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20 p-6 gap-5">
          {/* Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full tracking-wide uppercase">
              Recommended
            </span>
          </div>

          <div className="pt-2 space-y-1">
            <h2 className="text-lg font-bold">Sign in with Google</h2>
            <p className="text-xs text-muted-foreground">Full experience, everywhere</p>
          </div>

          <ul className="space-y-2.5 flex-1">
            {GOOGLE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <button
            disabled={loading}
            onClick={signInWithGoogle}
            className="w-full py-3 rounded-xl font-semibold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
          >
            <GoogleIcon size={18} />
            Continue with Google
          </button>
        </div>

        {/* Guest */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6 gap-5 opacity-90">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-muted-foreground">Continue as Guest</h2>
            <p className="text-xs text-muted-foreground">Limited to this device</p>
          </div>

          <ul className="space-y-2.5 flex-1">
            {GUEST_LIMITATIONS.map((item) => (
              <li key={item.text} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span
                  className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.ok
                      ? 'bg-muted'
                      : 'bg-amber-100 dark:bg-amber-900/30'
                  }`}
                >
                  {item.ok
                    ? <Check className="w-2.5 h-2.5 text-muted-foreground" />
                    : <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                  }
                </span>
                {item.text}
              </li>
            ))}
          </ul>

          <button
            onClick={enterGuestMode}
            className="w-full py-3 rounded-xl font-semibold border border-border hover:bg-muted active:scale-[0.98] transition-all text-muted-foreground text-sm"
          >
            Continue as Guest
          </button>
        </div>

      </div>
    </div>
  );
}
