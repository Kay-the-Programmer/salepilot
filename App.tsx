export type SnackbarType = 'success' | 'error' | 'info' | 'warning' | 'sync';
import { lazy, Suspense } from 'react';
import { ToastProvider } from './contexts/ToastContext';
import { Routes, Route } from 'react-router-dom';
import TitleBar from './components/TitleBar';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load route components
const Dashboard = lazy(() => import('@/Dashboard'));
const ShopLayout = lazy(() => import('@/pages/shop/ShopLayout'));
const ShopHomePage = lazy(() => import('@/pages/shop/ShopHomePage'));
const ShopProductList = lazy(() => import('@/pages/shop/ShopProductList'));
const ShopProductDetail = lazy(() => import('@/pages/shop/ShopProductDetail'));
const CartPage = lazy(() => import('@/pages/shop/CartPage'));
const MarketplacePage = lazy(() => import('@/pages/shop/MarketplacePage'));
const CustomerRequestTrackingPage = lazy(() => import('@/pages/shop/CustomerRequestTrackingPage'));
const OfferLiveTracking = lazy(() => import('@/components/offers/OfferLiveTracking'));
const SubscriptionPage = lazy(() => import('@/pages/SubscriptionPage'));
const SupplierRegisterPage = lazy(() => import('@/pages/auth/SupplierRegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage'));

import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
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

                                {/* Public Online Store Routes */}
                                <Route path="/shop/:storeId" element={<ShopLayout />}>
                                    <Route index element={<ShopHomePage />} />
                                    <Route path="products" element={<ShopProductList />} />
                                    <Route path="product/:productId" element={<ShopProductDetail />} />
                                    <Route path="cart" element={<CartPage />} />
                                </Route>

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
                                <Route path="/orders" element={<Dashboard />} />
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
                                <Route path="/logistics" element={<Dashboard />} />
                                <Route path="/profile" element={<Dashboard />} />
                                <Route path="/settings" element={<Dashboard />} />
                                <Route path="/subscription" element={<SubscriptionPage />} />
                                <Route path="/user-guide" element={<Dashboard />} />

                                {/* Super Admin Routes */}
                                <Route path="/superadmin" element={<Dashboard />} />
                                <Route path="/superadmin/stores" element={<Dashboard />} />
                                <Route path="/superadmin/notifications" element={<Dashboard />} />
                                <Route path="/superadmin/subscriptions" element={<Dashboard />} />

                                <Route path="/marketing" element={<Dashboard />} />
                                <Route path="/marketing" element={<Dashboard />} />
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

            </ToastProvider >
        </ThemeProvider>
    );
};
