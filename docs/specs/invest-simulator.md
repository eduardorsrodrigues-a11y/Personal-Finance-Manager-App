# Feature Spec: Investment Simulator ("Where should I put my savings?")

## Overview

A new top-level section in the app that helps PT-based users decide how to allocate a savings amount across financial instruments. The feature does not execute trades — it makes the trade-off between risk and return visible, runs a future-value simulation, and presents curated, up-to-date product options per bucket.

---

## 1. Navigation & Placement

- New item in the sidebar and mobile bottom nav: **"Invest"**
- Route: `/invest`
- Available to all authenticated users and guests
- The section is explicitly scoped to **Portugal** — a country notice is shown at the top: *"Options shown are available in Portugal. More countries coming soon."*

---

## 2. User Flow

Single page with progressive disclosure — no separate routes. The allocation and simulation panels appear as soon as a valid amount is entered.

### Step 1 — Setup Panel

Shown at the top of the page. Always visible and editable after initial entry.

| Input | Type | Default | Notes |
|---|---|---|---|
| **Amount available** | Number input (€) | **Empty** | User types their monthly savings. No pre-fill — keeps the experience neutral and avoids privacy concerns. Simulation panel is hidden until a value > 0 is entered. |
| **Risk profile** | 3-way pill toggle | Balanced | Safe · Balanced · Growth |
| **Your age** *(optional)* | Number input | Empty | Used only to generate a suggested risk profile. Never stored or sent anywhere. |
| **Time horizon** | Slider | 10 years | Range: 1 yr → 30 yrs, step 1 yr |

#### Age-Based Risk Recommendation

When age is provided, a subtle dismissible banner appears below the risk toggle:

```
Age < 35    → "Based on your age, we suggest Growth"
Age 35–50   → "Based on your age, we suggest Balanced"
Age > 50    → "Based on your age, we suggest Safe"
```

The banner has two actions: **Apply suggestion** (switches the toggle) and **Dismiss** (hides the banner for the session). The user can always manually override the profile regardless.

---

### Step 2 — Allocation Panel

Appears below Setup once amount > 0. Recalculates live on any input change.

#### 2a. Bucket Allocation Bar

A horizontal segmented bar showing the three-way split visually, followed by three bucket cards below it.

**Default splits by risk profile:**

| Profile | Savings Account | High Risk / High Return | Futures & Bonds |
|---|---|---|---|
| Safe | 70% | 20% | 10% |
| Balanced | 40% | 40% | 20% |
| Growth | 15% | 65% | 20% |

**Bucket → Product type mapping:**

| Bucket | Product types |
|---|---|
| Savings Account | `savingsAccounts` |
| High Risk / High Return | `etfs` + `pprs` (where `risk = "high"` or `"medium"`) |
| Futures & Bonds | `futures` + `pprs` (where `risk = "low"`) |

#### 2b. Bucket Cards

One card per bucket. Each card contains:

- **Bucket name** + total % + total € amount for that bucket
- **Product list** — one row per product in the data file for that bucket
- **User-adjustable allocation** — each product row has a `suggestedAllocationPct` from the data file as its default. The user can edit this value (input or small slider within the row). The sum of product allocations within a bucket must equal 100% of that bucket's amount; a live counter shows remaining % to allocate within the bucket.

**Each product row shows:**
- Product name + institution/ticker
- Key metric: TAN % (savings), expected annual return % (ETFs/PPRs), coupon rate % (futures)
- Allocated € amount (derived from bucket amount × product allocation %)
- Any special note (e.g. max eligible amount, min investment, PPR tax benefit callout)
- **External link button** — opens `url` from the data file in a new tab. Label: "Open at [institution]" or "View on [exchange]"

---

### Step 3 — Simulation Panel

Appears below the Allocation Panel. Recalculates live.

#### Future Value Calculation

```
monthly_rate     = weighted average of (product.expectedAnnualReturn × product_allocation_pct) / 12 / 100
                   across ALL products in ALL buckets

months           = time_horizon_years × 12

gross_fv         = amount × ((1 + monthly_rate)^months − 1) / monthly_rate

total_contrib    = amount × months

tax_on_gains     = (gross_fv − total_contrib) × 0.28

net_fv           = gross_fv − tax_on_gains

net_return       = net_fv − total_contrib
```

