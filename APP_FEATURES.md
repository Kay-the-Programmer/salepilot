# SalePilot — Features & Structure

> POS & Inventory Management platform for Zambian SMEs, packaged as a **free core + à‑la‑carte paid modules**.
> A single React PWA that presents itself as a launcher of focused **standalone "apps"** (POS, CRM, Accounting, etc.),
> all backed by a shared offline‑first data layer. The REST backend lives in a **separate repo (`s-back`)**; this repo
> is the frontend + a 21‑line static file server (`server.js`).

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| UI | React 19, React Router 7 (lazy routes), Tailwind CSS 3, Headless UI, Lucide / react‑icons |
| Build | Vite 6, TypeScript 5.7 (strict, `noUnusedLocals`) |
| Data viz / docs | Recharts, jsPDF + autotable, xlsx, Leaflet / react‑leaflet (maps) |
| Realtime | socket.io‑client |
| Offline | IndexedDB (`dbService`) + service worker (`public/sw.js`) + mutation queue/sync |
| AI | `@google/genai` (Gemini) via `geminiService` *(or backend‑proxied)* |
| Auth | JWT (stored client‑side), Google sign‑in, Firebase (messaging/config) |
| Native | Capacitor (Android + Electron shells) |
| Payments | Lenco inline checkout (`index.html` script) |
| Analytics | react‑ga4 (`src/utils/analytics`) |

---

## 2. Application Structure

```
index.tsx                → mounts <App/> inside <BrowserRouter>
App.tsx                  → route table + global providers (Theme, Toast), PaywallHost, ThemeToggle
Dashboard.tsx            → THE HUB: auth gate, store gate, central data store, all CRUD handlers,
                           renderPage() dispatcher, Sidebar + standalone-app shells
types.ts                 → domain models (Product, Sale, Customer, PurchaseOrder, Account, …)

components/              → feature UI, grouped by domain (see §4)
  pos/ crm/ marketing/ shop/ standalone/ dash-app/ inventory-app/ team-app/
  procure-app/ superadmin-app/                 ← standalone "app" shells
  accounting/ reports/ sales/ products/ inventory/ purchase-orders/ suppliers/
  customers/ users/ settings/ logistics/ offers/ whatsapp/ ai/ onboarding/
  ui/ icons/                                    ← shared primitives & icons
pages/                   → route-level screens + per-app shells
  accounting/ assistant/ audit/ hustle/ logistics/ notifications/ profile/
  purchase-orders/ settings/ subscription/ superadmin/ supplier/ shop/ customers/
services/                → API + integrations (see §6)
contexts/                → Theme, Toast, Notification, Onboarding providers
utils/                   → currency, date, entitlements (gating), rbac, ui, pdfExport, helpers
hooks/                   → useProductForm, …
src/                     → analytics + page-tracking (initGA, usePageTracking)
firebase/                → Firebase init; public/firebase-messaging-sw.js (push SW)
```

### How a screen renders
1. `App.tsx` maps almost every path to `<Dashboard/>` (real routing happens inside the shell).
2. `Dashboard.tsx` resolves the current page from the URL, checks **RBAC + entitlements** (`hasAccess`), then `renderPage()` switches to the matching feature component or a **standalone app shell**.
3. Truly public routes are rendered directly by `App.tsx`: `/shop/:storeId/*` (storefront), `/track/:trackingNumber` (shipment tracking), `/offers/track/:id`, `/privacy`, `/terms`, and the dedicated auth pages.

### Cross-cutting patterns
- **Offline‑first:** every mutation goes through `api.*`; when offline it is queued in IndexedDB and the UI updates optimistically. `syncOfflineMutations()` replays the queue on reconnect (`onlineStatusChange` event → `handleSync`).
- **Soft paywall:** a locked module returns HTTP **402**; `PaywallHost` intercepts it and pops an upgrade prompt instead of erroring.
- **Per‑user last page** is persisted to `localStorage` for resume‑on‑reload.
- **Super Admin dual mode:** a superadmin toggles between platform `superadmin` mode and acting inside a selected store (`store` mode).

---

## 3. Roles & Access (RBAC)

Canonical map in `utils/rbac.ts` (`ROLE_PAGES`), mirrored by the backend. Roles:

