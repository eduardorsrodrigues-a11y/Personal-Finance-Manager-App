# MyMoneyMate — Design System & Project Guide

## Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (utility-first, no component library)
- **Routing**: React Router v7
- **Backend**: Vercel serverless functions (`/api/`)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Google OAuth via session cookies
- **Analytics**: PostHog (`src/app/utils/analytics.ts`)

---

## Design Tokens

All tokens are CSS custom properties defined in `src/styles/theme.css` and mapped into Tailwind via `@theme inline`.

### Colours — Light Mode

| Token | Value | Usage |
|---|---|---|
| `--background` | `#f3f8fd` | Page background (subtle blue-white tint) |
| `--foreground` | `#0d2d52` | Default text |
| `--card` | `#ffffff` | Card / panel surfaces |
| `--card-foreground` | `#0d2d52` | Text on cards |
| `--muted` | `#e4eff8` | Subtle backgrounds, section headers |
| `--muted-foreground` | `#5b7a9c` | Secondary / helper text |
| `--border` | `rgba(37,99,235,0.12)` | Borders, dividers |
| `--input-background` | `#eaf2f9` | Input field backgrounds |
| `--primary` | `#0d2d52` | Primary actions (dark navy) |
| `--destructive` | `#d4183d` | Errors, delete actions |
| `--ring` | `#14b8a6` | Focus rings |
| `--sidebar` | `#0d2d52` | Sidebar background (dark navy) |
| `--sidebar-foreground` | `#e2f0ff` | Sidebar text |
| `--sidebar-primary` | `#14b8a6` | Sidebar active state (teal) |

### Brand Accent Colours (Tailwind utilities, not CSS vars)

| Colour | Hex | Usage |
|---|---|---|
| Teal / Brand | `#14b8a6` (`teal-500`) | Primary CTA, smart budget, active states |
| Emerald | `#10b981` (`emerald-500`) | Income, positive values, add transaction |
| Red | `#ef4444` (`red-500`) | Expenses, negative values, over-budget |
| Amber | `#f59e0b` (`amber-500`) | Warning / near-budget |
| Navy | `#0d2d52` | Sidebar, primary text |

### Radius

| Token | Value |
|---|---|
| `--radius-sm` | `0.375rem` |
| `--radius-md` | `0.5rem` |
| `--radius-lg` | `0.625rem` (base `--radius`) |
| `--radius-xl` | `0.875rem` |

Cards and modals use `rounded-xl` (0.875rem). Buttons use `rounded-xl` or `rounded-lg`.

### Typography

- **Font**: Inter (Google Fonts — 400, 500, 600, 700)
- `h1` → `text-2xl medium`
- `h2` → `text-xl medium`
- `h3` → `text-lg medium`
- Body → `text-sm` or `text-base`
- Labels / helper text → `text-xs`

---

## Component Patterns

### Cards

```tsx
<div className="bg-card border border-border rounded-xl p-4">
  ...
</div>
```

### Section Headers (inside cards)

```tsx
<div className="px-4 py-2 bg-muted/50 border-b border-border">
  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
    🏠  Needs
  </p>
</div>
```

### Primary CTA Button

```tsx
<button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors">
  <Sparkles className="w-4 h-4" />
  Smart Setup
</button>
```

### Destructive / Secondary Button

```tsx
<button className="text-xs text-red-500 hover:text-red-600 underline">
  Clear all
</button>
```

### Ghost / Text Button

```tsx
<button className="text-xs text-muted-foreground hover:text-foreground underline">
  Switch to manual budget mode
</button>
```

### Teal Pill (e.g. "View full screen")

```tsx
<button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 border border-teal-200 dark:border-teal-800 transition-colors">
  View full screen
</button>
```

### Modal

Bottom-sheet on mobile, centred on desktop:

```tsx
<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
  <div className="bg-card w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
      <p className="font-semibold text-sm">Title</p>
      <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
    {/* Body */}
    <div className="px-5 py-5">...</div>
    {/* Footer */}
    <div className="flex gap-3 px-5 pb-5">
      <button className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors">Save</button>
    </div>
  </div>
</div>
```

### Full-screen Overlay Modal

```tsx
<div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
<div className="fixed inset-4 lg:inset-6 z-50 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
  {/* header + scrollable body */}
</div>
```

### List Row (clickable)

