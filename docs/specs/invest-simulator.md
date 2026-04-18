# Feature Spec: Investment Simulator ("Where should I put my savings?")

## Overview

A new top-level section in the app that helps PT-based users decide how to allocate a savings amount across financial instruments. The feature does not execute trades — it makes the trade-off between risk and return visible, runs a future-value simulation, and presents curated, up-to-date product options per bucket.

---

## 1. Navigation & Placement

- New item in the sidebar and mobile bottom nav: **"Invest"** (or "Simulate")
- Route: `/invest`
- Available to all authenticated users and guests
- The section is explicitly scoped to **Portugal** — a country notice is shown ("Options shown are available in Portugal. More countries coming soon.")

---

## 2. User Flow

The screen is split into two logical steps that live on the same page (no separate routes — just progressive disclosure):

### Step 1 — Setup Panel

Shown at the top of the page. Always visible and editable.

| Input | Type | Notes |
|---|---|---|
| **Amount available** | Number input (€) | Monthly savings to allocate. Pre-filled from the user's current month savings if available from the dashboard. |
| **Risk profile** | 3-way pill toggle | Safe · Balanced · Growth |
| **Your age** *(optional)* | Number input | Used to suggest a risk profile. Not required. |
| **Time horizon** | Slider | 1 yr → 30 yrs, step 1 yr |

When age is provided, a recommended risk profile badge appears next to the toggle:
- Age < 35 → recommend **Growth**
- Age 35–50 → recommend **Balanced**
- Age > 50 → recommend **Safe**

The user can always override the recommendation.

---

### Step 2 — Allocation & Simulation Panel

Appears immediately below Setup. Recalculates live as any Setup input changes.

#### 2a. Allocation Breakdown

Shows how the amount is split across the three buckets, based on risk profile:

| Profile | Savings Account | ETFs (High Risk) | Futures / Bonds |
|---|---|---|---|
| Safe | 70% | 20% | 10% |
| Balanced | 40% | 40% | 20% |
| Growth | 15% | 65% | 20% |

Each bucket shows:
- % allocation + euro amount
- Colour bar (matching the profile colour scheme — teal/safe, blue/balanced, purple/growth)
- List of recommended products for that bucket (from the data file — see Section 4)
- Each product card shows: name, key metric (TAN %, expected growth %, coupon rate %), euro amount allocated to it, and a link/note on where to open it

#### 2b. Future Value Simulation

A projection section below the allocation:

**Inputs used**: amount, risk profile (which determines blended expected return), time horizon.

**Calculation**:
```
Gross future value = amount × ((1 + monthly_rate)^months - 1) / monthly_rate
Tax on gains = (gross_future_value - total_contributions) × 0.28
Net future value = gross_future_value - tax_on_gains
Total contributions = amount × 12 × years
Net return = net_future_value - total_contributions
```

`monthly_rate` is a blended weighted average of the expected returns of selected products, weighted by their allocation %, converted to monthly.

**Displayed**:
- Large hero number: **Net future value** (after 28% tax on gains)
- Sub-label: "↑ €X,XXX in net returns after 28% tax"
- A comparison row: **Safe** outcome vs **Growth** outcome at the selected horizon (both calculated simultaneously for context)
- A simple area/line chart showing the growth curve over the selected time horizon, with a reference line for total contributions (to visualise the gains area)

**Time horizon slider** is repeated here for convenience (synced with Step 1).

---

## 3. Risk Profile — Age-Based Recommendation Logic

```
if age is not provided → no recommendation shown
if age < 35           → "Based on your age, we suggest Growth"
if age >= 35 && < 50  → "Based on your age, we suggest Balanced"
if age >= 50          → "Based on your age, we suggest Safe"
```

Shown as a subtle banner below the risk toggle. The user can dismiss it or click "Apply suggestion" to switch profile.

---

## 4. Product Data File

A static JSON file maintained manually:

**Path**: `src/data/invest-products.json`

The file has a top-level `updatedAt` ISO date string. This date is displayed to the user on the page: *"Product data last updated: 15 Apr 2026"*

### Schema

