# SalePilot — Modular Packaging Plan

**Status:** Proposal / spec for alignment
**Goal:** Move SalePilot from fixed Basic/Pro/Enterprise tiers to a **configurable subscription** where customers pay only for the modules they need — positioning SalePilot as the POS that doesn't make you "overspend on features you'll never use."

> Positioning line to use everywhere: *"Most all-in-one POS systems charge one big price for features you don't use. With SalePilot you pick only what your shop needs — and pay less."*

---

## 1. Packaging model (decided)

**Core + add-on modules + curated presets.**

- **Core POS** — a cheap mandatory base. No shop can run without it. Everyone pays this.
- **Add-on modules** — individually priced, toggled on/off by the customer.
- **Presets** — 2–3 named bundles ("Starter / Growth / Full") that pre-select module sets. They act as anchors and remove decision friction; power users can still fully customize.
- **Pricing axes** — seats, product cap, and locations are *dials*, not modules.

We deliberately avoid **pure per-feature à-la-carte** (decision paralysis, looks more expensive, churn from under-buying) and avoid **rigid tiers only** (no differentiation, forces overspend — the thing we're selling against).

---

## 2. Module catalog (~11 modules)

Each module maps to existing **frontend page keys** (`navItems[].page` in [components/Sidebar.tsx](components/Sidebar.tsx)) and **backend route prefixes** (mounted in `s-back/src/api/index.ts`). Prices below are **illustrative placeholders in ZMW/month** — finalize with the pricing exercise in §5.

### 🔵 Core POS — always included (base subscription)

| Sub-area | Page keys | API prefixes |
|---|---|---|
| Sales & POS | `sales`, `sales-history` | `/sales`, `/payments` |
| Basic Inventory | `inventory`, `categories` | `/products`, `/categories` |
| Dashboard & basic reports | `reports` | `/reports` |
| Account essentials | `settings`, `profile`, `notifications`, `users` (1 seat), `subscription`, `user-guide`, `support` | `/settings`, `/users`, `/notifications`, `/push` |
| Always-on (never gated) | — | `/auth`, `/onboarding`, `/verification`, `/stores`, `/subscriptions` |

**Suggested Core price:** ~99 ZMW/mo, includes 1 seat + 100 products.

### 🟢 Add-on modules

| # | Module | What's in it | Page keys | API prefixes | Depends on | Price (illustrative) |
|---|---|---|---|---|---|---|
| 1 | **Procurement** | Suppliers, purchase orders, stock takes | `suppliers`, `purchase-orders`, `stock-takes` | `/suppliers`, `/purchase-orders`, `/stock-takes` | — | 80 |
| 2 | **Accounting / ERP** | Chart of accounts, journals, AP/AR, expenses, P&L | `accounting` | `/accounting`, `/expenses`, `/recurring-expenses` | — | 150 |
| 3 | **CRM** | Customer profiles, credit, customer portal | `customers`, `customer/dashboard`, `customer/orders` | `/customers` | — | 60 |
| 4 | **Logistics & Delivery** | Couriers, bus services, shipment tracking | `logistics` | `/logistics` | — | 70 |
| 5 | **AI Suite** | Business Assistant, AI descriptions, forecasting, data chat | `quick-view` | `/ai` | — | 120 |
| 6 | **Marketing & Marketplace** | Poster generator, offers, public directory listing | `marketing`, `directory` | `/offers`, `/marketplace` | — | 60 |
| 7 | **WhatsApp Messaging** | Conversations, templates, customer chat | `whatsapp/conversations`, `whatsapp/settings` | `/whatsapp`, `/messages` | — | 90 |
| 8 | **Online Store** | Storefront, cart, online orders | `orders`, `shop/*` (public) | `/shop` | CRM (recommended) | 100 |
| 9 | **Returns & Refunds** | Full returns/refund workflow | `returns` | `/returns` | — | 40 |
| 10 | **Audit & Compliance** | Full audit trail, custom RBAC | `audit-trail` | `/audit` | — | 80 |

> **Multi-Store** (`superadmin`, `superadmin/*`, `/superadmin`) is handled as the **Locations axis** below, not a toggle.

### 📊 Pricing axes (dials, not modules)

| Axis | Meaning | Enforcement field |
|---|---|---|
| **Seats** | Extra staff users beyond the 1 in Core | `max_users` |
| **Product cap** | Core caps at 100; "unlimited" upgrade | `max_products` |
| **Locations** | Per additional store (unlocks multi-store) | `max_locations` |

---

## 3. Presets (anchors)

Presets are just **pre-selected module sets** layered on Core. They map cleanly onto today's `feature.md` tiers so existing customers migrate without surprises.

| Preset | Modules on top of Core | Seats | Products | Maps to legacy |
|---|---|---|---|---|
| **Starter** | Returns | 1 | 100 | Basic |
| **Growth** ⭐ | Procurement, Accounting, CRM, Returns, AI (descriptions only), Logistics | 5 | Unlimited | Pro |
| **Full** | All modules + multi-store + full AI Suite + Audit | Unlimited | Unlimited | Enterprise |

A buyer can start from a preset and add/remove modules — the configurator just treats a preset as a starting set of toggles.

---

## 4. Technical architecture — entitlements as the single source of truth

Access today is **role-only**: `allowedPages` comes from `PERMISSIONS[role]` in [Dashboard.tsx:1261](Dashboard.tsx). We add a **second, independent axis — subscription entitlements** — and combine them:

> **A page/route is permitted ⇔ the user's role allows it AND the store's plan entitles it.**

### 4.1 Module registry (shared catalog as data)

A single source file describing the catalog in §2, imported by both frontend and backend. Modules become data, not scattered `if` statements.

```ts
// shared/modules.config.ts
export interface ModuleDef {
  id: string;              // 'accounting'
  name: string;            // 'Accounting / ERP'
  core?: boolean;          // true = always entitled
  pages: string[];         // navItems page keys
  apiPrefixes: string[];   // backend route prefixes to gate
  requires?: string[];     // module dependencies
  price: number;           // ZMW/mo
}

export const MODULES: ModuleDef[] = [ /* §2 catalog */ ];
```

### 4.2 Store entitlements (persisted)

Extend the stores/subscription schema (`subscription.service.ts`) with:

```sql
ALTER TABLE stores ADD COLUMN enabled_modules TEXT[] DEFAULT '{}';
ALTER TABLE stores ADD COLUMN max_users      INT DEFAULT 1;
ALTER TABLE stores ADD COLUMN max_products   INT DEFAULT 100;
ALTER TABLE stores ADD COLUMN max_locations  INT DEFAULT 1;
ALTER TABLE stores ADD COLUMN plan_snapshot  JSONB;  -- price-at-subscription for grandfathering
```

`enabled_modules` is derived from the chosen preset/config and is the **runtime source of truth**.

### 4.3 Enforce in BOTH layers

- **Frontend = UX.** Compute `entitledPages` from `enabled_modules` via the registry, then pass `allowedPages = PERMISSIONS[role] ∩ entitledPages` into the existing `Sidebar` (it already filters by `allowedPages` — see [Sidebar.tsx:321](components/Sidebar.tsx)). Show a soft "upgrade" CTA for locked modules instead of hiding them entirely (drives expansion revenue).
- **Backend = security (non-negotiable).** A `requireModule(moduleId)` middleware applied to the route groups in `s-back/src/api/index.ts`. Frontend hiding is not protection — without this, a user can still call `/api/accounting` directly.

```ts
// middleware/entitlements.middleware.ts
export const requireModule = (moduleId: string) =>
  (req, res, next) => {
    const enabled = req.store?.enabled_modules ?? [];
    if (MODULES.find(m => m.id === moduleId)?.core || enabled.includes(moduleId)) return next();
    return res.status(402).json({ message: 'Module not included in your plan', module: moduleId });
  };

// api/index.ts
router.use('/accounting', requireModule('accounting'), accountingRoutes);
router.use('/expenses',   requireModule('accounting'), expenseRoutes);
// ...one line per route group; core groups stay ungated
```

Use **402 Payment Required** for "not entitled" vs 403 for "role forbidden" — lets the frontend show an upgrade prompt distinct from a permissions error.

### 4.4 Sub-feature flags

For features *inside* a module (e.g. "AI forecasting" within AI Suite, "P&L export" within Accounting), use the same registry with finer-grained flags, checked the same way. Keeps Growth-vs-Full distinctions without new plumbing.

---

## 5. Billing rules (the hard part — decide before coding the UI)

| Concern | Recommended policy |
|---|---|
| **Price** | Always **derived**: `sum(enabled module prices) + seats + caps + locations`. Never hand-typed. |
| **Upgrades** | Take effect immediately; prorate the difference or bill at next cycle. |
| **Downgrades** | Take effect at period end (customer keeps what they paid for). No instant refunds. |
| **Grandfathering** | Store `plan_snapshot` (prices at subscription time). When you change module prices later, existing subs keep their price until renewal. |
| **Lenco** | Model subscription as `store ↔ enabled_modules ↔ computed monthly amount`; on renewal charge the computed amount via existing `payment.controller`. |
| **Downgrade guardrails** | Turning a module off must **never delete data**. Make it read-only / archived (e.g. drop Procurement with open POs → POs become read-only, with a warning at downgrade time). |

---

## 6. Configurator UX ("Build your plan")

- Core shown as included; add-ons as toggles with a **live running total**.
- **Competitor-savings framing on screen:** "Typical all-in-one POS: ZMW 599/mo. Your plan: **ZMW 249/mo — you save ZMW 350/mo.**" This line *is* the differentiator.
- **Smart defaults from business type** — `BUSINESS_TYPES` is already captured in [pages/StoreSetupPage.tsx](pages/StoreSetupPage.tsx). Pre-tick modules a pharmacy / grocery / restaurant typically needs.
- **Presets** as one-click starting points; most users pick one and move on.
- Dependency handling: enabling Online Store auto-suggests CRM, etc. (from `requires`).

---

## 7. Migration plan

1. Ship the **registry + entitlements gate** with every store entitled to **all** modules → zero behavior change, pure plumbing.
2. Backfill `enabled_modules` for existing customers from their current Basic/Pro/Enterprise tier (§3 mapping).
3. Turn on the **configurator** for new signups; offer existing customers an opt-in "customize & save" path.

---

## 8. Phased delivery

| Phase | Deliverable | Risk |
|---|---|---|
| **1** | Module registry + `requireModule` middleware + frontend `allowedPages` intersection. Everyone entitled to everything. | Low — invisible plumbing |
| **2** | Schema + map legacy tiers → module sets; backfill existing stores. | Low |
| **3** | Configurator UI + live pricing + savings framing. | Med |
| **4** | Dynamic price computation + upgrade/downgrade/proration + Lenco renewal. | High — billing correctness |
| **5** | Smart per-business-type defaults, presets polish, sub-feature flags. | Low |

> **Start with Phase 1.** It's the foundation, it's invisible to users, and it de-risks everything after it. Do **not** start with the pricing UI.

---

## 9. Open decisions

- Final module **prices** and Core price (needs a pricing/willingness-to-pay exercise).
- Is **Returns** a Core feature or a paid add-on? (Placed as a cheap add-on here; could fold into Core.)
- **Seats** pricing: flat per-seat, or tiered (1 / 5 / unlimited)?
- Proration: real proration vs simpler "changes apply next cycle"?
- Annual billing discount? (Strong lever for retention if added.)
