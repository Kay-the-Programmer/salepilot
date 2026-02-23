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
        <div className={`sticky top-0 z-30 liquid-glass-header md:hidden ${selectedItem ? 'hidden' : ''}`}>
            <div className="px-4 py-3 flex items-center justify-center relative">
                {/* Segmented Control */}
                <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl flex-1 max-w-[280px] sm:max-w-[320px] shadow-inner relative z-10 w-full">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-sm font-bold tracking-wide transition-all duration-300 ${activeTab === 'products'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <CubeIcon className="w-4 h-4 mr-1 sm:mr-2" />
                        Products
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-sm font-bold tracking-wide transition-all duration-300 ${activeTab === 'categories'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <TagIcon className="w-4 h-4 mr-1 sm:mr-2" />
                        Categories
                    </button>
                </div>

                <div className="absolute right-3 z-20">
                    {/* Direct List/Grid Toggle */}
                    <button
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-all duration-200 active:scale-90"
                        aria-label={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
                    >
                        {viewMode === 'grid' ? (
                            <ListIcon className="w-5 h-5" />
                        ) : (
                            <GridIcon className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InventoryMobileHeader;