```tsx
<button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left">
  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
    <Icon className={`w-4 h-4 ${text}`} />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium truncate">Label</p>
  </div>
  <span className="text-sm font-semibold" style={{ color: hex }}>€100</span>
  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
</button>
```

### Metric Card (dashboard summary)

```tsx
<div className="bg-card border border-border rounded-xl p-4">
  <div className="flex items-center gap-2 mb-2">
    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
      <TrendingUp className="w-4 h-4 text-emerald-600" />
    </div>
    <p className="text-xs text-muted-foreground">Total Income</p>
  </div>
  <p className="text-xl font-semibold text-emerald-600 truncate">€2,400</p>
</div>
```

### Tab Toggle (pill-style)

```tsx
<div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
  <button className="px-4 py-2 text-sm font-medium rounded-lg bg-card shadow-sm text-foreground">Monthly</button>
  <button className="px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground">Annually</button>
</div>
```

### Category Icon Badge

```tsx
<div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
  <Icon className={`w-4 h-4 ${text}`} />
</div>
```

Sizes: `w-7 h-7` (small), `w-8 h-8` (medium), `w-9 h-9` (standard), `w-10 h-10` (large).

### Progress / Budget Bar

```tsx
<div className="h-1.5 bg-muted rounded-full overflow-hidden">
  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: hex }} />
</div>
```

### Toast

Managed via `useToast()` from `src/app/context/ToastContext.tsx`. Call `showToast('message')`.

---

## Colour Semantics

| Context | Colour |
|---|---|
| Income / positive | `emerald-600` / `text-emerald-600` |
| Expense / negative | `red-500` / `text-red-500` |
| Over budget | `red-500` |
| Near budget (90–100%) | `amber-500` |
| Under budget (<90%) | category hex or `emerald` |
| Smart / AI feature | `teal-500` |
| Needs bucket | `blue-600` |
| Wants bucket | `purple-600` |
| Savings | `emerald-600` |

---

## Category System

Categories are defined in `src/app/utils/categoryConfig.ts`.

**Expense — Needs**: Housing, Debt Payments, Utilities, Health, Groceries, Transportation
**Expense — Wants**: Food, Shopping, Entertainment, Travel, Gifts, Gym & Sports, Family & Personal, Other
**Income**: Salary, Freelance, Investment, Business, RSUs, Cashback, Holiday Allowance, Meal Allowance, Other

Each category has: `icon` (Lucide), `bg` (Tailwind bg class), `text` (Tailwind text class), `hex` (colour string).

---

## Layout

- **Sidebar**: Fixed left, `w-64`, dark navy (`bg-sidebar`). Hidden on mobile.
- **Mobile header**: Fixed top, `h-14`. Shown on mobile only.
- **Mobile nav**: Fixed bottom, shown on mobile only.
- **Main content**: `flex-1`, `pt-14 pb-24 lg:pt-0 lg:pb-0` (accounts for mobile header/nav).
- **Page padding**: `px-4 lg:px-8 py-6 lg:py-8`
- **Max content width**: none (full width within main area)
- **Breakpoints**: mobile-first; `lg:` (1024px) is the primary desktop breakpoint.

---

## Icons

Lucide React. Standard sizes:
- `w-4 h-4` — inline / list icons
- `w-5 h-5` — button icons
- `w-6 h-6` — nav / header icons

---

## Key Files

| File | Purpose |
|---|---|
| `src/styles/theme.css` | All CSS variables + dark mode |
| `src/app/utils/categoryConfig.ts` | Category icons, colours, hex values |
| `src/app/utils/budgetAllocator.ts` | NEEDS_CATEGORIES, WANTS_CATEGORIES, budget logic |
| `src/app/context/` | Auth, Transactions, Budgets, Currency, Language, Toast |
| `src/app/pages/` | Dashboard, TransactionHistory, Budgets, Login, Root |
| `src/app/components/` | All shared UI components |
| `src/app/utils/analytics.ts` | PostHog event tracking |
| `api/` | Vercel serverless functions |

---

## Coding Conventions

- No component library (shadcn, MUI, etc.) — all UI is hand-built with Tailwind utilities.
- Dark mode via `.dark` class on `<html>`. Use `dark:` variants freely.
- All monetary values formatted via `formatAmount()` from `useCurrency()`.
- All category names translated via `tCategory()` from `useLanguage()`.
- Contexts are the source of truth — never fetch data directly in page components.
- Fire analytics events via `track.*` from `src/app/utils/analytics.ts` for meaningful user actions.
