import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router';

export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  const message = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown error';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">💸</div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Oops. We dropped a coin.
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Your money is safe, but our app is experiencing a little existential crisis.
            We'll be back soon.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
          Before you use this downtime as an excuse to go shopping — don't.
          Your goals will be exactly the same when we're back. The latte can wait.
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate(0)}
            className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl border border-border hover:bg-muted transition-colors text-sm text-muted-foreground"
          >
            Back to dashboard
          </button>
        </div>

        {message && (
          <p className="text-xs text-muted-foreground/60 font-mono">{message}</p>
        )}
      </div>
    </div>
  );
}
