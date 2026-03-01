import React from 'react';
import CubeIcon from '../../components/icons/CubeIcon';
import TagIcon from '../../components/icons/TagIcon';

interface InventoryMobileHeaderProps {
    activeTab: 'products' | 'categories';
    setActiveTab: (tab: 'products' | 'categories') => void;
    selectedItem: boolean;
    canManageProducts?: boolean;
    onOpenScanModal?: () => void;
    onOpenAddProduct?: () => void;
    onOpenAddCategory?: () => void;
}

const InventoryMobileHeader: React.FC<InventoryMobileHeaderProps> = ({
    activeTab,
    setActiveTab,
    selectedItem,
    canManageProducts,
    onOpenScanModal,
    onOpenAddProduct,
    onOpenAddCategory
}) => {
    return (
        <div className={`sticky top-[64px] z-30 dark:bg-slate-950/90 bg-slate-50/90 backdrop-blur-2xl px-4 py-3 md:hidden border-b border-slate-200/40 dark:border-white/5 transition-all duration-300 ${selectedItem ? 'hidden' : ''}`}>
            <div className="flex items-center justify-between gap-4">
                {/* Segmented Control */}
                <div className="flex-1 flex bg-slate-200/50 dark:bg-slate-800/80 p-1 rounded-full shadow-inner items-center">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 flex items-center justify-center py-2 px-3 rounded-full text-[13px] font-bold tracking-wide transition-all duration-300 active:scale-95 ${activeTab === 'products'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <CubeIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                        <span className="truncate">Products</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex-1 flex items-center justify-center py-2 px-3 rounded-full text-[13px] font-bold tracking-wide transition-all duration-300 active:scale-95 ${activeTab === 'categories'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <TagIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                        <span className="truncate">Categories</span>
                    </button>
                </div>

                {/* Right side icons */}
                <div className="flex items-center space-x-2 shrink-0">
                    {canManageProducts && activeTab === 'products' && (
                        <button
                            onClick={onOpenScanModal}
                            className="p-2.5 bg-slate-200/50 dark:bg-slate-800/80 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-300 active:scale-95 shadow-inner"
                            aria-label="Scan Barcode"
                        >
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    )}

                    {canManageProducts && (
                        <button
                            onClick={activeTab === 'products' ? onOpenAddProduct : onOpenAddCategory}
                            className="p-2.5 bg-slate-900 dark:bg-white rounded-full text-white dark:text-slate-900 hover:opacity-90 transition-all duration-300 active:scale-95 shadow-md flex items-center justify-center"
                            aria-label={activeTab === 'products' ? 'Add Product' : 'Add Category'}
                        >
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>



        </div>
    );
};

export default InventoryMobileHeader;
