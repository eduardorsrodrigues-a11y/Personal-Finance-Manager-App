# MyMoneyMate

A full-stack personal finance app for tracking income and expenses, managing budgets, and simulating investments. Built with React 19 + TypeScript on the frontend and Vercel serverless functions + Supabase on the backend.

---

## Features

- **Authentication** — Google OAuth 2.0 and email/password sign-in; sessions via HTTP-only cookies
- **Transaction management** — create, edit, and delete income and expense transactions with categories, dates, and descriptions
- **Budget tracking** — set monthly budgets per category with smart auto-allocation (50/30/20 rule)
- **Investment simulator** — project future portfolio value across savings accounts, ETFs, bonds, and PPRs based on a configurable risk profile
- **Bank account sync** — connect bank accounts via Plaid; review and import transactions automatically
- **Dashboard analytics** — income/expense summary cards, monthly trend chart, category breakdown
- **Multi-currency support** — 12+ currencies, saved per user
- **Multi-language support** — UI translations via a language context
- **User settings** — profile (name, birthday), default currency, investment risk preference
- **Responsive design** — desktop sidebar + mobile header/bottom nav

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4 (hand-built, no component library) |
| Routing | React Router v7 (lazy-loaded routes) |
| Charts | Recharts |
| Backend | Vercel Serverless Functions (Node.js) |
| Database | Supabase (PostgreSQL) |
| Auth | Google OAuth 2.0 + email/password (bcrypt) + JWT (jose) |
| Bank sync | Plaid |
| Analytics | PostHog |
| Testing | Vitest + Testing Library |
| Deployment | Vercel |

---

## Project Structure

```
├── api/                          # Vercel serverless functions
│   ├── _lib/
│   │   ├── db.ts                 # All Supabase queries
│   │   ├── session.ts            # JWT session helpers
│   │   ├── cookies.ts            # Cookie serialization
│   │   ├── crypto.ts             # AES-256-GCM encryption (Plaid tokens)
│   │   ├── request.ts            # Shared readJsonBody + withErrorHandler
│   │   ├── validate.ts           # Centralised input validators
│   │   ├── categories.ts         # VALID_CATEGORIES allowlist
│   │   ├── rateLimit.ts          # IP-based rate limiting
│   │   └── supabaseAdmin.ts      # Supabase service-role client
│   ├── auth/
│   │   ├── google/               # Initiate Google OAuth
│   │   │   └── callback/         # OAuth callback, create session
│   │   ├── email/                # Email sign-up / sign-in
│   │   └── logout/               # Clear session cookie
│   ├── transactions/             # GET / POST / PUT / DELETE
│   ├── budgets/                  # GET / PUT budgets
│   ├── me/                       # GET + PATCH authenticated user
│   └── plaid/                    # Link token, exchange, webhook, sync
│
├── src/
│   ├── app/
│   │   ├── components/           # Shared UI components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileHeader.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   ├── AddTransactionModal.tsx
│   │   │   ├── TransactionFilters.tsx
│   │   │   └── TimePeriodPicker.tsx
│   │   ├── context/              # React context providers
│   │   │   ├── AuthContext.tsx
│   │   │   ├── TransactionContext.tsx
│   │   │   ├── BudgetContext.tsx
│   │   │   ├── CurrencyContext.tsx
│   │   │   ├── LanguageContext.tsx
│   │   │   ├── PlaidContext.tsx
│   │   │   ├── UserSettingsContext.tsx
│   │   │   └── ToastContext.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── TransactionHistory.tsx
│   │   │   ├── Budgets.tsx
│   │   │   ├── Invest.tsx
│   │   │   ├── BankAccounts.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── Login.tsx
│   │   ├── utils/
│   │   │   ├── categoryConfig.ts  # Icons, colours, hex per category
│   │   │   ├── budgetAllocator.ts # 50/30/20 smart allocation logic
│   │   │   ├── dateUtils.ts       # Period filtering helpers
│   │   │   └── analytics.ts       # PostHog event tracking
│   │   └── routes.ts              # Lazy-loaded route definitions
│   ├── styles/
│   │   └── theme.css              # CSS design tokens (colours, radius)
│   └── test/                      # Vitest unit tests (53 tests)
│
├── migrations/
│   ├── schema.sql                 # Full DB schema — run on a fresh project
│   └── rate_limits.sql            # Rate limits table only
│
├── .env.example                   # Documents all required env vars
├── .github/
│   ├── workflows/ci.yml           # CI: typecheck + tests on every PR
│   └── pull_request_template.md
├── vercel.json                    # SPA rewrites + security headers
└── CLAUDE.md                      # Design system & coding conventions
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Accounts (Google OAuth or email/password) |
| `user_settings` | Currency, risk profile, budgets (JSONB) |
| `transactions` | Income and expense records |
| `plaid_connections` | Linked bank accounts (encrypted access tokens) |
| `pending_transactions` | Plaid transactions awaiting user review |
| `rate_limits` | IP-based request throttling for auth endpoints |

Full schema in `migrations/schema.sql`.

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project with the schema applied
- A Google Cloud project with OAuth 2.0 credentials
- A Vercel account (for full-stack local dev)

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
AUTH_SECRET=<random-hex-32-bytes>
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
PLAID_CLIENT_ID=<plaid-client-id>
PLAID_SECRET=<plaid-secret>
PLAID_ENV=sandbox
ENCRYPTION_KEY=<random-hex-32-bytes>
VITE_POSTHOG_KEY=<posthog-key>
VITE_POSTHOG_HOST=https://app.posthog.com
```

