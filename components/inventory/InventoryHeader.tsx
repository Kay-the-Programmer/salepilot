import React from 'react';
import { FiFilter } from 'react-icons/fi';
import { GridIcon, ListIcon } from '../icons';

interface InventoryHeaderProps {
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
        <div className="flex items-center gap-3 shrink-0">
            {/* Segmented Control - Products / Categories */}
            <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-full shadow-inner items-center gap-0.5">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-4 py-2 rounded-full text-[13px] font-bold tracking-wide transition-all duration-200 ${activeTab === 'products'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                        }`}
                >
                    Products
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-2 rounded-full text-[13px] font-bold tracking-wide transition-all duration-200 ${activeTab === 'categories'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                        }`}
                >
                    Categories
                </button>
            </div>

            {/* Right side icon actions */}
            {activeTab === 'products' && (
                <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-full shadow-inner">
                    {/* Barcode Lookup */}
                    <button
                        onClick={() => setIsManualLookupOpen(true)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all duration-200 hover:bg-white dark:hover:bg-slate-700 active:scale-90"
                        title="Lookup Barcode"
                    >
                        <span className="text-[15px]">⌨️</span>
                    </button>

                    <div className="h-4 w-px bg-slate-300/50 dark:bg-slate-700 mx-0.5" />

                    {/* Filters Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${showFilters
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-700'
                            }`}
                        title={showFilters ? "Hide Filters" : "Show Filters"}
                    >
                        <FiFilter className="w-4 h-4" />
                    </button>

                    {/* Archived Toggle */}
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${showArchived
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-700'
                            }`}
                        title={showArchived ? "Hide Archived" : "Show Archived"}
                    >
                        <span className="text-[15px] leading-none">📦</span>
                    </button>

                    <div className="h-4 w-px bg-slate-300/50 dark:bg-slate-700 mx-0.5" />

                    {/* View Mode Toggle */}
                    <button
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-700 transition-all duration-200 active:scale-90"
                        title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
                    >
                        {viewMode === 'grid' ? <ListIcon className="w-4 h-4" /> : <GridIcon className="w-4 h-4" />}
                    </button>
                </div>
            )}

            {/* Add Button */}
            {canManageProducts && (
                <button
                    onClick={activeTab === 'products' ? onOpenAddProduct : onOpenAddCategory}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-[13px] font-extrabold tracking-wide shadow-sm hover:shadow-md transition-all active:scale-95 duration-200"
                >
                    <span className="text-base leading-none">+</span>
                    {activeTab === 'products' ? 'Add Product' : 'Add Category'}
                </button>
            )}
        </div>
    );
});

export default InventoryHeader;
