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
        <div className={`sticky top-2 z-30 bg-transparent pointer-events-none md:hidden ${selectedItem ? 'hidden' : ''}`}>
            <div className="px-4 py-2 flex items-center justify-between gap-3 relative pointer-events-auto">
                {/* Segmented Control */}
                <div className="flex bg-slate-200/50 dark:bg-slate-800/80 backdrop-blur-xl p-1.5 rounded-[16px] shadow-inner flex-1 relative z-10 items-center">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 flex items-center justify-center py-2 px-3 rounded-[12px] text-[13px] font-bold tracking-wide transition-all duration-300 active:scale-95 ${activeTab === 'products'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <CubeIcon className="w-4.5 h-4.5 mr-1.5 flex-shrink-0" />
                        <span className="truncate">Products</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex-1 flex items-center justify-center py-2 px-3 rounded-[12px] text-[13px] font-bold tracking-wide transition-all duration-300 active:scale-95 ${activeTab === 'categories'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <TagIcon className="w-4.5 h-4.5 mr-1.5 flex-shrink-0" />
                        <span className="truncate">Categories</span>
                    </button>
                </div>

                <div className="flex-shrink-0 z-20">
                    {/* Direct List/Grid Toggle */}
                    <button
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        className="p-2.5 rounded-[16px] bg-slate-200/50 dark:bg-slate-800/80 shadow-inner text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-all duration-300 active:scale-95 flex items-center justify-center h-[44px] w-[44px] ml-1"
                        aria-label={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
                    >
                        {viewMode === 'grid' ? (
                            <ListIcon className="w-5 h-5 flex-shrink-0" />
                        ) : (
                            <GridIcon className="w-5 h-5 flex-shrink-0" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InventoryMobileHeader;
