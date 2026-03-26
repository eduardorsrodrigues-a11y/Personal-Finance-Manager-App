# Design System

This document is the single reference for building UI consistently in Expense Manager. It covers design tokens, component patterns, layout conventions, and accessibility guidelines.

---

## 1. Overview

| Concern | Tool |
|---|---|
| Styling | Tailwind CSS v4 (utility-first) |
| Component primitives | Radix UI (headless, accessible) |
| Design tokens | CSS custom properties in `src/styles/theme.css` |
| Icons | lucide-react |
| Class merging | `cn()` — `clsx` + `tailwind-merge` |
| Animations | `tw-animate-css`, Tailwind transitions |

### Key files

| File | Purpose |
|---|---|
| `src/styles/theme.css` | All CSS custom properties (light + dark) |
| `src/styles/fonts.css` | Font imports (Inter) |
| `src/styles/tailwind.css` | Tailwind v4 source directives |
| `src/app/components/ui/utils.ts` | `cn()` helper |
| `src/app/components/ui/` | 46 primitive components |
| `src/app/components/` | Custom app-level components |

---

## 2. Design Tokens

All tokens are CSS custom properties defined in `src/styles/theme.css`. Tailwind is configured to use them via `@theme inline`.

### Color tokens — Light mode (`:root`)

| Token | Value | Usage |
|---|---|---|
| `--background` | `#ffffff` | Page background |
| `--foreground` | `oklch(0.145 0 0)` | Default text |
| `--card` | `#ffffff` | Card/panel backgrounds |
| `--card-foreground` | `oklch(0.145 0 0)` | Text on cards |
| `--primary` | `#030213` | Primary buttons, key actions |
| `--primary-foreground` | `oklch(1 0 0)` | Text on primary |
| `--secondary` | `oklch(0.95 0.0058 264.53)` | Secondary surfaces |
| `--secondary-foreground` | `#030213` | Text on secondary |
| `--muted` | `#ececf0` | Subtle backgrounds, disabled |
| `--muted-foreground` | `#717182` | Secondary/placeholder text |
| `--accent` | `#e9ebef` | Hover states, highlights |
| `--accent-foreground` | `#030213` | Text on accent |
| `--destructive` | `#d4183d` | Errors, delete actions |
| `--destructive-foreground` | `#ffffff` | Text on destructive |
| `--border` | `rgba(0,0,0,0.1)` | Borders, dividers |
| `--input-background` | `#f3f3f5` | Input field backgrounds |
| `--ring` | `oklch(0.708 0 0)` | Focus rings |

### Color tokens — Dark mode (`.dark`)

| Token | Value |
|---|---|
| `--background` | `oklch(0.145 0 0)` |
| `--foreground` | `oklch(0.985 0 0)` |
| `--card` | `oklch(0.145 0 0)` |
| `--primary` | `oklch(0.985 0 0)` |
| `--muted` | `oklch(0.269 0 0)` |
| `--muted-foreground` | `oklch(0.708 0 0)` |
| `--destructive` | `oklch(0.396 0.141 25.723)` |
| `--border` | `oklch(0.269 0 0)` |

### Sidebar tokens

| Token | Light | Dark |
|---|---|---|
| `--sidebar` | `#fafafa` | `oklch(0.205 0 0)` |
| `--sidebar-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--sidebar-accent` | `#f4f4f5` | `oklch(0.269 0 0)` |
| `--sidebar-border` | `#e4e4e7` | `oklch(0.269 0 0)` |

### Chart color palette

Used by Recharts. 5 colors, separate light/dark values.

| Token | Light | Dark |
|---|---|---|
| `--chart-1` | `oklch(0.646 0.222 41.116)` | `oklch(0.488 0.243 264.376)` |
| `--chart-2` | `oklch(0.6 0.118 184.704)` | `oklch(0.696 0.17 162.48)` |
| `--chart-3` | `oklch(0.398 0.07 227.392)` | `oklch(0.769 0.188 70.08)` |
| `--chart-4` | `oklch(0.828 0.189 84.429)` | `oklch(0.627 0.265 303.9)` |
| `--chart-5` | `oklch(0.769 0.188 70.08)` | `oklch(0.645 0.246 16.439)` |

