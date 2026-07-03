export type SnackbarType = 'success' | 'error' | 'info' | 'warning' | 'sync';
import { lazy, Suspense, useEffect } from 'react';
import { ToastProvider } from './contexts/ToastContext';
import { Routes, Route, Navigate } from 'react-router-dom';
import TitleBar from './components/TitleBar';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import PaywallHost from './components/PaywallHost';
import FeedbackWidget from './components/feedback/FeedbackWidget';
import { LogoutModalProvider } from './contexts/LogoutModalContext';
import { AppSwitcherProvider } from './contexts/AppSwitcherContext';

// Lazy load route components
const Dashboard = lazy(() => import('@/Dashboard'));
const OfferLiveTracking = lazy(() => import('@/components/offers/OfferLiveTracking'));
const SubscriptionPage = lazy(() => import('@/pages/subscription/SubscriptionApp'));
const TrackShipmentPage = lazy(() => import('@/pages/logistics/TrackShipmentPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('@/pages/TermsOfServicePage'));
// Public customer-facing storefront (the "Online Store").
const ShopLayout = lazy(() => import('@/pages/shop/ShopLayout'));
const ShopHomePage = lazy(() => import('@/pages/shop/ShopHomePage'));
const ShopProductList = lazy(() => import('@/pages/shop/ShopProductList'));
const ShopProductDetail = lazy(() => import('@/pages/shop/ShopProductDetail'));
const CartPage = lazy(() => import('@/pages/shop/CartPage'));

import { ThemeProvider } from './contexts/ThemeContext';

import usePageTracking from "./src/hooks/usePageTracking";
import { initGA } from "./src/utils/analytics";
import { api } from './services/api';
import { setPageModules } from './utils/entitlements';


export default function App() {
    useEffect(() => {
        // Initialize GA
        initGA();
        // Load the Super-Admin-configured page→add-on map so page gating reflects
        // the live catalog (falls back to the static map on failure).
        api.get<Record<string, string>>('/subscriptions/page-modules')
            .then(setPageModules)
            .catch(() => { /* keep static fallback */ });
    }, []);

    usePageTracking();
    return (
        <ThemeProvider>
            <ToastProvider>
                <div className="flex flex-col h-screen overflow-hidden dark:bg-slate-950 transition-colors duration-200">
                    <TitleBar />
                    <div className="flex-1 overflow-auto">
                      <LogoutModalProvider>
                      <AppSwitcherProvider>
                      <ErrorBoundary name="routes">
                        <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                            <Routes>
                                {/* Default route starts at Login/Dashboard */}
                                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                                <Route path="/terms" element={<TermsOfServicePage />} />
                                <Route
                                    path="/"
                                    element={<Dashboard />}
                                />



                                {/* Authentication & Onboarding handled by Dashboard */}
                                <Route path="/login" element={<Dashboard />} />
                                <Route path="/register" element={<Dashboard />} />

                                {/* Dedicated Auth Pages */}
                                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                                <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                                <Route path="/auth/verify-email" element={<VerifyEmailPage />} />

                                <Route path="/setup-store" element={<Dashboard />} />

                                {/* Standalone POS app (own shell: POS / History & Refunds / Inventory / Dashboard) */}
                                <Route path="/pos" element={<Dashboard />} />
                                <Route path="/pos/history" element={<Dashboard />} />
                                <Route path="/pos/inventory" element={<Dashboard />} />
                                <Route path="/pos/dashboard" element={<Dashboard />} />

                                {/* Standalone Business Dashboard app (own shell: Dashboard / Sales / Products) */}
                                <Route path="/dash" element={<Dashboard />} />
                                <Route path="/dash/sales" element={<Dashboard />} />
                                <Route path="/dash/products" element={<Dashboard />} />

                                {/* Standalone CRM app (own shell: Dashboard / Customers / Loyalty / Insights) */}
                                <Route path="/crm" element={<Dashboard />} />
                                <Route path="/crm/customers" element={<Dashboard />} />
                                <Route path="/crm/loyalty" element={<Dashboard />} />
                                <Route path="/crm/insights" element={<Dashboard />} />

                                {/* Standalone Business Assistant app (AI Suite — own shell rendered by Dashboard) */}
                                <Route path="/assistant" element={<Dashboard />} />
                                <Route path="/assistant/chat" element={<Dashboard />} />

                                {/* Standalone utility apps (own M3 shell rendered by Dashboard) */}
                                <Route path="/audit" element={<Dashboard />} />
                                <Route path="/notify" element={<Dashboard />} />
                                <Route path="/account" element={<Dashboard />} />
                                <Route path="/books" element={<Dashboard />} />
                                <Route path="/fleet" element={<Dashboard />} />
                                <Route path="/po" element={<Dashboard />} />
                                <Route path="/hustle" element={<Dashboard />} />
                                <Route path="/config" element={<Dashboard />} />

                                {/* Standalone Inventory Manager app (own shell: Dashboard / Inventory / Stock Takes / Alerts) */}
                                <Route path="/inv" element={<Dashboard />} />
                                <Route path="/inv/items" element={<Dashboard />} />
                                <Route path="/inv/stock-takes" element={<Dashboard />} />
                                <Route path="/inv/alerts" element={<Dashboard />} />

                                {/* Standalone User Manager app (own shell: Team / Roles) */}
                                <Route path="/team" element={<Dashboard />} />
                                <Route path="/team/roles" element={<Dashboard />} />

                                {/* Standalone Supplier & Procurement Hub (own shell: Dashboard / Suppliers / Orders) */}
                                <Route path="/procure" element={<Dashboard />} />
                                <Route path="/procure/suppliers" element={<Dashboard />} />
                                <Route path="/procure/orders" element={<Dashboard />} />

                                {/* Standalone pages that replaced the legacy admin shell */}
                                <Route path="/reports" element={<Dashboard />} />
                                <Route path="/orders" element={<Dashboard />} />
                                <Route path="/subscription" element={<SubscriptionPage />} />
                                <Route path="/user-guide" element={<Dashboard />} />
                                <Route path="/support" element={<Dashboard />} />

                                {/* Sales History & Refunds live inside the POS app */}
                                <Route path="/sales" element={<Navigate to="/pos/history" replace />} />
                                <Route path="/sales-history" element={<Navigate to="/pos/history" replace />} />
                                <Route path="/returns" element={<Navigate to="/pos/history" replace />} />

                                {/* Legacy admin routes — permanent redirects into the standalone apps.
                                    The legacy sidebar shell is gone; these aliases keep old links,
                                    bookmarks and saved last-page keys working. */}
                                <Route path="/inventory" element={<Navigate to="/inv/items" replace />} />
                                <Route path="/categories" element={<Navigate to="/inv/items" replace />} />
                                <Route path="/stock-takes" element={<Navigate to="/inv/stock-takes" replace />} />
                                <Route path="/customers" element={<Navigate to="/crm/customers" replace />} />
                                <Route path="/suppliers" element={<Navigate to="/procure/suppliers" replace />} />
                                <Route path="/purchase-orders" element={<Navigate to="/procure/orders" replace />} />
                                <Route path="/accounting" element={<Navigate to="/books" replace />} />
                                <Route path="/audit-trail" element={<Navigate to="/audit" replace />} />
                                <Route path="/users" element={<Navigate to="/team" replace />} />
                                <Route path="/notifications" element={<Navigate to="/notify" replace />} />
                                <Route path="/profile" element={<Navigate to="/account" replace />} />
                                <Route path="/settings" element={<Navigate to="/config" replace />} />
                                <Route path="/logistics" element={<Navigate to="/fleet" replace />} />
                                <Route path="/quick-view" element={<Navigate to="/assistant" replace />} />
                                <Route path="/whatsapp/conversations" element={<Navigate to="/superadmin/whatsapp" replace />} />
                                <Route path="/whatsapp/settings" element={<Navigate to="/superadmin/whatsapp-settings" replace />} />

                                {/* Super Admin Routes */}
                                <Route path="/superadmin" element={<Dashboard />} />
                                <Route path="/superadmin/stores" element={<Dashboard />} />
                                <Route path="/superadmin/notifications" element={<Dashboard />} />
                                <Route path="/superadmin/subscriptions" element={<Dashboard />} />
                                <Route path="/superadmin/catalog" element={<Dashboard />} />
                                <Route path="/superadmin/campaigns" element={<Dashboard />} />
                                <Route path="/superadmin/feedback" element={<Dashboard />} />
                                <Route path="/superadmin/whatsapp" element={<Dashboard />} />
                                <Route path="/superadmin/whatsapp-settings" element={<Dashboard />} />


                                {/* <Route path="/directory" element={<MarketplacePage />} />
                                <Route path="/directory/request/:requestId" element={<Dashboard />} />
                                <Route path="/marketplace" element={<MarketplacePage />} />
                                <Route path="/marketplace/track/:requestId" element={<CustomerRequestTrackingPage />} /> */}
                                <Route path="/offers/track/:id" element={<OfferLiveTracking />} />

                                {/* Public shipment tracking — no auth, for customers with a tracking number */}
                                <Route path="/track" element={<TrackShipmentPage />} />
                                <Route path="/track/:trackingNumber" element={<TrackShipmentPage />} />

                                {/* Customer Dashboard - Protected by Dashboard logic */}
                                {/* <Route path="/customer/login" element={<Dashboard />} />
                                <Route path="/customer/register" element={<Dashboard />} />
                                <Route path="/customer/dashboard" element={<Dashboard />} />
                                <Route path="/customer/orders" element={<Dashboard />} />
                                <Route path="/register-supplier" element={<SupplierRegisterPage />} /> */}

                                {/* Supplier Routes - Protected by Dashboard logic */}
                                <Route path="/supplier/dashboard" element={<Dashboard />} />
                                <Route path="/supplier/orders" element={<Dashboard />} />

                                {/* Fallback */}
                                {/* Public Online Store (customer-facing storefront) */}
                                <Route path="/shop/:storeId" element={<ShopLayout />}>
                                    <Route index element={<ShopHomePage />} />
                                    <Route path="products" element={<ShopProductList />} />
                                    <Route path="product/:productId" element={<ShopProductDetail />} />
                                    <Route path="cart" element={<CartPage />} />
                                </Route>

                                <Route path="*" element={<Dashboard />} />
                            </Routes>
                        </Suspense>
                      </ErrorBoundary>
                      </AppSwitcherProvider>
                      </LogoutModalProvider>

                    </div>

                    {/* Theme control now lives in each app's top bar / nav rail (no floating switch). */}

                    {/* Global soft paywall — pops an upgrade prompt on a 402 (locked add-on) */}
                    <PaywallHost />

                    {/* Global feedback capture — floating trigger + modal for any signed-in user */}
                    <FeedbackWidget />
                </div>

            </ToastProvider>
        </ThemeProvider>
    );
};
