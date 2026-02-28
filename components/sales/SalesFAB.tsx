import React from 'react';
import {
    QrCodeIcon,
    ShoppingCartIcon,
    ClockIcon,
    GridIcon,
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
    const tabs = [
        {
            id: 'products' as const,
            label: 'Products',
            icon: <GridIcon className="w-5 h-5" />,
            onClick: () => setActiveTab('products'),
            active: activeTab === 'products',
        },
        {
            id: 'scanner' as const,
            label: 'Scan',
            icon: <QrCodeIcon className="w-5 h-5" />,
            onClick: () => { setIsScannerOpen(true); setActiveTab('cart'); },
            active: false,
            accent: true,
        },
        {
            id: 'cart' as const,
            label: 'Cart',
            icon: <ShoppingCartIcon className="w-5 h-5" />,
            onClick: () => setActiveTab('cart'),
            active: activeTab === 'cart',
            badge: cartCount > 0 ? cartCount : undefined,
        },
        {
            id: 'held' as const,
            label: 'Held',
            icon: <ClockIcon className="w-5 h-5" />,
            onClick: () => setShowHeldPanel(true),
            active: false,
            badge: heldSalesCount > 0 ? heldSalesCount : undefined,
        },
    ];

    return (
        <div
            className={`
                md:hidden fixed bottom-0 left-0 right-0 z-50
                transition-transform duration-300 ease-in-out
                ${isFabVisible ? 'translate-y-0' : 'translate-y-full'}
            `}
        >
            {/* Frosted glass bottom bar */}
            <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/60 dark:border-white/10 safe-area-bottom">
                <div className="flex items-stretch">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            id={`pos-mobile-${tab.id}-fab`}
                            onClick={tab.onClick}
                            className={`
                                flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1 relative
                                transition-all duration-150 active:scale-90
                                ${tab.accent
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : tab.active
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-500 dark:text-slate-400'}
                            `}
                            aria-label={tab.label}
                        >
                            {/* Active indicator bar */}
                            {tab.active && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                            )}

                            {/* Scanner gets a special accent pill */}
                            {tab.accent ? (
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
                                    {tab.icon}
                                </div>
                            ) : (
                                <div className="relative">
                                    {tab.icon}
                                    {tab.badge !== undefined && (
                                        <span className="absolute -top-2 -right-2.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                                            {tab.badge > 99 ? '99+' : tab.badge}
                                        </span>
                                    )}
                                </div>
                            )}
                            <span className={`text-[10px] font-semibold leading-none ${tab.accent ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>
                {/* iOS-style safe area spacer */}
                <div className="h-safe-area-inset-bottom bg-transparent" />
            </div>
        </div>
    );
};