---

## 3. Color Palette — Semantic Groups

### Status colors (not in CSS vars — Tailwind utilities)

Used for income, expense, and balance indicators throughout the UI.

| Semantic | Tailwind classes | Usage |
|---|---|---|
| Income / Success | `text-emerald-600`, `bg-emerald-100`, `border-emerald-200` | Income amounts, positive values |
| Expense / Danger | `text-red-600`, `bg-red-100`, `border-red-200` | Expense amounts, negative values |
| Balance / Info | `text-blue-600`, `bg-blue-100` | Current balance card |
| Brand | `text-blue-600 font-bold` | "Expense Manager" logo |
| Interactive | `text-emerald-500`, `bg-emerald-500` | Active nav, Add button, CTA |

### Metric card pattern

```tsx
// Income card
<div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
  <TrendingUp className="w-5 h-5 text-emerald-600" />
</div>
<p className="text-3xl font-semibold text-emerald-600">{amount}</p>

// Expense card
<div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
  <TrendingDown className="w-5 h-5 text-red-600" />
</div>
<p className="text-3xl font-semibold text-red-600">{amount}</p>
```

---

## 4. Typography

### Font

**Inter** (Google Fonts) — loaded in `src/styles/fonts.css`
Weights loaded: 400, 500, 600, 700.

```css
font-family: 'Inter', sans-serif;
font-size: 16px; /* base */
```

### Size scale (Tailwind)

| Class | Size | Usage |
|---|---|---|
| `text-xs` | 12px | Badges, timestamps, secondary labels |
| `text-sm` | 14px | Body text, form labels, filter chips |
| `text-base` | 16px | Default body, buttons |
| `text-lg` | 18px | Card subtitles, section headings |
| `text-xl` | 20px | Page sub-headings |
| `text-2xl` | 24px | Page titles (h2) |
| `text-3xl` | 30px | Metric values (e.g., €28.00) |

### Weight scale

| Class | Weight | Usage |
|---|---|---|
| `font-normal` | 400 | Body text, descriptions |
| `font-medium` | 500 | Labels, nav items, table headers |
| `font-semibold` | 600 | Card titles, group headings |
| `font-bold` | 700 | Logo, main page title |

---

## 5. Spacing & Border Radius

### Spacing — common patterns

| Usage | Classes |
|---|---|
| Page horizontal padding | `px-4 lg:px-8` |
| Page vertical padding | `py-6 lg:py-8` |
| Card interior | `p-6` |
| Component gap | `gap-4` or `gap-6` |
| Form field gap | `space-y-4` |
| Icon + text | `gap-2` |

### Border radius

Base: `--radius: 0.625rem` (10px)

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `--radius-sm` | 6px | `rounded-md` | Inputs, selects |
| `--radius-md` | 8px | `rounded-lg` | Buttons, chips |
| `--radius-lg` | 10px | `rounded-xl` | Cards |
| `--radius-xl` | 14px | `rounded-2xl` | Modals, panels |

---

## 6. Core UI Components

All primitives are in `src/app/components/ui/`. Import with:

```ts
import { Button } from '@/app/components/ui/button';
```

### Button

| Variant | When to use |
|---|---|
| `default` | Primary action (dark background) |
| `destructive` | Delete, irreversible actions |
| `outline` | Secondary, bordered |
| `secondary` | Less prominent actions |
| `ghost` | Tertiary, no background |
| `link` | Inline text links |

| Size | Height | When to use |
|---|---|---|
| `default` | 36px | Standard |
| `sm` | 32px | Compact toolbars |
| `lg` | 40px | Prominent CTAs |
| `icon` | 36×36px | Icon-only buttons |

```tsx
<Button variant="default">Save</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="ghost" size="icon"><Trash2 className="w-4 h-4" /></Button>
```

### Card

Compound component. Use `CardHeader + CardTitle + CardContent` as the standard shell.

