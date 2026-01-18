export type SnackbarType = 'success' | 'error' | 'info' | 'warning' | 'sync';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import ShopLayout from './pages/shop/ShopLayout';
import ShopHomePage from './pages/shop/ShopHomePage';
import ShopProductList from './pages/shop/ShopProductList';
import ShopProductDetail from './pages/shop/ShopProductDetail';
import CartPage from './pages/shop/CartPage';

import MarketplacePage from './pages/shop/MarketplacePage';
import CustomerRequestTrackingPage from './pages/shop/CustomerRequestTrackingPage';
import TitleBar from './components/TitleBar';

export default function App() {
    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <TitleBar />
            <div className="flex-1 overflow-auto">
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
                    <Route path="/forgot-password" element={<Dashboard />} />
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
                    <Route path="/profile" element={<Dashboard />} />
                    <Route path="/settings" element={<Dashboard />} />
                    <Route path="/settings" element={<Dashboard />} />

                    {/* Super Admin Routes */}
                    <Route path="/superadmin" element={<Dashboard />} />
                    <Route path="/superadmin/stores" element={<Dashboard />} />
                    <Route path="/superadmin/notifications" element={<Dashboard />} />
                    <Route path="/superadmin/subscriptions" element={<Dashboard />} />

                    <Route path="/marketing" element={<Dashboard />} />
                    <Route path="/marketing" element={<Dashboard />} />
                    <Route path="/directory" element={<MarketplacePage />} />
                    <Route path="/directory/request/:requestId" element={<Dashboard />} />
                    <Route path="/marketplace" element={<MarketplacePage />} />
                    <Route path="/marketplace/track/:requestId" element={<CustomerRequestTrackingPage />} />

                    {/* Customer Dashboard - Protected by Dashboard logic */}
                    <Route path="/customer/login" element={<Dashboard />} />
                    <Route path="/customer/register" element={<Dashboard />} />
                    <Route path="/customer/dashboard" element={<Dashboard />} />
                    <Route path="/customer/orders" element={<Dashboard />} />
                    <Route path="/directory/request/:requestId" element={<Dashboard />} />

                    {/* Fallback */}
                    <Route path="*" element={<Dashboard />} />
                </Routes>
            </div>
        </div>
    );
};


