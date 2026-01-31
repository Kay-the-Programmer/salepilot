import React from 'react';
import Header from '../../components/Header';
import { FiFilter } from 'react-icons/fi';
import ListGridToggle from '../ui/ListGridToggle';

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
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-white/10 hidden md:block">
            <Header
                title={activeTab === 'products' ? 'Products' : 'Categories'}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isSearchActive={isSearchActive}
                setIsSearchActive={setIsSearchActive}
                className="!static !border-none !shadow-none"
                buttonText={canManageProducts ? (activeTab === 'products' ? 'Add Product' : 'Add Category') : undefined}
                onButtonClick={canManageProducts ? (activeTab === 'products' ? onOpenAddProduct : onOpenAddCategory) : undefined}
                searchLeftContent={
                    <>
                        <div className="flex bg-gray-100/60 dark:bg-slate-800/80 p-1 rounded-xl shrink-0">
                            <button
                                onClick={() => {
                                    setActiveTab('products');
                                    setSearchTerm('');
                                }}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'products'
                                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                Products
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('categories');
                                    setSearchTerm('');
                                }}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'categories'
                                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                Categories
                            </button>
                        </div>

                        {activeTab === 'products' && (
                            <div className="flex bg-transparent gap-1 p-1 rounded-xl shrink-0 items-center">
                                <button
                                    onClick={() => setIsManualLookupOpen(true)}
                                    className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white dark:bg-slate-800 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium transition-colors text-sm"
                                    title="Manually enter barcode"
                                >
                                    <span role="img" aria-label="barcode">⌨️</span>
                                    Lookup Barcode
                                </button>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${showFilters || searchTerm || showArchived
                                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400'
                                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <FiFilter className="w-4 h-4" />
                                    Filters
                                </button>

                                <div className="ml-2">
                                    <ListGridToggle
                                        viewMode={viewMode}
                                        onViewModeChange={setViewMode}
                                        size="sm"
                                    />
                                </div>

                                <button
                                    onClick={() => setShowArchived(!showArchived)}
                                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${showArchived
                                        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400'
                                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {showArchived ? 'Showing Archived' : 'Show Archived'}
                                </button>
                            </div>
                        )}
                    </>
                }
            />
        </div>
    );
});

export default InventoryHeader;
