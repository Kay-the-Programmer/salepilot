# UPSELL_NOTES.md — Phase 0 investigation

Actual repo shapes the Contextual Upsell Engine is built on, and where they
deviate from the build brief. Read this before touching the engine.

## Entitlements — `utils/entitlements.ts`

- `MODULES` is a const object; `ModuleId = typeof MODULES[keyof typeof MODULES]`.
  Real ids: `sms_messaging`, `whatsapp_messaging`, `social_marketing`,
  `team_members`, `auto_reorder`, `ai_assistant`, `quick_import`,
  `advanced_reports`, `public_tracking`, `unlimited_products`. **All 10 brief ids
  exist and match.**
- `hasModule(settings: StoreSettings | null | undefined, moduleId: string): boolean`
  — checks `settings.enabledModules.includes(moduleId)`. Note the signature takes
  `StoreSettings`, **not** a bare module check, so our `ctx.hasModule(m)` wraps it
  by closing over the current `storeSettings`.
- **Free-override gotcha:** `WHATSAPP_FREE` and `SOCIAL_FREE` env flags default to
  `true`, so `whatsapp_messaging` / `social_marketing` are currently *free* even
  though they are not in `enabledModules`. `hasModule` would return `false` for
  them → we would upsell a free feature. **Our `ctx.hasModule` wrapper treats a
  module as owned when its free-override is on** so we never upsell a free module.
- `FREE_PRODUCT_LIMIT = 100`, `FREE_SEATS = 1`.
- Page gating: static `PAGE_MODULES` (only `{ reports: advanced_reports }`),
  overridden at runtime by `setPageModules(map)` loaded from
  `/subscriptions/page-modules` in `App.tsx`. `isPageEntitled(settings, page)`.

## RBAC — `utils/rbac.ts`

- `Role = 'superadmin' | 'admin' | 'staff' | 'inventory_manager' | 'customer' | 'supplier'`.
- Role is read off the current user object (`currentUser.role`), there is no role
  hook. Only `admin` / `superadmin` may purchase. **Upsell eligibility restricts to
  `admin` / `superadmin`** (brief requirement: staff / inventory_manager never see it).

## The 402 paywall — `services/api.ts` + `components/PaywallHost.tsx`

- `services/api.ts` `request()` (line ~110): on a `402` whose JSON body has a
  `module`, it dispatches `new CustomEvent('salepilot:paywall', { detail: { module, message } })`
  then throws `HttpError`. This is the only paywall trigger and **must stay intact**.
- `PaywallHost` (mounted once in `App.tsx`, **above** `Dashboard`) listens for that
  event, fetches `/subscriptions/addons` to resolve `{ id, name, description, price,
  currency, owned }`, and deep-links its CTA to
  `/subscription?view=addons&module=<id>`.
- **Consequence for us:** `PaywallHost` is *outside* the React tree where the
  Dashboard store lives, so it cannot consume a React context fed by Dashboard.
  Our paywall enrichment must come from the **static moment config** (a pure
  `getPaywallMoment(module)` lookup) — no store context needed (the 402 itself is
  the trigger).

## Central store — `Dashboard.tsx`

`Dashboard` is the app shell. Every authenticated route in `App.tsx` renders
`<Dashboard />`; Dashboard inspects the URL and renders the matching app, passing
store slices down as props. In-memory state (all `useState`):

- `products: Product[]` — `Product.stock: number`, `reorderPoint?`, `safetyStock?`,
  `status: 'active' | 'archived'`, `createdAt?`. **No historical stock-out signal.**
- `customers: Customer[]` — `createdAt: string`, `storeCredit`, `accountBalance`.
  **No `lastPurchase` / `lastVisit` field** → dormancy must be derived from `sales`.
- `sales: Sale[]` — `timestamp: string`, `customerId?: string`, `total`. Used to
  derive last-purchase per customer and `daysActive` (earliest sale).
- `users: User[]` — seat count.
- `storeSettings: StoreSettings | null` — `enabledModules?: string[]` is the
  entitlement source; `currency.code` for pricing copy.
- `currentUser: User | null` (`getCurrentUser()`), `currentPage` from `location`.
- Per-user persistence pattern already in use: `salePilot.lastPage.<userId>` in
  `localStorage` (see `getLastPageKey`). We follow this for upsell state:
  `salePilot.upsell.<userId>`.

### Deviations from the brief's `UpsellContextData`

