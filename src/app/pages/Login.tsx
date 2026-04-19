import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, AlertTriangle, Eye, EyeOff, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VALUE_PROPS = [
  { headline: 'Keep track', sub: 'of every transaction, anywhere, anytime.' },
  { headline: 'Save', sub: 'build habits that compound over time.' },
  { headline: 'Make your money worth more', sub: 'understand exactly where every cent goes.' },
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

type EmailMode = 'signin' | 'signup';

function EmailForm({
  signInWithEmail,
  signUpWithEmail,
}: {
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
  signUpWithEmail: (name: string, email: string, birthday: string, password: string) => Promise<string | null>;
}) {
  const [mode, setMode] = useState<EmailMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: EmailMode) => {
    setMode(next);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup') {
      if (!name.trim()) { setError('Name is required.'); return; }
      if (!birthday) { setError('Birthday is required.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    }

    setSubmitting(true);
    const err = mode === 'signin'
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(name.trim(), email, birthday, password);
    setSubmitting(false);
    if (err) setError(err);
  };

  const inputClass = 'w-full px-3 py-2.5 text-sm bg-input-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors placeholder:text-muted-foreground/50';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {mode === 'signup' && (
        <>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Full name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="João Silva"
              autoComplete="name"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Birthday</label>
            <input
              type="date"
              value={birthday}
              onChange={e => setBirthday(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
              className={inputClass}
            />
          </div>
        </>
      )}

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            className={`${inputClass} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mode === 'signup' && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Confirm password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            className={inputClass}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-foreground hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {mode === 'signin' ? 'Sign in' : 'Create account'}
      </button>

      <p className="text-center text-xs text-muted-foreground pt-1">
        {mode === 'signin' ? (
          <>Don't have an account?{' '}
            <button type="button" onClick={() => switchMode('signup')} className="text-foreground font-semibold hover:underline">Sign up</button>
          </>
        ) : (
          <>Already have an account?{' '}
            <button type="button" onClick={() => switchMode('signin')} className="text-foreground font-semibold hover:underline">Sign in</button>
          </>
        )}
      </p>
    </form>
  );
}

export function Login() {
  const { user, isGuest, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, enterGuestMode } = useAuth();
  const navigate = useNavigate();

  const [propIndex, setPropIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [emailExpanded, setEmailExpanded] = useState(false);

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
      <div className="w-full max-w-2xl flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">

          {/* Google — recommended */}
          <div className="relative flex flex-col rounded-2xl border-2 border-emerald-500 bg-card shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20 p-6 gap-5">
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
                  <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.ok ? 'bg-muted' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                    {item.ok
                      ? <Check className="w-2.5 h-2.5 text-muted-foreground" />
                      : <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />}
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

        {/* Email — collapsed */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setEmailExpanded(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <span>Sign in with email</span>
            <ChevronDown
              className="w-4 h-4 transition-transform duration-200"
              style={{ transform: emailExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: emailExpanded ? 600 : 0, opacity: emailExpanded ? 1 : 0 }}
          >
            <div className="px-5 pb-5 border-t border-border pt-4">
              <EmailForm signInWithEmail={signInWithEmail} signUpWithEmail={signUpWithEmail} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
