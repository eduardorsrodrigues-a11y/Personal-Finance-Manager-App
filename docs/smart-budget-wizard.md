# Smart Budget Wizard — Feature Documentation

## Overview

The Smart Budget Wizard is a guided 6-step questionnaire that collects financial profile data from the user and generates a personalised monthly budget using a weighted allocation algorithm. After generation, the user can interactively adjust allocations before applying them to their account.

The wizard is implemented across two files:
- **`src/app/components/SmartBudgetWizard.tsx`** — UI, state, and interaction logic
- **`src/app/utils/budgetAllocator.ts`** — allocation computation and rebalancing engine

---

## Entry Points

| Trigger | Behaviour |
|---|---|
| "Smart Setup" button (Budgets page, no active smart budget) | Opens wizard at Step 1 (fresh flow) |
| "Re-adjust" button (Budgets page, smart budget active) | Opens wizard directly at the Reveal screen pre-populated with current budgets |
| Clicking any category row (smart budget view) | Same as Re-adjust — jumps straight to Reveal |

---

## The 6-Step Quiz

### Step 1 — Monthly Income
**Question:** What is your average monthly take-home pay?

- Free-text number input (numeric keyboard on mobile)
- Accepts any positive number
- **Validation:** Must be > 0 to proceed

---

### Step 2 — Housing Situation
**Question:** What does your living situation look like?

**Options (single select):**
| Value | Label | Description |
|---|---|---|
| `renting` | Renting | I pay monthly rent |
| `mortgage` | Paying a Mortgage | I have a home loan payment |
| `family` | Living with Family | I pay reduced or shared rent |
| `rent-free` | Rent-Free | No housing payment at the moment |

- If any option other than `rent-free` is selected, a secondary input appears for the **monthly housing payment amount**
- If `rent-free` is selected, housing amount is treated as 0
- **Validation:** Must select a situation; if not rent-free, must enter an amount

**Effect on allocation:**
- `rent-free` → Needs −15%, Wants +5%, Savings +10%

---

### Step 3 — Fixed Monthly Bills
**Question:** Any other fixed monthly bills?

**Inputs (all optional, default 0):**
- Utilities (electricity, water, internet)
- Health / Insurance
- Gym & Sports memberships

These amounts are treated as **locked** — the Smart Allocation engine will never auto-reduce them.

- **Validation:** Always valid (0 is acceptable for all fields)

---

### Step 4 — Dependents
**Question:** How many dependents do you support?

**Options (single select):**
| Value | Label | Effect |
|---|---|---|
| `none` | Just me | No adjustment |
| `1-2` | 1–2 dependents | Needs +10%, Wants −5%, Savings −5% |
| `3+` | 3+ dependents | Needs +15%, Wants −10%, Savings −5% |

- **Validation:** Must select one

---

### Step 5 — Debt Level
**Question:** Do you have significant debt?

**Options (single select):**
| Value | Label | Effect |
|---|---|---|
| `none` | None | No adjustment |
| `very-little` | Very little | No adjustment |
| `manageable` | Manageable | No adjustment |
| `high` | High — aggressive payoff needed | Wants −10%, Savings +10% |

- **Validation:** Must select one

---

### Step 6 — Financial Goal
**Question:** What is your main financial focus right now?

**Options (single select):**
| Value | Label | Effect |
|---|---|---|
| `emergency-fund` | Building an Emergency Fund | Wants −5%, Savings +5% |
| `paying-debt` | Paying Down Debt | No additional adjustment |
| `investing` | Investing | No additional adjustment |
| `wealth-building` | Wealth Building | No additional adjustment |
| `tracking` | Just tracking my expenses | Needs +15%, Wants −10%, Savings −5% |

- Clicking "Generate My Budget" triggers the loading screen then the Reveal
- **Validation:** Must select one

---

## Loading Screen

After Step 6, a 1.6-second loading animation plays while `computeBudget()` runs. If fixed expenses exceed income, an error is shown on Step 2 and the user is sent back to correct their housing/bills inputs.

---

## Allocation Algorithm (`computeBudget`)

### Phase 1 — Validation
Checks that `housing + utilities + health + gym ≤ income`. If not, returns an error.

### Phase 2 — Macro Split (50/30/20 baseline)
Starts from the standard 50% Needs / 30% Wants / 20% Savings split, then applies additive modifiers from the quiz answers (see each step above). Results are clamped to 0 and normalised to always sum to 100%.