```tsx
<Card>
  <CardHeader>
    <CardTitle>Total Income</CardTitle>
    <CardAction><Button size="icon" variant="ghost">...</Button></CardAction>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-semibold text-emerald-600">€1,200.00</p>
  </CardContent>
</Card>
```

### Badge

```tsx
<Badge variant="default">Active</Badge>
<Badge variant="destructive">Overdue</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="outline">Pending</Badge>
```

### Input

```tsx
<Input type="text" placeholder="Search transactions…" />
<Input type="number" placeholder="0.00" />
```

### Select (Radix)

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="food">Food</SelectItem>
    <SelectItem value="housing">Housing</SelectItem>
  </SelectContent>
</Select>
```

### Dialog

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Transaction</DialogTitle>
      <DialogDescription>Fill in the details below.</DialogDescription>
    </DialogHeader>
    {/* form */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Table

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Date</TableHead>
      <TableHead>Description</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Jan 1</TableCell>
      <TableCell>Groceries</TableCell>
      <TableCell className="text-right text-red-600">-€28.00</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## 7. Custom App Components

### `AddTransactionModal`
`src/app/components/AddTransactionModal.tsx`

| Prop | Type | Default | Description |
|---|---|---|---|
| `isOpen` | `boolean` | — | Controls visibility |
| `onClose` | `() => void` | — | Called on close/submit |
| `mode` | `'add' \| 'edit'` | `'add'` | Form mode |
| `initialTransaction` | `Transaction \| null` | `null` | Pre-fills form in edit mode |

Features: type toggle (income/expense), amount, description, date, category select, color-coded submit button.

### `TransactionFilters`
`src/app/components/TransactionFilters.tsx`

| Prop | Type | Description |
|---|---|---|
| `selectedType` | `string` | `'all' \| 'income' \| 'expense'` |
| `onTypeChange` | `(v: string) => void` | |
| `selectedCategory` | `string` | |
| `onCategoryChange` | `(v: string) => void` | |
| `selectedMonth` | `string` | |
| `onMonthChange` | `(v: string) => void` | |
| `availableMonths` | `string[]` | |
| `availableCategories` | `string[]` | |
| `showTypeFilter?` | `boolean` | Defaults to `true` |
| `showCategoryFilter?` | `boolean` | Defaults to `true` |

### `Sidebar`
`src/app/components/Sidebar.tsx`

Desktop-only (`hidden lg:flex`). Contains: logo, navigation links, sign-out button (shown when authenticated), currency selector dropdown.

### `MobileHeader`
`src/app/components/MobileHeader.tsx`

Mobile-only (`lg:hidden`). Fixed top bar (`h-14`, `z-[210]`). Contains: hamburger button (left), "Expense Manager" logo (centered). Opens a slide-down panel (`z-[200]`) with currency selector and login/logout.

### `MobileNav`
`src/app/components/MobileNav.tsx`

Mobile-only (`lg:hidden`). Fixed bottom bar (`h-16`, `z-50`). Three items: Dashboard, Add (raised emerald circle, disabled when logged out), Transactions. Renders `AddTransactionModal` internally.

---

## 8. Layout Patterns

### Page shell (Root.tsx)

```
<div class="flex min-h-screen bg-background">
  <Sidebar />                        <!-- desktop only, w-64 sticky -->
  <MobileHeader />                   <!-- mobile only, fixed top h-14 -->
  <main class="flex-1 pt-14 pb-20 lg:pt-0 lg:pb-0">
    <Outlet />                       <!-- page content -->
  </main>
  <MobileNav />                      <!-- mobile only, fixed bottom h-16 -->
</div>
```

Mobile offsets: `pt-14` (header) + `pb-20` (bottom nav) on `<main>`.

### Sticky page header

```tsx
<div className="sticky top-0 lg:top-0 z-40 bg-background border-b border-border">
  <div className="px-4 lg:px-8 py-4 lg:py-6">
    <h1 className="text-2xl font-bold">Page Title</h1>
  </div>
</div>
```

On mobile, `top-0` is offset to `top-14` by the MobileHeader.

### Responsive metric grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
  <MetricCard />
  <MetricCard />
  <MetricCard />
</div>
```

