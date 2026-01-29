import React from 'react';
import Header from '../../components/Header';
import { FiFilter, FiGrid, FiList } from 'react-icons/fi';

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

const InventoryHeader: React.FC<InventoryHeaderProps> = ({
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
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 hidden md:block">
            <Header
                title="Inventory"
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isSearchActive={isSearchActive}
                setIsSearchActive={setIsSearchActive}
                className="!static !border-none !shadow-none"
                buttonText={canManageProducts ? (activeTab === 'products' ? 'Add Product' : 'Add Category') : undefined}
                onButtonClick={canManageProducts ? (activeTab === 'products' ? onOpenAddProduct : onOpenAddCategory) : undefined}
                searchLeftContent={
                    <div className="flex items-center gap-3 mr-4 bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-100/50">
                        <div className="flex bg-gray-100/60 p-1 rounded-xl shrink-0">
                            <button
                                onClick={() => {
                                    setActiveTab('products');
                                    setSearchTerm('');
                                }}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'products'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
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
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Categories
                            </button>
                        </div>

                        {activeTab === 'products' && (
                            <>
                                <button
                                    onClick={() => setIsManualLookupOpen(true)}
                                    className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors text-sm"
                                    title="Manually enter barcode"
                                >
                                    <span role="img" aria-label="barcode">⌨️</span>
                                    Lookup Barcode
                                </button>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${showFilters || searchTerm || showArchived
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <FiFilter className="w-4 h-4" />
                                    Filters
                                </button>

                                <div className="flex bg-gray-100/80 p-1 rounded-xl">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        title="Grid View"
                                    >
                                        <FiGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        title="List View"
                                    >
                                        <FiList className="w-4 h-4" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowArchived(!showArchived)}
                                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${showArchived
                                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {showArchived ? 'Showing Archived' : 'Show Archived'}
                                </button>
                            </>
                        )}
                    </div>
                }
            />
        </div>
    );
};

export default InventoryHeader;
