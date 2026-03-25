import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-8 w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with Google to access your personal finance dashboard.
        </p>
        <button
          disabled={loading}
          onClick={signInWithGoogle}
          className="w-full py-3 rounded-lg font-semibold text-white transition-colors bg-emerald-500 hover:bg-emerald-600"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}

