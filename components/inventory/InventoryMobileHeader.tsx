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
                <div className="flex bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg p-1.5 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-white/20 dark:border-slate-700/50 flex-1 relative z-10">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 flex items-center justify-center py-2 px-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ${activeTab === 'products'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <CubeIcon className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="truncate">Products</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex-1 flex items-center justify-center py-2 px-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ${activeTab === 'categories'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <TagIcon className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="truncate">Categories</span>
                    </button>
                </div>

                <div className="flex-shrink-0 z-20">
                    {/* Direct List/Grid Toggle */}
                    <button
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        className="p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-white/20 dark:border-slate-700/50 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-all duration-200 active:scale-95 flex items-center justify-center h-[44px] w-[44px]"
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
