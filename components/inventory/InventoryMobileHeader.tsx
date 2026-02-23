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
}

const InventoryMobileHeader: React.FC<InventoryMobileHeaderProps> = ({
    activeTab,
    setActiveTab,
    selectedItem,
    viewMode,
    setViewMode
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
                <div className="flex items-center space-x-2">
                    {activeTab === 'products' && (
                        <div className="flex bg-slate-200/50 dark:bg-slate-800/80 p-1.5 rounded-[16px] gap-1 shadow-inner items-center">
                            <button
                                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                className="p-2 rounded-[12px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-300 active:scale-95"
                                aria-label={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
                            >
                                {viewMode === 'grid' ? <ListIcon className="w-4.5 h-4.5 flex-shrink-0" /> : <GridIcon className="w-4.5 h-4.5 flex-shrink-0" />}
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
