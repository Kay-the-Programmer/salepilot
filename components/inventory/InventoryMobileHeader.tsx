import React, { useState, useRef, useEffect } from 'react';
import CubeIcon from '../../components/icons/CubeIcon';
import TagIcon from '../../components/icons/TagIcon';
import EllipsisVerticalIcon from '../../components/icons/EllipsisVerticalIcon';
import CheckIcon from '../icons/CheckIcon';

interface InventoryMobileHeaderProps {
    activeTab: 'products' | 'categories';
    setActiveTab: (tab: 'products' | 'categories') => void;
    selectedItem: boolean;
    onScanClick: () => void;
    onAddClick: () => void;
    showArchived: boolean;
    setShowArchived: (show: boolean) => void;
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
}

const InventoryMobileHeader: React.FC<InventoryMobileHeaderProps> = ({
    activeTab,
    setActiveTab,
    selectedItem,
    onScanClick,
    onAddClick,
    showArchived,
    setShowArchived,
    viewMode,
    setViewMode
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-2 rounded-full transition-all duration-200 active:scale-90 ${isMenuOpen
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            aria-label="More options"
                        >
                            <EllipsisVerticalIcon className="w-6 h-6" />
                        </button>

                        {isMenuOpen && (
                            <div className="liquid-glass-card rounded-[1.5rem] absolute right-0 top-full mt-2 w-56 dark:bg-slate-800 border border-gray-100 dark:border-white/10 p-2 z-50 animate-in fade-in zoom-in-95 duration-200 shadow-xl">
                                <button
                                    onClick={() => {
                                        setViewMode(viewMode === 'grid' ? 'list' : 'grid');
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors active:scale-95 transition-all duration-300"
                                >
                                    <span>{viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}</span>
                                </button>

                                <div className="my-1 border-t border-gray-100 dark:border-white/5 mx-2"></div>

                                <button
                                    onClick={() => {
                                        setShowArchived(!showArchived);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors active:scale-95 transition-all duration-300"
                                >
                                    <span>Show Archived</span>
                                    {showArchived && <CheckIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryMobileHeader;
