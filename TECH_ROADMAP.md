# MyMoneyMate — Refactor, Testing & Security Roadmap

## Overview

This document covers three workstreams: **code quality & refactoring**, **automated testing**, and **security hardening**. Each item is tagged with a priority (`P1` = do now, `P2` = do soon, `P3` = nice to have) and an estimated effort (`S` = hours, `M` = 1–2 days, `L` = 3+ days).

---

## 1. Code Quality & Refactoring

### 1.1 Eliminate duplicated `readBody` / `readJsonBody` helpers — `P1 · S`

Every API handler (`transactions`, `budgets`, `me`, `auth/email`, `plaid`) defines its own `readBody` or `readJsonBody` function. It's the exact same 15-line promise wrapper in every file.

**Fix:** Extract to `api/_lib/request.ts` and import from there. One place to change if the Node.js runtime ever changes how request bodies are streamed.

---

### 1.2 Type the API handlers properly — `P2 · S`

Every handler signature is `(req: any, res: any)`. This means TypeScript gives zero safety on `req.query`, `req.headers`, `req.body`, etc.

**Fix:** Use `VercelRequest` / `VercelResponse` from `@vercel/node`. This gives autocomplete and catches mistakes like `req.query.id` returning `string | string[]` instead of just `string`.

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) { ... }
```

---

### 1.3 Centralise input validation — `P2 · M`

Validation logic (checking types, trimming strings, checking numeric ranges) is scattered inline in each handler. The transaction handler duplicates the same field checks between `POST` and `PUT`.

**Fix:** Create a `api/_lib/validate.ts` module with small validator functions:

```ts
export function requireString(val: unknown, field: string): string { ... }
export function requireAmount(val: unknown): number { ... }
export function requireEnum<T>(val: unknown, options: T[], field: string): T { ... }
```

---

### 1.4 Consistent error handling across API — `P2 · S`

Some endpoints wrap everything in try/catch and return a 500 (`auth/email`), others let unhandled errors propagate to Vercel's default handler which returns an opaque 500 with no body. The `plaid` handler has no top-level error boundary at all.

**Fix:** Add a shared `withErrorHandler(handler)` wrapper in `api/_lib/request.ts` that catches any unhandled error and always returns `{ error: 'Internal server error' }` with status 500, while logging the real error server-side.

---

### 1.5 Replace `React.ReactNode` with named import in `PlaidContext` — `P1 · S`

`PlaidContext.tsx` uses `React.ReactNode` without importing the `React` namespace. This is a latent TypeScript error that Vite's esbuild silently ignores but strict `tsc` would reject.

```ts
// Fix: change the import to include the type
import { type ReactNode, createContext, ... } from 'react';
// And the prop type:
export function PlaidProvider({ children }: { children: ReactNode }) {
```

---

### 1.6 Add TypeScript as a dev dependency and enable `tsc --noEmit` in CI — `P2 · S`

TypeScript is not listed as a dev dependency. Vite compiles without type checking, so type errors are invisible until Vercel's API compiler catches them (or they break at runtime). This caused the build failure that was hard to diagnose.

**Fix:**
```bash
npm install -D typescript
```
Add a `typecheck` script:
```json
"typecheck": "tsc --noEmit"
```
Add a `tsconfig.json` targeting `ESNext` + `bundler` module resolution. Run `npm run typecheck` in CI before deploy.

---

### 1.7 Split the bundle — `P3 · M`

The single JS bundle is ~1 MB (301 KB gzipped). Vite warns about this on every build.

**Fix:** Add route-based code splitting. Each page import in `routes.ts` becomes a lazy import:
```ts
const Dashboard = lazy(() => import('./pages/Dashboard'));
```
This would drop initial load to roughly 30–40% of current size.

---

## 2. Automated Testing

### Current state
Zero tests exist in the project. All testing is manual.

---

### 2.1 Set up the test framework — `P1 · S`

**Recommended stack:**
- **Vitest** — runs in the same Vite pipeline, near-zero config, fast
- **@testing-library/react** — test components as users use them
- **msw (Mock Service Worker)** — intercept API calls in tests without mocking `fetch`

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event msw
```

Add to `vite.config.ts`:
```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test/setup.ts'],
}
```

---

### 2.2 Unit tests — utility functions — `P1 · S`

These are pure functions with no dependencies and should be tested first:

| File | Functions to test |
|---|---|
| `src/app/utils/dateUtils.ts` | `filterTransactionsByMonth` with all 4 period values, edge cases (empty array, dates at boundaries) |
| `src/app/utils/categoryConfig.ts` | `getCategoryConfig` returns correct icon/colour for every category, fallback for unknown |
| `src/app/utils/budgetAllocator.ts` | Allocation logic with various income levels and edge cases (zero income, single category) |
| `api/_lib/crypto.ts` | `encrypt` → `decrypt` round trip, tampered ciphertext throws, wrong key throws |

---

### 2.3 Unit tests — API validation — `P1 · M`

The transaction handler has the most validation logic. Test it with a minimal in-process harness (no HTTP, just call the handler with mock `req`/`res` objects):

**Scenarios to cover for `POST /api/transactions`:**
- Missing `type` → 400
- Invalid `type` value → 400
- `amount` as string `"25.50"` → accepted, parsed correctly
- Negative `amount` → should this be rejected? (currently it isn't — see security section)
- Missing `description` → 400
- `description` as empty string → 400
- Missing `date` → 400
- No session cookie → 401

Replicate for `PUT` and `DELETE`.

---

### 2.4 Unit tests — auth/email handler — `P1 · M`

**Signup:**
- Name too short → 400
- Invalid email format → 400
- Password < 8 chars → 400
- Email already exists (with password) → 409
- Email already exists (Google account) → 409 with correct message
- Account cap reached → 403
- Happy path → 201, session cookie set

**Signin:**
- Wrong password → 401 (and bcrypt timing is constant — verify the dummy hash is hit)
- User not found → 401
- Google-only account → 401 with correct message
- Happy path → 200, session cookie set

---

### 2.5 Integration tests — API against a real Supabase test project — `P2 · L`

Unit tests with mocked DB calls miss migration drift and constraint errors. The most valuable integration tests hit a real database.

**Setup:**
1. Create a separate Supabase project for testing (free tier is fine)
2. Apply the same schema migrations
3. In CI, set `TEST_SUPABASE_URL` / `TEST_SUPABASE_SERVICE_KEY`
4. Each test suite seeds its own data and cleans up after itself using `afterEach`

**Priority flows:**
- User signup → signin → fetch `/api/me`
- Create transaction → list → update → delete
- Budget upsert → fetch → budget values persist correctly
- Plaid: insert connection → sync produces pending transactions → review accepts → transaction appears in list

---

### 2.6 Component tests — `P2 · M`

Use `@testing-library/react` + msw to intercept fetches:

**Priority components:**
- `AddTransactionModal` — form validation, submit fires correct API call, success closes modal
- `TransactionHistory` — type filter hides/shows correct transactions, category dropdown updates with type, search works
- `Budgets` — smart budget allocation distributes amounts correctly, manual override persists
- `Login` — email/password form shows server errors inline, Google button triggers redirect

---

### 2.7 End-to-end tests — `P3 · L`

**Recommended: Playwright**

```bash
npm install -D @playwright/test
npx playwright install
```

**Critical user journeys:**
1. Guest mode → add 3 transactions → see dashboard totals update
2. Sign up with email → verify redirect to dashboard → session persists on refresh
3. Sign in → add transaction → edit it → delete it → confirm it's gone
4. Set budget → add expense that exceeds it → verify over-budget indicator

Run in CI against a preview deployment URL after each push.

---

## 3. Security

### 3.1 Add rate limiting to all auth endpoints — `P1 · M`

**Current state:** No rate limiting exists anywhere. The `/api/auth/email` endpoint accepts unlimited signin attempts. This enables brute-force attacks against any email address in the system.

**Fix options (in order of effort):**
- **Upstash Redis + `@upstash/ratelimit`** (recommended for Vercel): serverless-compatible, free tier available. Apply a sliding window of 10 requests / 15 minutes per IP for the auth endpoint.
- **Vercel Edge Middleware**: can reject at the CDN level before the function runs.

Apply to: `POST /api/auth/email`, `POST /api/auth/google` (the initiate endpoint).

---

### 3.2 Validate and sanitise `description` field length — `P1 · S`

**Current state:** `description` in the transaction API is checked to be a non-empty string, but there is no maximum length. An attacker could POST a 10 MB description string, which would be stored in the database and returned in every `GET /api/transactions` response forever.

**Fix:**
```ts
if (description.length > 500) {
  res.status(400).json({ error: 'Description too long (max 500 characters)' });
  return;
}
```
Also trim it server-side: `description.trim()`.

---

### 3.3 Validate `amount` has a sensible range — `P1 · S`

**Current state:** `amount` is checked to be a finite number, but there are no bounds. A value of `999999999999` or `-0.0001` will be stored without complaint.

**Fix:**
```ts
if (parsedAmount <= 0 || parsedAmount > 1_000_000) {
  res.status(400).json({ error: 'Amount must be between 0.01 and 1,000,000' });
  return;
}
```

---

### 3.4 Validate `date` is a real date, not just a format match — `P1 · S`

**Current state:** `date` is validated only as a non-empty string. Any string is accepted and passed directly to Supabase. If the DB column isn't strictly typed, a malformed date could cause unpredictable query behaviour.

**Fix:**
```ts
const parsed = new Date(date);
if (isNaN(parsed.getTime())) {
  res.status(400).json({ error: 'Invalid date' });
  return;
}
// Also reject dates more than 10 years in the future
```

---

### 3.5 Validate `category` against an allowlist — `P2 · S`

**Current state:** `category` is accepted as any non-empty string. A client could store arbitrary strings like `<script>alert(1)</script>`. While Supabase stores it safely and React escapes it in render, it creates dirty data and could confuse budget grouping.

**Fix:** Define the allowed category list as a shared constant (already exists in `categoryConfig.ts`) and validate server-side:

```ts
import { VALID_CATEGORIES } from './_lib/categories.js';
if (!VALID_CATEGORIES.has(category)) {
  res.status(400).json({ error: 'Invalid category' });
  return;
}
```

---

### 3.6 Add security headers to all API responses — `P2 · S`

**Current state:** No security headers are set. Browsers apply loose defaults.

Add to `vercel.json`:
```json
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
      {
        "key": "Content-Security-Policy",
        "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.plaid.com; connect-src 'self' https://*.supabase.co https://posthog.com; img-src 'self' data:; frame-src https://cdn.plaid.com"
      }
    ]
  }
]
```

---

### 3.7 Verify Plaid webhook signatures — `P2 · M`

**Current state:** The Plaid webhook handler identifies itself by checking for the `plaid-verification` header, but it does **not verify the JWT signature** of that header. Any request that includes a `plaid-verification` header with any value will be treated as a legitimate Plaid webhook.

**Fix:** Use `plaid.webhookVerificationKeyGet()` and verify the JWT using the `jose` library (already installed):

```ts
import { jwtVerify, createRemoteJWKSet } from 'jose';

const PLAID_JWKS = createRemoteJWKSet(
  new URL('https://production.plaid.com/openid/certs')
);

async function verifyPlaidWebhook(token: string) {
  await jwtVerify(token, PLAID_JWKS, { issuer: 'Plaid, Inc.' });
}
```

---

### 3.8 Restrict Plaid actions to the connection owner — `P2 · S`

**Current state:** The `sync`, `disable`, and `disconnect` actions verify `userId` when querying the DB (Supabase uses `.eq('user_id', userId)`), which is correct. However, the `review` action calls `setPendingStatus(id, userId, status)` where `id` is a `pending_transactions` row ID. The DB query filters by both `id` and `user_id`, so ownership is enforced — this is fine.

**Note:** Confirm that Supabase Row-Level Security (RLS) is also enabled on all tables as a defence-in-depth measure. If the service key is ever leaked, RLS is the last line of defence.

---

### 3.9 Protect against session fixation on Google OAuth — `P3 · S`

**Current state:** The OAuth state cookie uses `SameSite=Lax`, which is appropriate. The state value is a random 16-byte hex string, which is correctly generated with `crypto.randomBytes`. This is implemented correctly.

**Minor improvement:** The `oauth_state` cookie is cleared after use, which is correct. Ensure it is also cleared on error paths (currently it is not — on a failed code exchange, the cookie persists until it expires after 10 minutes).

---

## Summary Table

| # | Item | Priority | Effort |
|---|---|---|---|
| 1.1 | Extract `readBody` helper | P1 | S |
| 1.2 | Type handlers with `VercelRequest/Response` | P2 | S |
| 1.3 | Centralise input validation | P2 | M |
| 1.4 | Consistent error handling | P2 | S |
| 1.5 | Fix `React.ReactNode` import in PlaidContext | P1 | S |
| 1.6 | Add TypeScript + `tsc --noEmit` in CI | P2 | S |
| 1.7 | Route-based code splitting | P3 | M |
| 2.1 | Set up Vitest + Testing Library + msw | P1 | S |
| 2.2 | Unit tests: utility functions | P1 | S |
| 2.3 | Unit tests: API validation | P1 | M |
| 2.4 | Unit tests: auth handler | P1 | M |
| 2.5 | Integration tests against real Supabase | P2 | L |
| 2.6 | Component tests | P2 | M |
| 2.7 | E2E tests with Playwright | P3 | L |
| 3.1 | Rate limiting on auth endpoints | P1 | M |
| 3.2 | Cap `description` field length | P1 | S |
| 3.3 | Bound `amount` to valid range | P1 | S |
| 3.4 | Validate `date` is a real date | P1 | S |
| 3.5 | Validate `category` against allowlist | P2 | S |
| 3.6 | Add security headers in `vercel.json` | P2 | S |
| 3.7 | Verify Plaid webhook JWT signatures | P2 | M |
| 3.8 | Confirm Supabase RLS is enabled | P2 | S |
| 3.9 | Clear `oauth_state` cookie on error paths | P3 | S |

**P1 items** are the most impactful things to do before opening the app to more users. **P2** covers depth and hardening once the P1 baseline is solid. **P3** is polish.
