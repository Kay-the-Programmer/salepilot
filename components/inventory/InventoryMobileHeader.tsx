import React, { useState, useRef, useEffect } from 'react';
import { FiCamera } from 'react-icons/fi';
import CubeIcon from '../../components/icons/CubeIcon';
import TagIcon from '../../components/icons/TagIcon';
import PlusIcon from '../../components/icons/PlusIcon';
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
            <div className="px-4 py-2 flex items-center justify-between gap-3">
                {/* Segmented Control */}
                <div className="flex bg-slate-100/60 dark:bg-slate-800/80 p-1 rounded-full flex-1 max-w-[200px]">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 flex items-center justify-center p-2 rounded-full text-sm font-bold tracking-wide transition-all duration-200 active:scale-95 ${activeTab === 'products'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-500 dark:text-slate-400'
                            }`}
                    >
                        <CubeIcon className="w-4 h-4 mr-1.5" />
                        Prod
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex-1 flex items-center justify-center p-2 rounded-full text-sm font-bold tracking-wide transition-all duration-200 active:scale-95 ${activeTab === 'categories'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-500 dark:text-slate-400'
                            }`}
                    >
                        <TagIcon className="w-4 h-4 mr-1.5" />
                        Cat
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={onScanClick}
                        className="p-2.5 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all duration-200 active:scale-95 transition-all duration-300"
                        aria-label="Scan Barcode"
                    >
                        <FiCamera className="w-6 h-6" />
                    </button>

                    <button
                        onClick={onAddClick}
                        className="p-2.5 rounded-full text-white bg-blue-600 hover:bg-blue-700 active:scale-90 shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-95 transition-all duration-300"
                        aria-label="Add New"
                    >
                        <PlusIcon className="w-6 h-6" />
                    </button>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-2.5 rounded-full transition-all duration-200 active:scale-90 ${isMenuOpen
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <EllipsisVerticalIcon className="w-6 h-6" />
                        </button>

                        {isMenuOpen && (
                            <div className="liquid-glass-card rounded-[2rem] absolute right-0 top-full mt-2 w-56 dark:bg-slate-800 border border-gray-100 dark:border-white/10 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => {
                                        setViewMode(viewMode === 'grid' ? 'list' : 'grid');
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors active:scale-95 transition-all duration-300"
                                >
                                    <span>{viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}</span>
                                </button>

                                <div className="my-1 border-t border-gray-100 dark:border-white/5"></div>

                                <button
                                    onClick={() => {
                                        setShowArchived(!showArchived);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors active:scale-95 transition-all duration-300"
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