### Install & Run

```bash
npm install

# Frontend only (no API routes)
npm run dev

# Full stack (Vite + Vercel serverless functions)
npx vercel dev
```

### Database Setup

Run `migrations/schema.sql` in your Supabase SQL editor to create all tables.

---

## API Routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/me` | Get authenticated user |
| PATCH | `/api/me` | Update name / birthday |
| GET | `/api/auth/google` | Redirect to Google OAuth |
| GET | `/api/auth/google/callback` | OAuth callback, set session cookie |
| POST | `/api/auth/email` | Sign up or sign in with email/password |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions` | Update transaction |
| DELETE | `/api/transactions` | Delete transaction |
| GET | `/api/budgets` | Get budgets |
| PUT | `/api/budgets` | Update budgets |
| POST | `/api/plaid` | Plaid actions (link, exchange, sync, webhook) |

---

## Testing

```bash
npm test          # Run all tests (53)
npm run typecheck # TypeScript type check
```

Tests cover: date utilities, category config, AES-256-GCM crypto, input validators, and the email auth API handler.

---

## Deployment

### Production (Vercel)

1. Push to `main` — Vercel deploys automatically
2. Set all env vars in Vercel → Project Settings → Environment Variables → **Production**
3. Add `https://your-domain.vercel.app/api/auth/google/callback` as an authorised redirect URI in Google Cloud Console

### Staging (Preview)

1. Push to the `staging` branch — Vercel deploys a preview URL
2. Set env vars for **Preview** in Vercel (point to a separate dev Supabase project, use `PLAID_ENV=sandbox`)
3. Add the staging Vercel URL as an authorised redirect URI in Google Cloud Console

### CI

GitHub Actions runs `npm run typecheck` and `npm test` on every pull request to `main`.

---

## Security

- All API routes validate and sanitise input server-side (`api/_lib/validate.ts`)
- Transaction categories checked against a strict allowlist
- Plaid access tokens encrypted at rest with AES-256-GCM
- Plaid webhooks verified via JWT signature (JWKS)
- Auth endpoints rate-limited by IP (10 requests / 15 min)
- HTTP security headers set in `vercel.json` (CSP, X-Frame-Options, etc.)
- Sessions use HTTP-only, Secure, SameSite=Lax cookies