### Phase 3A — Needs Bucket
- Fixed amounts (Housing, Utilities, Health) are placed first
- Remaining needs budget is distributed across fluid needs categories using fixed weights:

| Category | Weight |
|---|---|
| Groceries | 40% |
| Transportation | 40% |
| Family & Personal | 20% |

- If fixed needs exceed the needs budget, the deficit is borrowed from the Wants bucket

### Phase 3B — Wants Bucket
- Gym & Sports is placed first (fixed)
- Remaining wants budget is distributed across fluid wants categories:

| Category | Weight |
|---|---|
| Food | 30% |
| Shopping | 20% |
| Entertainment | 20% |
| Travel | 10% |
| Gifts | 10% |
| Other | 10% |

### Phase 3C — Savings
Savings = income × futurePct%. It is not a category but the implicit remainder after all allocations.

---

## Reveal Screen

Displayed after computation (or when opening via Re-adjust). Shows the full budget breakdown in two sections — **Needs** and **Wants** — with interactive controls for each category.

### Category Display Order

**Needs:** Housing → Utilities → Health → Groceries → Transportation → Family & Personal

**Wants:** Food → Shopping → Entertainment → Travel → Gifts → Gym & Sports → Other

### Per-Category Controls

Each row has:
- Category icon and name
- **Lock icon** (for fixed categories: Housing, Utilities, Health, Gym & Sports)
- **Editable amount input** — accepts any numeric value, no forced rounding
- **Slider** — snaps every €25, range from €0 to 70% of income
- **Tick marks** — visual dots every €100

### Fixed Categories and the Lock

Categories in `FIXED_CATEGORIES` (Housing, Utilities, Health, Gym & Sports) are locked by default.

- **Tapping the lock icon** temporarily unlocks the category — the slider and input become active, the icon changes to an open lock (teal)
- After the user adjusts and releases (blur on input, or mouse-up/touch-end on slider), the category **automatically re-locks**

### Savings Card

Displayed above the category list. Shows:
- Current savings amount and percentage
- Colour-coded level: **High** (≥20%, green) / **Medium** (≥10%, amber) / **Low** (<10%, red)
- **Savings slider** — dragging it proportionally scales all fluid (unlocked) categories up or down to hit the target savings amount. Amounts are snapped to the nearest €25.

### Fix Savings Toggle

A toggle switch at the top of the Reveal screen with two modes:

| Mode | Behaviour |
|---|---|
| **On (default)** | When a category is changed, categories rendered **below** it absorb the delta proportionally to their current allocation |
| **Off** | Only the changed category updates; savings absorbs the difference; no other category moves |

### Rebalancing Rules (`rebalance`)

When Fix Savings is **on** and a category is changed:

1. The full list of fluid categories **below** the changed one in display order is collected (fixed categories excluded)
2. If none exist → savings absorbs the change (no loop)
3. Each eligible category absorbs a share of the delta **proportional to its current allocation amount**
4. All resulting amounts are rounded to whole numbers
5. If no eligible category had enough capacity → savings absorbs the remainder

### Apply Budget

Clicking **Apply Budget**:
1. Rounds all amounts to integers
2. Calls `setBudgetsAll(amounts, income)` — atomically saves all 13 category budgets plus the income to the server (or localStorage for guests)
3. Activates "Smart Budget Active" mode on the Budgets screen

---

## Smart Budget Mode (Budgets Screen)

Once applied, the Budgets screen switches to a grouped Needs/Wants view with a summary card showing Income, Budgeted, and Savings. The **Re-adjust** button opens the wizard at the Reveal step pre-populated with current values.

Clicking **"Switch to manual budget mode"** clears the smart income, deactivating smart mode.

---

## Persistence

Smart budget data (category amounts + income) is stored server-side inside the `user_settings.budgets` JSONB column as `{ ...categoryAmounts, __smartIncome: income }`. The API strips `__smartIncome` before returning it to the client, which receives `{ budgets, smartIncome }` separately. This ensures smart budget mode is consistent across all devices and browsers.

Guest users follow the same structure but using `localStorage`.

---

## Keyboard Support

| Context | Key | Action |
|---|---|---|
| Any question step (1–6) | Enter | Advance to next step (if valid) |
| Reveal screen | Enter | Apply Budget |
| Manual edit modal (Budgets page) | Enter | Save budget for that category |