> The blended `monthly_rate` uses each product's `expectedAnnualReturn` weighted by the user's final allocation (bucket % × product %) so changes to product allocations instantly affect the projection.

#### What is Displayed

- **Hero number**: Net future value (`net_fv`), large and prominent
- **Sub-label**: "↑ €X,XXX in net returns · after 28% tax"
- **Comparison row**: Safe profile outcome vs Growth profile outcome at the same horizon, calculated in parallel using the default splits — gives context without requiring the user to switch profiles
- **Time horizon slider** — repeated here, synced with Step 1
- **Projection chart** (see Section 8)

---

## 3. Product Data File

A manually maintained JSON file bundled with the app at build time.

**Path**: `src/data/invest-products.json`

The `updatedAt` field is displayed on the page as:
*"Product data last updated: 15 Apr 2026"*

This date must be updated by the developer every time the file is edited.

### Full Schema

```json
{
  "updatedAt": "2026-04-15",

  "savingsAccounts": [
    {
      "id": "caixa-poupanca-plus",
      "name": "Caixa Poupança Plus",
      "institution": "Caixa Geral de Depósitos",
      "tan": 2.75,
      "expectedAnnualReturn": 2.75,
      "maxEligibleAmount": 50000,
      "term": "12 months",
      "suggestedAllocationPct": 60,
      "notes": "Requires existing account. Auto-renews.",
      "url": "https://..."
    }
  ],

  "etfs": [
    {
      "id": "vwce",
      "name": "Vanguard FTSE All-World",
      "ticker": "VWCE",
      "expectedAnnualReturn": 7.0,
      "ter": 0.22,
      "risk": "high",
      "description": "Global equity ETF, 3,600+ companies.",
      "suggestedAllocationPct": 60,
      "url": "https://..."
    },
    {
      "id": "eqqq",
      "name": "Invesco NASDAQ-100",
      "ticker": "EQQQ",
      "expectedAnnualReturn": 9.0,
      "ter": 0.30,
      "risk": "high",
      "description": "Top 100 NASDAQ companies. Higher volatility.",
      "suggestedAllocationPct": 40,
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
      "suggestedAllocationPct": 50,
      "notes": "Available via AforroNet or broker.",
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
      "taxBenefit": "IRS deduction: 20% of contributions up to €400/yr",
      "suggestedAllocationPct": 40,
      "notes": "Early redemption penalty applies before age 60.",
      "url": "https://..."
    }
  ]
}
```

### Field Reference

| Field | Required | Description |
|---|---|---|
| `id` | ✅ | Unique identifier (slug) |
| `name` | ✅ | Display name |
| `expectedAnnualReturn` | ✅ | Used in simulation formula (%) |
| `suggestedAllocationPct` | ✅ | Default % within the bucket — user can edit |
| `url` | ✅ | External link opened on click |
| `notes` | ➖ | Optional fine print shown below the row |
| `taxBenefit` | ➖ | PPR-specific. Shown as a teal callout badge on the row |
| `maxEligibleAmount` | ➖ | Savings accounts. Shown as a warning if user's allocated amount exceeds it |
| `minInvestment` | ➖ | Futures. Shown as a warning if allocated amount is below it |
| `tan` | ➖ | Savings accounts. Displayed as the key metric instead of `expectedAnnualReturn` |
| `couponRate` | ➖ | Futures. Displayed as secondary metric alongside `expectedAnnualReturn` |
| `ter` | ➖ | ETFs. Total Expense Ratio — shown as fine print |
| `risk` | ➖ | ETFs and PPRs. Determines which bucket the product appears in |

---

## 4. Product Allocation — User Editing Rules

Within each bucket card, all products have a `suggestedAllocationPct` as default. The user can adjust individual product percentages:

- Allocation inputs are shown as `%` fields (editable) next to each product row
- The sum of all product allocations within a bucket **must equal 100%**
- A live counter at the top of each bucket card shows: *"X% allocated · Y% remaining"*
- If the sum exceeds 100%, the remaining counter turns red
- The simulation uses whatever the user has set — no forced rebalancing

Products whose `suggestedAllocationPct` from the file sum to 100 by default within their bucket. If a new product is added and the sums no longer total 100, the UI shows a warning at the bottom of that bucket card.

---

## 5. Tax Rules

