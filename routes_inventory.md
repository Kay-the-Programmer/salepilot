# SalePilot Routes Inventory

This document outlines all 29 routes identified in the SalePilot application. Routes are categorized by their primary function and target component.

## Public Routes
These routes are accessible without any authentication.

| # | Route Path | Component | Description |
|---|------------|-----------|-------------|
| 1 | `/` | `LandingPage` | The main marketing landing page for SalePilot. |
| 2 | `/directory` | `MarketplacePage` | A public directory of all stores using SalePilot. |

## Authentication Routes
Handled by the `Dashboard` wrapper which delegates to `LoginPage` for non-authenticated users.

| # | Route Path | Component | Description |
|---|------------|-----------|-------------|
| 3 | `/login` | `LoginPage` | User sign-in page. |
| 4 | `/register` | `LoginPage` | New user registration page. |
| 5 | `/forgot-password` | `LoginPage` | Password recovery request page. |

## Admin Dashboard Routes
These routes are managed by the `Dashboard` component and require a valid user session. They include the main sidebar and application layout.

| # | Route Path | Component | Description |
|---|------------|-----------|-------------|
| 6 | `/reports` | `ReportsPage` | Main dashboard with analytics and summaries. |
| 7 | `/sales` | `SalesPage` | POS (Point of Sale) terminal for creating new sales. |
| 8 | `/sales-history` | `AllSalesPage` | List and filter all historical sales. |
| 9 | `/orders` | `OrdersPage` | Online order management and processing. |
| 10 | `/inventory` | `InventoryPage` | Product management, stock levels, and variants. |
| 11 | `/categories` | `CategoriesPage` | Product category and attribute definition. |
| 12 | `/stock-takes` | `StockTakePage` | Inventory counting and adjustment sessions. |
| 13 | `/returns` | `ReturnsPage` | Processing customer returns and refunds. |
| 14 | `/customers` | `CustomersPage` | CRM for managing customer profiles and credit. |
| 15 | `/suppliers` | `SuppliersPage` | Supplier directory and contact management. |
| 16 | `/purchase-orders` | `PurchaseOrdersPage` | Procurement and stock reception management. |
| 17 | `/accounting` | `AccountingPage` | Financial ledger, accounts, and journal entries. |
| 18 | `/audit-trail` | `AuditLogPage` | System logs for tracking changes and user actions. |
| 19 | `/users` | `UsersPage` | Internal user management (staff, admins, etc). |
| 20 | `/notifications` | `NotificationsPage` | System notifications and announcements. |
| 21 | `/profile` | `ProfilePage` | Personal user settings and password management. |
| 22 | `/settings` | `SettingsPage` | Store-wide configuration and preferences. |
| 23 | `/superadmin` | `SuperAdminPage` | Multi-store management (Superadmin role only). |
| 24 | `/marketing` | `MarketingPage` | AI-powered social media poster generator. |
| 25 | `/setup-store` | `StoreSetupPage` | Initial onboarding for new users/stores. |

## Online Store (Public)
Routes for the customer-facing online storefront.

| # | Route Path | Component | Description |
|---|------------|-----------|-------------|
| 26 | `/shop/:storeId` | `ShopHomePage` | Homepage for a specific online store. |
| 27 | `/shop/:storeId/products` | `ShopProductList` | Product listing/search for an online store. |
| 28 | `/shop/:storeId/product/:productId` | `ShopProductDetail` | Detailed product view for customers. |
| 29 | `/shop/:storeId/cart` | `CartPage` | Shopping cart and checkout initiation. |

## Notes
- All Admin routes are protected and will redirect to `/login` if no session exists.
- The `Dashboard` component handles navigation between admin pages using nested path detection.
- Any unrecognized path (`*`) currently falls back to the `Dashboard`, which defaults to the `Reports` or `Inventory` page depending on user permissions.