| Brief field | Reality / how we compute it |
|---|---|
| `daysActive` | No first-session timestamp. Derived from the **earliest `sale.timestamp`**; falls back to a per-user `salePilot.upsell.firstSeen.<userId>` stamp written on first engine run. |
| `customer.lastPurchase` | Does not exist. We compute last-sale-date per `customerId` from `sales`. |
| `dormantCustomerCount` | Customers who **have bought before** but whose last sale is ≥ 30 days ago. Customers with zero sales are *not* counted (never-active ≠ dormant). |
| `recentStockoutCount` | No "hit 0 in last N days" history. **Approximated as products currently `stock <= 0` with `status === 'active'`.** Documented limitation. |
| `manualAddsThisSession` | No counter exists. Tracked in `sessionStorage` via `recordManualAdd()` exposed by the engine; Dashboard's product-create path calls it. |
| `productCap` | `FREE_PRODUCT_LIMIT` (100), or `Infinity` when `unlimited_products` is owned. |
| `isMidSale` | No global cart flag. Derived from route: true on `/sales`, `/hustle`, and the `/pos` sale screen. (Proactive surfaces don't live on those screens anyway — this is belt-and-suspenders.) |
| `storeCount` | Best-effort from the superadmin `systemStores` list (else 1). Not used by any moment trigger. |

## Surfaces

- **`PosDiscover.tsx`** — premium tiles are `<button class="dapptile">` with a
  `dapptile__cta--locked` lock state and `dapptile__tag` badges (see `renderTile`).
  It already receives `storeSettings` + `onLaunch(page)`. We add a contextual
  `discover_card` tile reading `getEligible('discover_card')`.
- **AI day-summary** — placed on the **Business Dashboard** overview
  (`components/dash-app/DashboardApp.tsx` → BizOverview), the free daily landing
  for admins (`DEFAULT_PAGES.admin = 'dash'`). The Business **Assistant** greeting
  (`pages/assistant/AssistantApp.tsx`) is the literal "AI day-summary card", but it
  is module-gated — a non-owner only ever sees its full upgrade gate, so the AI
  nudge there would be dead (owned-module gate). The day-summary surface must be
  free-visible, hence the Business Dashboard.
- **Inline cards** — placed at the top of Inventory / Customers / Logistics
  screens via a `<UpsellInline ids={[...]} />` helper that asks the engine for the
  top eligible `inline_card` moment **restricted to that screen's ids** (so each
  screen shows its own card and the one-per-session budget still holds).
  Two moments are deliberately NOT inline-placed because a richer dedicated
  surface already exists: `product_cap_near` is served by Inventory's existing
  `ProductCapBanner` meter (placing a second cap card would stack), and Logistics
  already has a persistent "Public tracking page" button — the proactive
  `tracking_requested` card complements it rather than replacing it.
- **Push** — `services/notificationService.ts` only handles FCM *subscription*
  (no local-notify method). We add `showLocalNotification(title, opts)` that uses
  the ready service-worker registration when `Notification.permission === 'granted'`,
  else no-ops. Used for `dormant_customers` only.

## Analytics — `src/utils/analytics.ts`

- Existing API is `logEvent(category, action, label?)` (GA3-style) — **cannot carry
  `{ momentId, module, surface }` params.** We add `trackEvent(name, params)` using
  `ReactGA.event(name, params)` (GA4 custom-event form) for the four upsell events.

## Subscription / conversion — `pages/subscription/SubscriptionApp.tsx`

- Route `/subscription` renders `SubscriptionApp` **directly** (not via Dashboard),
  so it is also outside the Dashboard tree. Deep-link params:
  `?view=addons&module=<id>` (sets view + pre-selects the add-on).
- Successful add-on purchase resolves in `pollVerification` success
  (`data.success`, `wasAddon`), where `addonCheckout.moduleIds: string[]` holds the
  purchased module ids. **Conversion attribution** calls
  `upsellService.notePurchaseCompleted(moduleIds)` there.
- Because both `PaywallHost` and `SubscriptionApp` live outside the Dashboard tree,
  the engine's **session/persistence/attribution state lives in a module-level
  singleton** (`services/upsellService.ts`), not in React context. The React hook
  (`contexts/UpsellContext.tsx` → `useUpsell()`) is a thin reactive wrapper; the
  Dashboard pushes the live `UpsellContextData` snapshot into the singleton.

### Phase 5 — config-driven pricing

- Prices are **never hardcoded** in `upsell.ts`. Real Kwacha prices come from the
  live add-on catalogue **`/subscriptions/addons`** (`{ id, price, currency }`) —
  the same endpoint `PaywallHost` already uses (the brief named
  `/subscriptions/page-modules`, but that endpoint is the page→module *map*, not
  pricing). Dashboard fetches it once authenticated and calls
  `upsellService.setPricing(...)`. The service caches the map to
  `localStorage['salePilot.upsell.pricing']`, so prices survive **offline** as
  last-known values; absent any cache, cards simply omit the price. To keep the
  engine/service free of `api`/Capacitor imports (so the node tests need no
  jsdom), pricing is *pushed in* rather than fetched inside the service.

## Tooling

- **No test runner** is configured (`package.json` has no vitest/jest). Phase 3
  guardrail tests need one. We add **vitest** as a dev-dependency (justified: the
  brief's Definition of Done requires guardrail tests). The eligibility engine in
  `utils/upsell.ts` is written as **pure functions** (no storage, no network, no
  React) so the tests run offline with plain objects.
- `tsconfig`: strict, `noUnusedLocals`, `noUnusedParameters`. `@/*` path alias → repo root.

## Moment map (9 brief moments + 1 to exercise the 5th surface)

Brief names: `product_cap_near`, `dormant_customers` (+ a `push` mirror =
`dormant_customers_push`), `daily_summary_ai`, `report_locked`, `stockout_repeat`,
`second_staff`, `bulk_manual_adds`, `tracking_requested` → **9 moments**.

The brief's map assigns no moment to the **`discover_card`** surface yet the DoD
requires all five surfaces to render. We add one documented extra —
`discover_advanced_reports` (`advanced_reports`, `discover_card`) — a proactive
cross-sell layered over the same module's hard 402 (`report_locked`). This is the
only deviation from "exactly 9 moments".