- **Rate**: 28% flat (*tributação autónoma* — Portuguese IRS on investment income)
- **Applied to**: gains only (`gross_fv − total_contributions`)
- **Not applied to**: principal/contributions
- **PPR exception**: PPRs offer an IRS deduction of 20% on contributions up to €400/year. This is shown as a callout badge on PPR product rows but is **not included in the simulation formula** — a note reads: *"PPR tax benefit not included in projection. May further reduce your tax bill."*
- **Savings account**: interest is withheld at source at 28% — treated identically in the formula

---

## 6. Simulation Chart

- **Library**: Recharts (already in the project)
- **Type**: Area chart
- **X-axis**: Years 1 → selected horizon
- **Y-axis**: Euro value
- **Series**:
  - Net portfolio value (filled area, coloured by risk profile — teal/Safe, blue/Balanced, purple/Growth)
  - Total contributions (dashed grey line)
  - Shaded gap between them = net gain region
- **Tooltip on hover**: Year · Gross value · Tax paid · Net value · Total contributed
- **Reference lines**: none by default, but at 10 yr and 20 yr if horizon ≥ 20 yr

---

## 7. UI Components

| Component | File | Description |
|---|---|---|
| `InvestPage` | `src/app/pages/Invest.tsx` | Top-level page, orchestrates all state |
| `AmountInput` | inline or component | Large € input, empty by default |
| `RiskProfileToggle` | component | 3-way pill: Safe · Balanced · Growth |
| `AgeRecommendation` | component | Dismissible banner with "Apply suggestion" CTA |
| `AllocationBar` | component | Horizontal segmented bar showing bucket % split |
| `BucketCard` | component | One per bucket, contains product rows + allocation counter |
| `ProductRow` | component | Name, metric, allocation % input, € amount, external link |
| `ExternalLinkButton` | component | "Open at X" → opens `url` in new tab |
| `SimulationSummary` | component | Hero net value + returns + Safe vs Growth comparison |
| `SimulationChart` | component | Recharts area chart |
| `TimeHorizonSlider` | component | 1–30 yr slider, shared/synced |
| `DataFreshnessNote` | component | "Product data last updated: [date]" |

All components follow the existing design system (`CLAUDE.md`).

---

## 8. State Management

No backend. All state is local to `InvestPage`:

```
amount: number | ''          — empty by default
riskProfile: 'safe' | 'balanced' | 'growth'   — default: 'balanced'
age: number | ''             — optional, empty by default
timeHorizon: number          — default: 10 (years)
productAllocations: Record<productId, number>  — initialised from suggestedAllocationPct
ageBannerDismissed: boolean  — session only
```

- Product data loaded from `src/data/invest-products.json` at build time (static import)
- No API calls, no database writes, no persistence between sessions

---

## 9. Edge Cases & Validations

| Scenario | Behaviour |
|---|---|
| Amount = 0 or empty | Allocation and simulation panels hidden; prompt shown: *"Enter a monthly amount to get started"* |
| Bucket product allocations don't sum to 100% | Warning badge on that bucket card; simulation still runs using actual entered % |
| Allocated amount exceeds `maxEligibleAmount` of a savings account | Warning on that product row: *"Your allocation (€X) exceeds the max eligible amount (€Y)"* |
| Allocated amount below `minInvestment` of a future | Warning on that product row: *"Minimum investment is €X"* |
| Time horizon = 1 year | Chart shows 12 monthly data points instead of yearly |
| No products in a bucket (edge case in data file) | Bucket card shows *"No products available in this bucket"* |

---

## 10. Disclaimer

Displayed at the very bottom of the page, in small muted text:

> *"This simulation is for informational purposes only and does not constitute financial advice. Expected returns are based on historical data and are not guaranteed. Past performance is not indicative of future results. The 28% tax rate applied is a general estimate; your actual tax liability may vary. Consult a licensed financial advisor before making any investment decisions."*

---

## 11. Out of Scope (v1)

- Non-PT products or multi-country support
- Lump-sum investment mode (v1 is monthly recurring only)
- Saving or exporting a simulation
- Side-by-side scenario comparison
- Real-time pricing or market data
- Personalised tax calculation (PPR deductions, household filing, NHR regime)
- Push notifications or investment reminders
- Brokerage or bank integrations
