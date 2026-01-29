import React from 'react';
import {
    QrCodeIcon,
    ShoppingCartIcon,
    ClockIcon
} from '../icons';

interface SalesFABProps {
    isFabVisible: boolean;
    setIsScannerOpen: (isOpen: boolean) => void;
    activeTab: 'products' | 'cart';
    setActiveTab: (tab: 'products' | 'cart') => void;
    cartCount: number;
    setShowHeldPanel: (show: boolean) => void;
    heldSalesCount: number;
}

export const SalesFAB: React.FC<SalesFABProps> = ({
    isFabVisible,
    setIsScannerOpen,
    activeTab,
    setActiveTab,
    cartCount,
    setShowHeldPanel,
    heldSalesCount
}) => {
    return (
        <div className={`md:hidden fixed z-50 bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-3 bg-white/20 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl transition-all duration-300 ${isFabVisible ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
            <button
                id="pos-mobile-scanner-fab"
                onClick={() => {
                    setIsScannerOpen(true);
                    setActiveTab('cart');
                }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-95 transition-all"
            >
                <QrCodeIcon className="w-6 h-6" />
            </button>
            <button
                id="pos-mobile-cart-fab"
                onClick={() => setActiveTab(activeTab === 'products' ? 'cart' : 'products')}
                className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg flex items-center justify-center active:scale-95 transition-all"
            >
                <ShoppingCartIcon className="w-6 h-6" />
                {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                        {cartCount}
                    </span>
                )}
            </button>

            <button
                id="pos-mobile-held-fab"
                onClick={() => setShowHeldPanel(true)}
                className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center active:scale-95 transition-all"
            >
                <ClockIcon className="w-6 h-6" />
                {heldSalesCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                        {heldSalesCount}
                    </span>
                )}
            </button>
        </div>
    );
};
