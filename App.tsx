export type SnackbarType = 'success' | 'error' | 'info' | 'warning' | 'sync';
import { lazy, Suspense, useEffect } from 'react';
import { ToastProvider } from './contexts/ToastContext';
import { Routes, Route } from 'react-router-dom';
import TitleBar from './components/TitleBar';
import LoadingSpinner from './components/LoadingSpinner';
import ThemeToggle from './components/ThemeToggle';
import ErrorBoundary from './components/ErrorBoundary';
import PaywallHost from './components/PaywallHost';

// Lazy load route components
const Dashboard = lazy(() => import('@/Dashboard'));
const OfferLiveTracking = lazy(() => import('@/components/offers/OfferLiveTracking'));
const SubscriptionPage = lazy(() => import('@/pages/subscription/SubscriptionApp'));
const TrackShipmentPage = lazy(() => import('@/pages/logistics/TrackShipmentPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));

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
                      <ErrorBoundary name="routes">
                        <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                            <Routes>
                                {/* Default route starts at Login/Dashboard */}
                                <Route path="/privacy" element={<PrivacyPolicyPage />} />
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

                                {/* Standalone POS app (own shell: POS / Inventory / Dashboard) */}
                                <Route path="/pos" element={<Dashboard />} />
                                <Route path="/pos/inventory" element={<Dashboard />} />
                                <Route path="/pos/dashboard" element={<Dashboard />} />
                                <Route path="/pos/discover" element={<Dashboard />} />

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

                                {/* Standalone Inventory Manager app (own shell: Dashboard / Inventory / Alerts) */}
                                <Route path="/inv" element={<Dashboard />} />
                                <Route path="/inv/items" element={<Dashboard />} />
                                <Route path="/inv/alerts" element={<Dashboard />} />

                                {/* Standalone User Manager app (own shell: Team / Roles) */}
                                <Route path="/team" element={<Dashboard />} />
                                <Route path="/team/roles" element={<Dashboard />} />

                                {/* Standalone Supplier & Procurement Hub (own shell: Dashboard / Suppliers / Orders) */}
                                <Route path="/procure" element={<Dashboard />} />
                                <Route path="/procure/suppliers" element={<Dashboard />} />
                                <Route path="/procure/orders" element={<Dashboard />} />

                                {/* Admin Dashboard Routes (All point to Dashboard) */}
                                <Route path="/reports" element={<Dashboard />} />
                                <Route path="/inventory" element={<Dashboard />} />
                                <Route path="/sales" element={<Dashboard />} />
                                <Route path="/sales-history" element={<Dashboard />} />

                                <Route path="/returns" element={<Dashboard />} />
                                <Route path="/customers" element={<Dashboard />} />
                                <Route path="/suppliers" element={<Dashboard />} />
                                <Route path="/purchase-orders" element={<Dashboard />} />
                                <Route path="/categories" element={<Dashboard />} />
                                <Route path="/stock-takes" element={<Dashboard />} />
                                <Route path="/accounting" element={<Dashboard />} />
                                <Route path="/audit-trail" element={<Dashboard />} />
                                <Route path="/users" element={<Dashboard />} />
                                <Route path="/notifications" element={<Dashboard />} />

                                <Route path="/profile" element={<Dashboard />} />
                                <Route path="/settings" element={<Dashboard />} />
                                <Route path="/subscription" element={<SubscriptionPage />} />
                                <Route path="/user-guide" element={<Dashboard />} />

                                {/* Super Admin Routes */}
                                <Route path="/superadmin" element={<Dashboard />} />
                                <Route path="/superadmin/stores" element={<Dashboard />} />
                                <Route path="/superadmin/notifications" element={<Dashboard />} />
                                <Route path="/superadmin/subscriptions" element={<Dashboard />} />
                                <Route path="/superadmin/catalog" element={<Dashboard />} />


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
                                <Route path="*" element={<Dashboard />} />
                            </Routes>
                        </Suspense>
                      </ErrorBoundary>

                    </div>

                    {/* Global, always-visible light/dark switch */}
                    <ThemeToggle />

                    {/* Global soft paywall — pops an upgrade prompt on a 402 (locked add-on) */}
                    <PaywallHost />
                </div>

            </ToastProvider>
        </ThemeProvider>
    );
};
