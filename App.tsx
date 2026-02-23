export type SnackbarType = 'success' | 'error' | 'info' | 'warning' | 'sync';
import { lazy, Suspense } from 'react';
import { ToastProvider } from './contexts/ToastContext';
import { Routes, Route } from 'react-router-dom';
import TitleBar from './components/TitleBar';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load route components
const Dashboard = lazy(() => import('@/Dashboard'));
const OfferLiveTracking = lazy(() => import('@/components/offers/OfferLiveTracking'));
const SubscriptionPage = lazy(() => import('@/pages/SubscriptionPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage'));

import { ThemeProvider } from './contexts/ThemeContext';

import usePageTracking from "./src/hooks/usePageTracking";
import { initGA } from "./src/utils/analytics";

// Initialize GA
initGA();

export default function App() {
    usePageTracking();
    return (
        <ThemeProvider>
            <ToastProvider>
                <div className="flex flex-col h-screen overflow-hidden dark:bg-slate-950 transition-colors duration-200">
                    <TitleBar />
                    <div className="flex-1 overflow-auto">
                        <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                            <Routes>
                                {/* Default route starts at Login/Dashboard */}
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


                                {/* <Route path="/directory" element={<MarketplacePage />} />
                                <Route path="/directory/request/:requestId" element={<Dashboard />} />
                                <Route path="/marketplace" element={<MarketplacePage />} />
                                <Route path="/marketplace/track/:requestId" element={<CustomerRequestTrackingPage />} /> */}
                                <Route path="/offers/track/:id" element={<OfferLiveTracking />} />

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

                    </div>
                </div>

            </ToastProvider>
        </ThemeProvider>
    );
};