### Two-column chart/list layout

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
  <PieChartCard />
  <RecentTransactionsCard />
</div>
```

### Empty state

```tsx
<div className="bg-card border border-border rounded-xl p-12 text-center">
  <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
  <h3 className="font-semibold mb-2">No transactions yet</h3>
  <p className="text-sm text-muted-foreground">Add your first transaction to get started.</p>
</div>
```

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Key changes |
|---|---|---|
| (default) | 0px+ | Single column, bottom nav, top header, stacked filters |
| `sm` | 640px+ | Filters go from column to row, some labels appear |
| `md` | 768px+ | Metric grid becomes 3-column |
| `lg` | 1024px+ | Sidebar appears, MobileHeader/MobileNav hidden, 2-column layouts, increased padding |

### Visibility toggles

```tsx
// Show only on mobile
<div className="lg:hidden">...</div>

// Show only on desktop
<div className="hidden lg:flex">...</div>

// Hide label on mobile, show on tablet+
<span className="hidden sm:inline">Label</span>
```

---

## 10. Icons

Library: **lucide-react** (`import { IconName } from 'lucide-react'`)

### Sizing convention

| Size | Class | Usage |
|---|---|---|
| Small | `w-4 h-4` | Inside buttons, badges |
| Default | `w-5 h-5` | Nav items, form icons |
| Large | `w-6 h-6` | Add button (bottom nav) |
| Display | `w-8 h-8` to `w-16 h-16` | Empty states, metric icons |

### Common icons by category

| Category | Icons |
|---|---|
| Navigation | `LayoutDashboard`, `List`, `Menu`, `X` |
| Actions | `Plus`, `Trash2`, `Edit`, `Search` |
| Finance | `TrendingUp`, `TrendingDown`, `Wallet`, `DollarSign` |
| Transaction categories | `ShoppingCart`, `Home`, `Utensils`, `Car`, `Film`, `Heart`, `Zap`, `Briefcase` |
| Auth | `LogIn`, `LogOut` |
| UI | `ChevronDown`, `Globe`, `Calendar` |

---

## 11. Accessibility

### Focus ring (consistent across all interactive elements)

```css
/* Applied globally in theme.css */
outline-ring/50    /* semi-transparent ring */
focus-visible:ring-[3px]
focus-visible:ring-ring/50
focus-visible:border-ring
```

### Disabled states

```tsx
// Visually disabled
className="disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"

// Conditionally disabled (e.g. Add button when logged out)
<button disabled={!user} className={!user ? 'opacity-40 cursor-not-allowed' : ''}>
```

### ARIA patterns used

```tsx
// Icon-only button
<button aria-label="Open menu"><Menu /></button>

// Screen-reader-only text
<span className="sr-only">Close dialog</span>

// Invalid input state (triggers red border + ring via CSS)
<input aria-invalid={!!error} />
```

---

## 12. Utility: `cn()`

`src/app/components/ui/utils.ts`

Merges Tailwind classes safely — deduplicates conflicting utilities (e.g., `p-2 p-4` → `p-4`).

```ts
import { cn } from '@/app/components/ui/utils';

// Conditionally apply classes
<div className={cn('base-class', isActive && 'active-class', className)} />

// Merge variants with overrides
<button className={cn(buttonVariants({ variant, size }), className)} />
```

Always use `cn()` instead of string concatenation or raw `clsx` when building components.

---

## 13. Adding a New Component

Checklist when building a new UI component:

1. Use tokens — reference `bg-card`, `text-foreground`, `border-border` etc. rather than raw colors
2. Use `cn()` for all class merging
3. Add `text-foreground` explicitly when a component has `bg-card` as background (prevents invisible text in some themes)
4. Support disabled state with `disabled:opacity-50 disabled:cursor-not-allowed`
5. Add `focus-visible` styles or inherit them via Radix primitives
6. Use `lg:hidden` / `hidden lg:flex` for responsive show/hide
7. Keep z-index in range: page content = default, sticky headers = `z-40`, modals/overlays = `z-50`+