| Role | Default landing | Scope |
|---|---|---|
| `superadmin` | Super Admin | Whole platform (+ can enter any store) |
| `admin` | Business Dashboard | Full store access |
| `staff` | Sales / POS | Sell, returns, read customers |
| `inventory_manager` | Business Dashboard | Inventory, suppliers, purchasing |
| `customer` | Marketplace portal | Public buyer dashboard / orders |
| `supplier` | Supplier dashboard | Supplier orders |

Page access = `ROLE_PAGES[role]` ∩ (module entitlement via `utils/entitlements`).

---

## 4. Feature Catalog

Each feature below is launched as a tile from the **Discover** launcher (`components/pos/PosDiscover.tsx`).
"Functions" = the concrete handlers (mostly in `Dashboard.tsx`) and screens that power it.

### 4.1 Discover (App Launcher)
`components/pos/PosDiscover.tsx` — the home screen: searchable grid of the apps a user is entitled to, premium feature cards, rotating tips, and onboarding nudges.
- Filters tiles by `allowedPages` (RBAC) and module entitlement; premium/coming‑soon badges.

### 4.2 Point of Sale
- **Hustle POS** (`pages/hustle/HustleApp.tsx`) — fast amount‑entry sales.
- **Full POS / Sales** (`pages/SalesPage.tsx`, `components/sales/*`, `components/pos/PosShell.tsx`, `PosDashboard.tsx`).
- **Functions:** `handleProcessSale`, `handleRecordPayment` (partial/credit), `handleProcessReturn`; barcode scanning (`barcodeService`, `UnifiedScannerModal`); offline sale queueing with optimistic stock/customer‑balance updates.

### 4.3 Inventory & Products
- **Inventory Manager app** (`components/inventory-app/InventoryApp.tsx`) + `pages/InventoryPage.tsx`, `components/products/*`, `components/inventory/*`.
- **Stock takes** (`pages/StockTakePage.tsx`), **Categories** (`pages/CategoriesPage.tsx`).
- **Functions:** `handleSaveProduct` (create/update w/ images), `handleDeleteProduct`, `handleArchiveProduct`, `handleStockChange`, `handleStockAdjustment`; stock‑take lifecycle: `handleStartStockTake` → `handleUpdateStockTakeItem` → `handleFinalizeStockTake` / `handleCancelStockTake`; `handleSaveCategory` / `handleDeleteCategory`. Hook: `hooks/useProductForm.ts`.
- **Gating:** product cap unless `unlimited_products`; `auto_reorder`, `quick_import` modules.

### 4.4 Business Dashboard & Reports
- **Business Dashboard app** (`components/dash-app/DashboardApp.tsx`), **Reports** (`pages/ReportsPage.tsx`, `components/reports/*`).
- **Functions:** sales/inventory/customer/cashflow stat rows, charts, P&L & cashflow tabs, export (PDF/xlsx via `utils/pdfExport`).
- **Gating:** deep analytics behind `advanced_reports`.

### 4.5 CRM
- `components/crm/CrmApp.tsx` (+ `CrmWhatsApp.tsx`), `pages/CustomersPage.tsx`, `components/customers/*`.
- **Functions:** `handleSaveCustomer` / `handleDeleteCustomer`; loyalty, segments, insights; store credit & account balances; two‑way **WhatsApp Inbox** (see 4.11).

### 4.6 Procurement & Suppliers
- **Procurement Hub** (`components/procure-app/ProcureApp.tsx`), **Purchase Orders app** (`pages/purchase-orders/PurchaseOrdersApp.tsx`, `pages/PurchaseOrdersPage.tsx`), `pages/SuppliersPage.tsx`.
- **Functions:** `handleSaveSupplier` / `handleDeleteSupplier`, `handleSavePurchaseOrder` / `handleDeletePurchaseOrder`, `handleReceivePOItems` (receive stock → updates inventory + PO status).

### 4.7 Accounting Hub
- `pages/accounting/AccountingApp.tsx`, `pages/AccountingPage.tsx`, `components/accounting/*`.
- **Functions:** `handleSaveAccount` / `handleDeleteAccount` (chart of accounts), `handleAddManualJournalEntry`, `handleSaveSupplierInvoice` + `handleRecordSupplierPayment`, `handleSaveExpense` / `handleDeleteExpense`, `handleSaveRecurringExpense` / `handleDeleteRecurringExpense`. Outputs: ledger, P&L, cashflow.