```json
{
  "updatedAt": "2026-04-15",
  "savingsAccounts": [
    {
      "id": "caixa-poupanca-plus",
      "name": "Caixa Poupança Plus",
      "institution": "Caixa Geral de Depósitos",
      "tan": 2.75,
      "maxEligibleAmount": 50000,
      "term": "12 months",
      "notes": "Requires existing account. Auto-renews.",
      "url": "https://..."
    }
  ],
  "etfs": [
    {
      "id": "vwce",
      "name": "Vanguard FTSE All-World (VWCE)",
      "ticker": "VWCE",
      "expectedAnnualReturn": 7.0,
      "ter": 0.22,
      "risk": "high",
      "description": "Global equity ETF, 3,600+ companies.",
      "url": "https://..."
    }
  ],
  "futures": [
    {
      "id": "obrigacoes-tesouro-2029",
      "name": "Obrigações do Tesouro 2029",
      "issuer": "República Portuguesa",
      "couponRate": 3.5,
      "expectedAnnualReturn": 3.4,
      "maturityDate": "2029-10-15",
      "minInvestment": 1000,
      "url": "https://..."
    }
  ],
  "pprs": [
    {
      "id": "nbo-ppr-crescimento",
      "name": "NBO PPR Crescimento",
      "institution": "Novo Banco",
      "expectedAnnualReturn": 5.5,
      "risk": "medium",
      "taxBenefit": "20% deduction up to €400/yr (IRS)",
      "notes": "Penalty for early redemption before age 60.",
      "url": "https://..."
    }
  ]
}
```

### Bucket → Product Type Mapping

| Bucket | Product types shown |
|---|---|
| Savings Account | `savingsAccounts` |
| High Risk / High Return | `etfs` + `pprs` (risk = high or medium) |
| Futures / Bonds | `futures` + `pprs` (risk = low) |

For each bucket, show the top 2–3 products by expected return (or TAN for savings). Split the bucket's euro allocation evenly across displayed products (or weight by expected return — TBD during implementation).

---

## 5. Tax Logic

- Tax rate: **28% flat** (Portuguese IRS on investment income — *tributação autónoma*)
- Applied to **gains only**, not to contributions
- PPR has special tax treatment (20% deduction on contributions up to €400/yr) — show as a callout on PPR product cards, but do **not** factor into the simulation formula (too complex to generalise — note it as "additional tax benefit not included in simulation")
- Savings account interest is also subject to 28% withholding at source — the simulation treats all gains uniformly at 28%

---

## 6. UI Components Needed

| Component | Description |
|---|---|
| `InvestPage` | Top-level page component (`src/app/pages/Invest.tsx`) |
| `RiskProfileToggle` | 3-way pill: Safe · Balanced · Growth |
| `AgeRecommendation` | Banner showing suggested profile based on age |
| `AllocationBar` | Horizontal segmented bar showing bucket split |
| `BucketCard` | Card per bucket with product list inside |
| `ProductRow` | Name, metric, allocated amount, external link |
| `SimulationChart` | Area chart: contributions vs gross value over time |
| `SimulationSummary` | Hero net value + returns + Safe vs Growth comparison |
| `TimeHorizonSlider` | 1–30 yr slider, synced across both panels |
| `DataFreshnessNote` | "Product data last updated: [date]" line |

All components follow the existing design system (see `CLAUDE.md`).

---

## 7. Data & State

No backend required for this feature. Everything is client-side:

- Product data: imported from `src/data/invest-products.json` at build time
- User inputs (amount, risk, age, horizon): local component state — **not persisted** (this is a simulator, not a plan)
- No API calls, no database writes

---

## 8. Simulation Chart

- Library: **Recharts** (already in the project)
- X-axis: years (1 → selected horizon)
- Y-axis: euro value
- Two lines: **Net portfolio value** (coloured by risk profile) + **Total contributions** (dashed grey)
- Shaded area between them = net gain region
- Tooltip: year, gross value, tax paid, net value, contributions

---

## 9. Constraints & Disclaimers

- A disclaimer must appear at the bottom of the page: *"This simulation is for informational purposes only and does not constitute financial advice. Past performance is not indicative of future results. Consult a licensed financial advisor before making investment decisions."*
- The app never executes, recommends, or facilitates any transaction
- Products listed are curated manually — no real-time pricing or availability data

---

## 10. Out of Scope (v1)

- Non-PT products
- Lump-sum vs recurring toggle (v1 is always monthly recurring)
- Saving/exporting the simulation
- Comparing multiple scenarios side by side
- Real-time market data integration
- Personalised tax calculation (PPR deductions, married filing, etc.)
- Push notifications or reminders
