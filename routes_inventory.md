# SalePilot Routes Inventory

The legacy sidebar admin shell has been retired (July 2026). Every surface is now a
**standalone app** with its own chrome, launched from the SalePilot app switcher.
Old admin URLs remain as permanent redirects so bookmarks and saved last-page keys
keep working.

## Public Routes

| Route Path | Component | Description |
|------------|-----------|-------------|
| `/` | `Dashboard` (fallback) | Redirects an authenticated user to their role's default app; login otherwise. |
| `/privacy`, `/terms` | Static pages | Legal pages. |
| `/track`, `/track/:trackingNumber` | `TrackShipmentPage` | Public shipment tracking. |
| `/offers/track/:id` | `OfferLiveTracking` | Public offer tracking. |
| `/shop/:storeId/*` | `ShopLayout` + children | Customer-facing online storefront (home, products, product, cart). |

## Authentication

| Route Path | Description |
|------------|-------------|
| `/login`, `/register` | Login + the single registration wizard (account + store). |
| `/forgot-password`, `/auth/reset-password`, `/auth/verify-email` | Dedicated auth pages. |
| `/setup-store` | Legacy alias → `/register`. |

## Standalone Apps (app switcher)

| Route | App | Notes |
|-------|-----|-------|
| `/pos`, `/pos/history`, `/pos/dashboard` | POS Terminal | `/pos/history` = Sales History & Refunds (returns live here). `/pos/inventory` redirects to `/inv/items`. |
| `/hustle` | Hustle POS | Fast amount-entry sales. |
| `/dash`, `/dash/sales`, `/dash/products` | Business Dashboard | |
| `/reports` | Reports | Full analytics; ships its own chrome. |
| `/orders` | Orders | Online order management (Velocity-styled). |
| `/crm`, `/crm/customers`, `/crm/loyalty`, `/crm/insights` | CRM | |
| `/inv`, `/inv/items`, `/inv/stock-takes`, `/inv/alerts` | Inventory Manager | Stock takes are a section of this app. |
| `/procure`, `/procure/suppliers`, `/procure/orders`, `/procure/lists` | Purchase Orders | Suppliers + PO manager + Order Lists (merged former `/po` app). |
| `/po` | → redirects to `/procure/lists` | Legacy Purchase Orders app, folded into the hub. |
| `/books` | Accounting Hub | |
| `/team`, `/team/roles` | User Manager | |
| `/audit` | Audit Trail | |
| `/notify` | Notifications | |
| `/account` | Account / Profile | |
| `/config` | Settings | |
| `/subscription` | Subscription | Plan, billing & modules. |
| `/assistant`, `/assistant/chat` | Business Assistant (AI) | |
| `/businesses` | Business Manager | Multi-store portfolio hub. |
| `/fleet` | Logistics | |
| `/marketing` | Marketing Suite | Gated "Coming Soon". |
| `/store` | Online Store | Storefront link/QR/catalog sharing. |
| `/superadmin`, `/superadmin/{stores,notifications,subscriptions,catalog,campaigns,feedback,whatsapp,whatsapp-settings,settings}` | Super Admin | Platform control center; WhatsApp console lives here. "Store Mode" button switches the superadmin into store apps. |

## Standalone Pages (no launcher entry)

| Route | Page | Reached from |
|-------|------|--------------|
| `/user-guide` | User Guide | Account app → "Help & guide". |
| `/support` | Support | Privacy page. |
| `/directory`, `/marketplace` (+ `/marketplace/request/:id`) | B2B Marketplace | In-app links. |
| `/customer/dashboard`, `/customer/orders` | Customer portal | Customer role default. |
| `/supplier/dashboard`, `/supplier/orders` | Supplier portal | Supplier role default. |

## Legacy Redirects (permanent)

| Old route | Redirects to |
|-----------|--------------|
| `/inventory`, `/categories` | `/inv/items` |
| `/stock-takes` | `/inv/stock-takes` |
| `/sales`, `/sales-history`, `/returns` | `/pos/history` |
| `/customers` | `/crm/customers` |
| `/suppliers` | `/procure/suppliers` |
| `/purchase-orders` | `/procure/orders` |
| `/accounting` | `/books` |
| `/audit-trail` | `/audit` |
| `/users` | `/team` |
| `/notifications` | `/notify` |
| `/profile` | `/account` |
| `/settings` | `/config` |
| `/logistics` | `/fleet` |
| `/quick-view` | `/assistant` |
| `/whatsapp/conversations` | `/superadmin/whatsapp` |
| `/whatsapp/settings` | `/superadmin/whatsapp-settings` |

## Notes
- Route guards: each app branch in `Dashboard.tsx` checks the role's page permissions from `utils/rbac.ts` (`ROLE_PAGES`); the app switcher uses the same map via `standaloneApps.ts`.
- Unknown paths fall back to the role's default app (`DEFAULT_PAGES`): superadmin → `/superadmin` (or `/dash` in Store Mode), admin/inventory_manager → `/dash`, staff → `/pos`, customer/supplier → their portals.
- Deleted with the legacy shell: `components/Sidebar.tsx`, `pages/{QuickView, SuppliersPage, CategoriesPage, ProfilePage, SettingsPage, UsersPage, NotificationsPage, AuditLogPage, LogisticsPage, AllSalesPage, ReturnsPage}.tsx`, `components/sales/all_sales/*`, and the SettingsPage-only settings sections.