### 4.8 Logistics & Shipment Tracking
- **Logistics app** (`pages/logistics/LogisticsApp.tsx`, `pages/LogisticsPage.tsx`), **public tracking** (`pages/logistics/TrackShipmentPage.tsx` at `/track/:trackingNumber`), offers live tracking (`components/offers/OfferLiveTracking.tsx`).
- **Functions:** shipments, couriers/fleet, map view (Leaflet), customer‑facing tracking. **Gating:** `public_tracking`.

### 4.9 Online Store (Storefront)
- Owner app: `components/shop/OnlineStoreApp.tsx` (storefront link, QR, share, scheduled WhatsApp catalog sharing).
- Public storefront: `pages/shop/ShopLayout.tsx` → `ShopHomePage`, `ShopProductList`, `ShopProductDetail`, `CartPage` (route `/shop/:storeId`). Service: `shop.service.ts` (`shopService`).

### 4.10 Marketing Suite *(flagged "Coming Soon")*
- `components/marketing/MarketingApp.tsx` — manage a Facebook Page: publish, moderate comments, insights, AI poster generation.
- Service: `facebookService` (`loadFacebookSdk`, `facebookLogin`, Graph proxy). **Module:** `social_marketing`.

### 4.11 Messaging — WhatsApp / SMS
- `pages/WhatsAppConversationsPage.tsx`, `pages/WhatsAppSettingsPage.tsx`, `components/whatsapp/*` (ChatWindow, Inbox).
- Services: `whatsappService`, `whatsappCampaignService` (scheduled campaigns), `smsService`, `messagesService`.
- **Modules:** `whatsapp_messaging`, `sms_messaging`.

### 4.12 Business Assistant (AI)
- `pages/assistant/AssistantApp.tsx`, `components/ai/*`, `services/geminiService.ts` (`generateDescription`, data chat).
- **Functions:** natural‑language Q&A over store data, AI product descriptions, day summaries. **Module:** `ai_assistant`.

### 4.13 My Businesses (Multi‑Store)
- `components/standalone/MultiStoreApp.tsx`; service `storesService` (`getMyStores`, `switchStore`, `registerStoreAndRefreshUser`, `checkStoreNameAvailability`, `verifyStoreOTP`).
- **Functions:** register multiple shops under one account, switch active store.

### 4.14 User Manager (Team)
- `components/team-app/TeamApp.tsx`, `pages/UsersPage.tsx`, `components/users/*`.
- **Functions:** `handleSaveUser` / `handleDeleteUser`, role assignment (RBAC). **Module:** `team_members`.

### 4.15 Settings, Profile & Account
- **Settings app** (`pages/settings/SettingsApp.tsx`, `pages/SettingsPage.tsx`, `components/settings/sections/*`): store details, POS, financial, inventory, notification settings. Handler: `handleSaveSettings`.
- **Account / Profile** (`pages/profile/ProfileApp.tsx`, `pages/ProfilePage.tsx`): `handleUpdateProfile`, `handleChangePassword`.

### 4.16 Audit Trail & Notifications
- **Audit** (`pages/audit/AuditApp.tsx`, `pages/AuditLogPage.tsx`) — activity log.
- **Notifications** (`pages/notifications/NotificationsApp.tsx`, `pages/NotificationsPage.tsx`) — push via `notificationService` + Firebase messaging SW; realtime via `socketService`; `NotificationContext`.

### 4.17 Subscription & Billing
- `pages/subscription/SubscriptionApp.tsx`, `components/subscription/*`.
- **Functions:** plan selection, monthly/annual billing (20% annual discount), à‑la‑carte add‑on checkout (Lenco), per‑module expiry, auto‑renew + dunning. Gating via `utils/entitlements` (`MODULES`, `hasModule`, `PAGE_MODULES`).

### 4.18 Super Admin (Platform Control Plane)
- `components/superadmin-app/SuperAdminApp.tsx`, `pages/superadmin/*` (Dashboard, Stores, StoreDetails, Subscriptions, Catalog, Notifications, Settings).
- **Functions:** manage all stores, subscriptions, the **plans & pricing catalog** (drives module gating app‑wide), broadcast notifications, platform settings.

### 4.19 Onboarding & Help
- `contexts/OnboardingContext.tsx`, `components/onboarding/*`, `components/TourGuide.tsx` (react‑joyride), `pages/UserGuidePage.tsx`, `pages/SupportPage.tsx`.
- Service: `onboardingService` (`getOnboardingState`, `completeAction`, `dismissHelper`, `resetOnboarding`).

---

## 5. Monetizable Modules

