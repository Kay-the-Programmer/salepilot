import React from 'react';
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
    onExportLowStock?: () => void;
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
    onOpenAddCategory,
    onExportLowStock
}) => {
    return (
        <div className="flex items-center gap-3 shrink-0">
            {/* Right side icon actions */}
            <div className="flex items-center gap-1 bg-surface-variant p-1 rounded-full shadow-inner">
                {activeTab === 'products' && (
                    <>
                        {/* Barcode Lookup */}
                        <button
                            onClick={() => setIsManualLookupOpen(true)}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-brand-text-muted hover:text-brand-text transition-all duration-200 hover:bg-surface active:scale-90"
                            title="Lookup Barcode"
                        >
                            <span className="text-[15px]"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
                            </svg>
                            </span>
                        </button>

                        <div className="h-4 w-px bg-brand-border mx-0.5" />

                        {/* Archived Toggle */}
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${showArchived
                                ? 'bg-surface text-primary shadow-sm'
                                : 'text-brand-text-muted hover:bg-surface'
                                }`}
                            title={showArchived ? "Hide Archived" : "Show Archived"}
                        >
                            <span className="text-[15px] leading-none">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                                </svg>
                            </span>
                        </button>

                        <div className="h-4 w-px bg-brand-border mx-0.5" />

                        {/* View Mode Toggle */}
                        <button
                            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-brand-text-muted hover:bg-surface transition-all duration-200 active:scale-90"
                            title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
                        >
                            {viewMode === 'grid' ? <ListIcon className="w-4 h-4" /> : <GridIcon className="w-4 h-4" />}
                        </button>

                        <div className="h-4 w-px bg-brand-border mx-0.5" />

                        {/* Actions */}
                        {onExportLowStock && (
                            <>
                                <button
                                    onClick={onExportLowStock}
                                    className="flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 active:scale-95"
                                    title="Export Low Stock PDF"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </button>
                                <div className="h-4 w-px bg-brand-border mx-0.5" />
                            </>
                        )}
                    </>
                )}

                {canManageProducts && (
                    <button
                        onClick={activeTab === 'products' ? onOpenAddProduct : onOpenAddCategory}
                        className="flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 active:scale-95"
                        title={activeTab === 'products' ? 'Add Product' : 'Add Category'}
                    >
                        <span className="text-base leading-none">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
});

export default InventoryHeader;
