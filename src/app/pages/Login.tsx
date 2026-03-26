import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Cloud, Monitor } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { user, isGuest, loading, signInWithGoogle, enterGuestMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (user || isGuest)) navigate('/', { replace: true });
  }, [loading, user, isGuest, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">

        {/* Logo */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-blue-600">Expense Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your income and expenses</p>
        </div>

        {/* Option 1 — Google sign in */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-emerald-500" />
            <h2 className="font-semibold">Sign in with Google</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Data is safely backed up to the cloud and synced across all your devices.
          </p>
          <button
            disabled={loading}
            onClick={signInWithGoogle}
            className="w-full py-3 rounded-lg font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with Google
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs uppercase tracking-wide">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Option 2 — Guest mode */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">Continue as Guest</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Data is stored only on this device and will be lost if browser storage is cleared.
            You can sign in with Google later — your data will migrate automatically.
          </p>
          <button
            onClick={enterGuestMode}
            className="w-full py-3 rounded-lg font-semibold border border-border hover:bg-accent transition-colors"
          >
            Continue as Guest
          </button>
        </div>

      </div>
    </div>
  );
}
