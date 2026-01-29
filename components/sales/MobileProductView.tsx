import React from 'react';
import { Product, StoreSettings } from '../../types';
import {
    GridIcon,
    MagnifyingGlassIcon,
    QuestionMarkCircleIcon,
    BellAlertIcon
} from '../icons';
import logo from '../../assets/logo.png';
import { ProductCard } from './ProductCard'; // Assuming ProductCard is in the same directory

interface MobileProductViewProps {
    isOpen: boolean;
    products: Product[];
    storeSettings: StoreSettings;
    addToCart: (product: Product) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onOpenSidebar?: () => void;
    onTourStart: () => void;
}

export const MobileProductView: React.FC<MobileProductViewProps> = ({
    isOpen,
    products,
    storeSettings,
    addToCart,
    searchTerm,
    setSearchTerm,
    onOpenSidebar,
    onTourStart
}) => {
    return (
        <div className={`md:hidden fixed inset-0 z-50 transition-transform duration-300 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {/* Mobile Products Header */}
            <div className="sticky top-0 z-10">
                {/* Top Bar (Menu, Logo, Notification) */}
                <div className="bg-transparent/1 backdrop-blur-sm border-b border-slate-200/50 p-4 pb-2">
                    <div className="flex items-center justify-between">
                        <div id="pos-mobile-header" className="flex items-center gap-2">
                            {onOpenSidebar && (
                                <button
                                    onClick={onOpenSidebar}
                                    className="p-2 -ml-2 rounded-md text-slate-700 hover:bg-slate-50 focus:outline-none"
                                >
                                    <GridIcon className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                        <div className="absolute left-1/2 transform -translate-x-1/2">
                            <img src={logo} alt="SalePilot" className="h-8" />
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                id="pos-mobile-help-btn"
                                onClick={onTourStart}
                                className="p-2 rounded-full hover:bg-slate-100"
                                title="Help Guide"
                            >
                                <QuestionMarkCircleIcon className="w-6 h-6 text-slate-700" />
                            </button>
                            <button className="p-2 rounded-full hover:bg-slate-100 relative">
                                <BellAlertIcon className="w-6 h-6 text-slate-700" />
                                {/* Optional: Add notification badge here if needed */}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Bar (Sticky) */}
                <div id="pos-mobile-search-container" className="bg-transparent/1 backdrop-blur-sm border-b border-slate-200 px-4 pb-4 pt-2">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            id="pos-mobile-search"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-3xl bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>
            </div>
            {/* Mobile Products Grid */}
            <div id="pos-mobile-product-list" className="p-4 pb-24">
                <div className="grid grid-cols-2 gap-3">
                    {products.slice(0, 20).map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            storeSettings={storeSettings}
                            addToCart={addToCart}
                            variant="mobile"
                            onLowStockAlert={() => { }} // Not used in mobile view currently
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
