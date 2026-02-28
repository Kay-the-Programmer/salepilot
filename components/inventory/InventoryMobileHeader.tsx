import React from 'react';
import CubeIcon from '../../components/icons/CubeIcon';
import TagIcon from '../../components/icons/TagIcon';
import { GridIcon, ListIcon } from '../icons';

interface InventoryMobileHeaderProps {
    activeTab: 'products' | 'categories';
    setActiveTab: (tab: 'products' | 'categories') => void;
    selectedItem: boolean;
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
    canManageProducts?: boolean;
    onOpenScanModal?: () => void;
    onOpenAddProduct?: () => void;
    onOpenAddCategory?: () => void;
}

const InventoryMobileHeader: React.FC<InventoryMobileHeaderProps> = ({
    activeTab,
    setActiveTab,
    selectedItem,
    viewMode,
    setViewMode,
    canManageProducts,
    onOpenScanModal,
    onOpenAddProduct,
    onOpenAddCategory
}) => {
    return (
        <div className={`sticky top-0 z-30 dark:bg-slate-950/90 bg-slate-50/90 backdrop-blur-2xl px-4 py-4 md:hidden border-b border-transparent transition-all duration-300 ${selectedItem ? 'hidden' : ''}`}>

            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide uppercase mb-1">
                        Inventory Management
                    </p>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                        {activeTab === 'products' ? 'Products' : 'Categories'}
                    </h1>
                </div>
                {/* Right side icons */}
                {/* Right side icons */}
                <div className="flex items-center space-x-2">
                    {canManageProducts && activeTab === 'products' && (
                        <button
                            onClick={onOpenScanModal}
                            className="p-[9px] bg-slate-200/50 dark:bg-slate-800/80 rounded-[12px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-300 active:scale-95 shadow-inner"
                            aria-label="Scan Barcode"
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    )}

                    {canManageProducts && (
                        <button
                            onClick={activeTab === 'products' ? onOpenAddProduct : onOpenAddCategory}
                            className="p-[9px] bg-blue-600 rounded-[12px] text-white hover:bg-blue-700 transition-all duration-300 active:scale-95 shadow-md flex items-center justify-center"
                            aria-label={activeTab === 'products' ? 'Add Product' : 'Add Category'}
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    )}

                    {activeTab === 'products' && (
                        <div className="flex bg-slate-200/50 dark:bg-slate-800/80 p-1 rounded-[14px] gap-1 shadow-inner items-center">
                            <button
                                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                className="p-1.5 rounded-[10px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-300 active:scale-95"
                                aria-label={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
                            >
                                {viewMode === 'grid' ? <ListIcon className="w-4 h-4 flex-shrink-0" /> : <GridIcon className="w-4 h-4 flex-shrink-0" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Segmented Control */}
            <div className="flex bg-slate-200/50 dark:bg-slate-800/80 p-1.5 rounded-[16px] shadow-inner items-center w-full">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`flex-1 flex items-center justify-center py-2 px-3 rounded-[12px] text-[13px] font-bold tracking-wide transition-all duration-300 active:scale-95 ${activeTab === 'products'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    <CubeIcon className="w-4.5 h-4.5 mr-1.5 flex-shrink-0" />
                    <span className="truncate">Products</span>
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex-1 flex items-center justify-center py-2 px-3 rounded-[12px] text-[13px] font-bold tracking-wide transition-all duration-300 active:scale-95 ${activeTab === 'categories'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    <TagIcon className="w-4.5 h-4.5 mr-1.5 flex-shrink-0" />
                    <span className="truncate">Categories</span>
                </button>
            </div>

        </div>
    );
};

export default InventoryMobileHeader;
