import React from 'react';
import { FiFilter } from 'react-icons/fi';
import { GridIcon, ListIcon } from '../icons';

interface InventoryHeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    activeTab: 'products' | 'categories';
    setActiveTab: (tab: 'products' | 'categories') => void;
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    showArchived: boolean;
    setShowArchived: (show: boolean) => void;
    setIsManualLookupOpen: (open: boolean) => void;
    canManageProducts: boolean;
    onOpenAddProduct: () => void;
    onOpenAddCategory: () => void;
}

const InventoryHeader: React.FC<InventoryHeaderProps> = React.memo(({
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    showFilters,
    setShowFilters,
    showArchived,
    setShowArchived,
    setIsManualLookupOpen,
    canManageProducts,
    onOpenAddProduct,
    onOpenAddCategory
}) => {
    return (
        <div className="hidden dark:bg-slate-950/90 bg-slate-50/90 backdrop-blur-2xl md:flex items-center justify-between px-8 py-4 sticky top-0 z-30 border-b border-transparent transition-all duration-300">
            <div className="flex justify-between items-center w-full max-w-[1400px] mx-auto">
                <div>
                    <h1 className="text-[34px] font-semibold text-slate-900 dark:text-white leading-tight tracking-tight">
                        {activeTab === 'products' ? 'Products' : 'Categories'}
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">
                        Inventory Management
                    </p>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">

                    {/* Search Bar */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-slate-400">🔍</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64 pl-9 pr-4 py-2 bg-white dark:bg-slate-800/80 border border-slate-200/50 dark:border-white/10 rounded-[16px] text-[14px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Segmented Control */}
                    <div className="flex bg-slate-200/50 dark:bg-slate-800/80 p-1.5 rounded-[16px] shadow-inner items-center">
                        <button
                            onClick={() => { setActiveTab('products'); setSearchTerm(''); }}
                            className={`px-4 py-2 rounded-[12px] text-[13px] font-bold tracking-wide transition-all duration-300 ${activeTab === 'products'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                                }`}
                        >
                            Products
                        </button>
                        <button
                            onClick={() => { setActiveTab('categories'); setSearchTerm(''); }}
                            className={`px-4 py-2 rounded-[12px] text-[13px] font-bold tracking-wide transition-all duration-300 ${activeTab === 'categories'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                                }`}
                        >
                            Categories
                        </button>
                    </div>

                    {/* Right side actions */}
                    {activeTab === 'products' && (
                        <div className="flex items-center gap-1.5 bg-slate-200/50 dark:bg-slate-800/80 p-1.5 rounded-[16px] shadow-inner">
                            {/* Barcode Lookup */}
                            <button
                                onClick={() => setIsManualLookupOpen(true)}
                                className="p-2 rounded-[12px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all duration-300 hover:bg-white dark:hover:bg-slate-700 active:scale-95"
                                title="Lookup Barcode"
                            >
                                ⌨️
                            </button>

                            <div className="h-4 w-px bg-slate-300/50 dark:bg-slate-700 mx-0.5" />

                            {/* Filters Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 rounded-[12px] transition-all duration-300 active:scale-95 ${showFilters
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                    : 'text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-700'
                                    }`}
                                title={showFilters ? "Hide Filters" : "Show Filters"}
                            >
                                <FiFilter className="w-4.5 h-4.5" />
                            </button>

                            {/* Archived Toggle */}
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className={`p-2 rounded-[12px] transition-all duration-300 active:scale-95 ${showArchived
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                    : 'text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-700'
                                    }`}
                                title={showArchived ? "Hide Archived" : "Show Archived"}
                            >
                                <span className="w-5 h-5 flex items-center justify-center text-[15px] leading-none">📦</span>
                            </button>

                            <div className="h-4 w-px bg-slate-300/50 dark:bg-slate-700 mx-0.5" />

                            {/* View Mode Toggle */}
                            <button
                                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                className="p-2 rounded-[12px] text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-700 transition-all duration-300 active:scale-95"
                            >
                                {viewMode === 'grid' ? <ListIcon className="w-4.5 h-4.5" /> : <GridIcon className="w-4.5 h-4.5" />}
                            </button>
                        </div>
                    )}

                    {/* Add Button */}
                    {canManageProducts && (
                        <button
                            onClick={activeTab === 'products' ? onOpenAddProduct : onOpenAddCategory}
                            className="flex items-center gap-2 px-5 py-2 hover:bg-white dark:hover:bg-slate-800 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-white/10 text-slate-900 dark:text-white rounded-full text-[14px] font-bold tracking-wide shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                            <span className="text-lg leading-none">+</span>
                            {activeTab === 'products' ? 'Add Product' : 'Add Category'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

export default InventoryHeader;
