import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import ShopLayout from './pages/shop/ShopLayout';
import ShopHomePage from './pages/shop/ShopHomePage';
import ShopProductList from './pages/shop/ShopProductList';
import ShopProductDetail from './pages/shop/ShopProductDetail';
import CartPage from './pages/shop/CartPage';
import MarketplacePage from './pages/shop/MarketplacePage';
import MarketingPage from './pages/MarketingPage';

const App: React.FC = () => {
    return (
        <Routes>
            {/* Public Online Store Routes */}
            <Route path="/directory" element={<MarketplacePage />} />
            <Route path="/marketing" element={<MarketingPage />} />
            <Route path="/shop/:storeId" element={<ShopLayout />}>
                <Route index element={<ShopHomePage />} />
                <Route path="products" element={<ShopProductList />} />
                <Route path="product/:productId" element={<ShopProductDetail />} />
                <Route path="cart" element={<CartPage />} />
            </Route>

            {/* Admin Dashboard Routes - Fallback for all other routes */}
            <Route path="/*" element={<Dashboard />} />
        </Routes>
    );
};

export default App;