Defined in `utils/entitlements.ts` (`MODULES`); each maps a feature to an add‑on the Super Admin catalog can price.

| Module id | Unlocks |
|---|---|
| `advanced_reports` | Deep analytics, P&L/cashflow export |
| `ai_assistant` | Business Assistant (Gemini) |
| `whatsapp_messaging` | WhatsApp send + Inbox |
| `sms_messaging` | SMS messaging |
| `social_marketing` | Marketing Suite (Facebook) |
| `team_members` | Additional team users |
| `auto_reorder` | Automated reorder suggestions |
| `quick_import` | Bulk product import |
| `public_tracking` | Customer shipment tracking |
| `unlimited_products` | Removes product cap |

Gating flow: backend returns **402** for a locked module → `PaywallHost` shows upgrade prompt. Page→module map is loaded live from `/subscriptions/page-modules` (falls back to static `PAGE_MODULES`).

---

## 6. Services Layer (`services/`)

| Service | Responsibility / key functions |
|---|---|
| `api.ts` | Offline‑first REST client. `api.get/post/put/patch/delete`, `getOnlineStatus`, `buildAssetUrl`, `syncOfflineMutations`, `API_BASE_URL` |
| `authService.ts` | `login`, `register`, `registerCustomer`, `loginWithGoogle`, `logout`, `getCurrentUser`, `verifySession`, `forgotPassword`, `verifyRegistration`, `changePassword`, `getUsers`/`saveUser`/`deleteUser` |
| `dbService.ts` | IndexedDB wrapper (offline cache, mutation queue, `getLastSync`/`updateLastSync`) |
| `socketService.ts` | Singleton socket.io client (realtime requests/notifications) |
| `notificationService.ts` | Web push registration + delivery (with Firebase messaging) |
| `geminiService.ts` | AI — `generateDescription`, assistant queries |
| `whatsappService.ts` / `whatsappCampaignService.ts` | WhatsApp send/status/messages + scheduled campaigns |
| `facebookService.ts` | `loadFacebookSdk`, `facebookLogin`, Graph API proxy, `FACEBOOK_SCOPES` |
| `smsService.ts` / `messagesService.ts` | SMS + generic messaging |
| `offersService.ts` | Deal offers + live tracking |
| `shop.service.ts` | Public storefront data (`shopService`) |
| `storesService.ts` | Multi‑store: `getMyStores`, `switchStore`, `registerStoreAndRefreshUser`, `checkStoreNameAvailability`, `verifyStoreOTP` |
| `onboardingService.ts` | Onboarding state/actions/helpers |
| `barcodeService.ts` | Barcode/QR generation & scanning helpers |

---

## 7. State, Contexts & Utilities

**Contexts (`contexts/`):** `ThemeContext` (light/dark), `ToastContext` + `NotificationContext` (alerts), `OnboardingContext` (guided setup).

**Utilities (`utils/`):**
- `entitlements.ts` — `MODULES`, `hasModule`, `PAGE_MODULES`, `setPageModules` (module gating).
- `rbac.ts` — `ROLE_PAGES`, permissions per role.
- `currency.ts` (`formatCurrency` — Kwacha), `date.ts` (`formatDate`), `ui.ts` (`INPUT_CLASS`, shared classes).
- `pdfExport.ts` — PDF/report generation. `helpers.ts` — misc (`toSnakeCase`, …).

**Central data store:** `Dashboard.tsx` holds products, categories, customers, suppliers, sales, returns, purchase orders, supplier invoices, accounts, journal entries, audit logs, expenses, recurring expenses, users, and store settings — hydrated by one `fetchData()` (`Promise.allSettled` over the REST endpoints) and mutated through the `handle*` functions listed in §4.

---

## 8. Notes / Known Gaps

- The REST API is in a **separate `s-back` repo**; `server.js` here only serves the built SPA.
- Three pre‑existing type issues remain (not dead code): `components/VerifyEmailOtpModal.tsx`, `pages/customers/CustomerDashboard.tsx`, `pages/ReturnsPage.tsx`.
- Marketplace/Directory and the customer‑login routes are present but **commented out** in `App.tsx` (parked, not live).
- Marketing Suite is shipped but gated behind a **`MARKETING_COMING_SOON`** flag.

---

*Generated from a structural pass over `App.tsx`, `Dashboard.tsx`, `components/`, `pages/`, `services/`, `utils/`. Routes/handlers/modules reflect the code as of this commit.*
