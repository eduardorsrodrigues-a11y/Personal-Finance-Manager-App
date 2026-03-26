# Expense Manager

A full-stack personal finance application for tracking income and expenses, with a dashboard, analytics, and multi-currency support. Built with React + TypeScript on the frontend and Vercel serverless functions + Supabase on the backend.

---

## Features

- **Google OAuth authentication** — sign in securely via Google; sessions managed with HTTP-only JWT cookies
- **Transaction management** — create, edit, and delete income and expense transactions with categories, dates, and descriptions
- **Dashboard analytics** — overview cards (total income, expenses, balance), pie chart breakdown by category, recent transactions list
- **Advanced filtering** — filter by type (income/expense), category, month, or free-text search
- **Multi-currency support** — 12 currencies (USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, MXN, BRL, ZAR), saved per user
- **Responsive design** — desktop sidebar navigation; mobile header with hamburger menu and bottom tab bar

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 6 |
| Styling | Tailwind CSS v4, Radix UI, shadcn/ui |
| State | React Context API |
| Charts | Recharts |
| Backend | Vercel Serverless Functions (Node.js) |
| Database | Supabase (PostgreSQL) |
| Auth | Google OAuth 2.0 + JWT (jose) |
| Deployment | Vercel |

---

## Data Structure

### Database Tables (Supabase / PostgreSQL)

**`users`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `google_sub` | text | Unique Google OAuth subject ID |
| `email` | text | |
| `name` | text | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**`transactions`**
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key → users.id |
| `type` | text | `'income'` or `'expense'` |
| `amount` | numeric(12,2) | |
| `description` | text | |
| `transaction_date` | date | |
| `category` | text | See categories below |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**`user_settings`**
| Column | Type | Notes |
|---|---|---|
| `user_id` | UUID | Primary key, FK → users.id |
| `default_currency` | text | Defaults to `'EUR'` |
| `updated_at` | timestamp | |

### Transaction Categories

| Type | Categories |
|---|---|
| Expense | Food, Housing, Utilities, Transportation, Shopping, Health, Entertainment, Other |
| Income | Salary, Freelance, Investment, Business, Other |

### TypeScript Interface

```ts
interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;         // ISO date string YYYY-MM-DD
  category: string;
}
```

---

## Project Structure

```
├── api/                        # Vercel serverless functions
│   ├── auth/
│   │   ├── google.ts           # Initiate Google OAuth
│   │   ├── google/callback.ts  # OAuth callback, create session
│   │   └── logout.ts           # Clear session cookie
│   ├── transactions.ts         # GET / POST / PUT / DELETE
│   ├── user-settings.ts        # GET / PUT currency preference
│   ├── me.ts                   # GET authenticated user
│   └── lib/
│       └── db.ts               # Supabase client
│
├── src/
│   ├── styles/
│   │   ├── theme.css           # CSS design tokens (colors, radius, etc.)
│   │   ├── fonts.css           # Google Fonts — Inter
│   │   ├── index.css           # Style entry point
│   │   └── tailwind.css        # Tailwind v4 config
│   │
│   └── app/
│       ├── components/
│       │   ├── ui/             # 46 Radix-based primitives (button, card, …)
│       │   ├── AddTransactionModal.tsx
│       │   ├── TransactionFilters.tsx
│       │   ├── Sidebar.tsx
│       │   ├── MobileHeader.tsx
│       │   └── MobileNav.tsx
│       ├── context/
│       │   ├── AuthContext.tsx
│       │   ├── CurrencyContext.tsx
│       │   └── TransactionContext.tsx
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── TransactionHistory.tsx
│       │   ├── Login.tsx
│       │   └── Root.tsx        # Layout shell
│       ├── utils/
│       │   └── dateUtils.ts
│       ├── routes.ts
│       └── App.tsx
│
├── vercel.json                 # SPA route rewrites + API routing
├── vite.config.ts
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with the schema applied
- A Google Cloud project with OAuth 2.0 credentials

### Environment Variables

Create a `.env` file at the project root:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
AUTH_SECRET=a_random_32_char_secret_for_jwt_signing
```

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console → OAuth 2.0 credentials |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console → OAuth 2.0 credentials |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase public anon key |
| `AUTH_SECRET` | Random secret used to sign JWT session tokens |

### Install & Run

```bash
npm install

# Frontend only (Vite dev server, no API)
npm run dev

# Full stack local dev (Vite + Vercel serverless functions)
npx vercel dev
```

> **Note:** Use `npm run dev` for UI development. Use `npx vercel dev` when you need to test API routes (auth, transactions) locally.

---

## API Routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/me` | Returns the authenticated user |
| GET | `/api/auth/google` | Redirects to Google OAuth consent screen |
| GET | `/api/auth/google/callback` | Handles OAuth callback, sets session cookie |
| POST | `/api/auth/logout` | Clears session cookie |
| GET | `/api/transactions` | Returns all transactions for the current user |
| POST | `/api/transactions` | Creates a new transaction |
| PUT | `/api/transactions?id=<id>` | Updates a transaction |
| DELETE | `/api/transactions?id=<id>` | Deletes a transaction |
| GET | `/api/user-settings` | Returns user's currency preference |
| PUT | `/api/user-settings` | Updates user's currency preference |

---

## Deployment

The app is designed to deploy to Vercel with zero configuration beyond environment variables.

1. Push the repo to GitHub
2. Import the project in the [Vercel dashboard](https://vercel.com)
3. Add the environment variables listed above in Vercel → Project Settings → Environment Variables
4. Set the Google OAuth redirect URI to `https://your-domain.vercel.app/api/auth/google/callback`
5. Deploy

The `vercel.json` includes SPA rewrites so that direct navigation to `/transactions` or `/login` works correctly in production without returning a 404.
