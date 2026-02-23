import React from 'react';
import Header from '../../components/Header';
import { FiFilter } from 'react-icons/fi';
import { GridIcon, ListIcon } from '../icons';

interface InventoryHeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    isSearchActive: boolean;
    setIsSearchActive: (active: boolean) => void;
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
    isSearchActive,
    setIsSearchActive,
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
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/5 hidden md:block">
            <Header
                title={activeTab === 'products' ? 'Products' : 'Categories'}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isSearchActive={isSearchActive}
                setIsSearchActive={setIsSearchActive}
                className="!static !border-none !shadow-none !bg-transparent"
                buttonText={canManageProducts ? (activeTab === 'products' ? 'Add Product' : 'Add Category') : undefined}
                onButtonClick={canManageProducts ? (activeTab === 'products' ? onOpenAddProduct : onOpenAddCategory) : undefined}
                searchLeftContent={
                    <div className="flex bg-slate-200/50 dark:bg-slate-800/80 p-1.5 rounded-[16px] shadow-inner shrink-0 items-center">
                        <button
                            onClick={() => {
                                setActiveTab('products');
                                setSearchTerm('');
                            }}
                            className={`px-5 py-2 rounded-[12px] text-[14px] font-bold tracking-wide transition-all duration-300 active:scale-95 ${activeTab === 'products'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Products
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('categories');
                                setSearchTerm('');
                            }}
                            className={`px-5 py-2 rounded-[12px] text-[14px] font-bold tracking-wide transition-all duration-300 active:scale-95 ${activeTab === 'categories'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Categories
                        </button>
                    </div>
                }
                rightContent={
                    activeTab === 'products' ? (
                        <div className="flex items-center gap-1.5 bg-slate-200/50 dark:bg-slate-800/80 p-1.5 rounded-[16px] shadow-inner">
                            {/* Barcode Lookup - Primary Action */}
                            <button
                                onClick={() => setIsManualLookupOpen(true)}
                                className="hidden lg:flex items-center justify-center p-2 rounded-[12px] text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-700 transition-all duration-300 active:scale-95 hover:shadow-sm"
                                title="Lookup Barcode"
                                aria-label="Lookup Barcode"
                            >
                                <span className="text-xl leading-none">⌨️</span>
                            </button>

                            <div className="h-5 w-px bg-slate-300/50 dark:bg-slate-700 mx-1 hidden lg:block"></div>

                            {/* Filters Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center justify-center p-2.5 rounded-[12px] transition-all duration-300 active:scale-95 hover:shadow-sm ${showFilters
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                                    : 'text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-700'
                                    }`}
                                title={showFilters ? "Hide Filters" : "Show Filters"}
                                aria-label={showFilters ? "Hide Filters" : "Show Filters"}
                            >
                                <FiFilter className={`w-4 h-4 ${showFilters ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                            </button>

                            {/* Archived Toggle */}
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className={`flex items-center justify-center p-2 rounded-[12px] transition-all duration-300 active:scale-95 hover:shadow-sm ${showArchived
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                                    : 'text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-700'
                                    }`}
                                title={showArchived ? "Hide Archived" : "Show Archived"}
                                aria-label={showArchived ? "Hide Archived" : "Show Archived"}
                            >
                                <span className="w-5 h-5 flex items-center justify-center text-[15px] leading-none">📦</span>
                            </button>

                            <div className="h-5 w-px bg-slate-300/50 dark:bg-slate-700 mx-1"></div>

                            {/* Direct List/Grid Toggle */}
                            <button
                                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                className="flex items-center justify-center p-2.5 rounded-[12px] text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-700 transition-all duration-300 active:scale-95 hover:shadow-sm"
                                aria-label={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
                                title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
                            >
                                {viewMode === 'grid' ? (
                                    <ListIcon className="w-5 h-5 flex-shrink-0" />
                                ) : (
                                    <GridIcon className="w-5 h-5 flex-shrink-0" />
                                )}
                            </button>
                        </div>
                    ) : null
                }
            />
        </div>
    );
});

export default InventoryHeader;
