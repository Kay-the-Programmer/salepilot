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
        <div className={`sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 md:hidden ${selectedItem ? 'hidden' : ''}`}>
            <div className="px-4 py-2 flex items-center justify-between gap-3">
                {/* Segmented Control */}
                <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl flex-1 max-w-[200px]">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 flex items-center justify-center p-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'products'
                            ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <CubeIcon className="w-4 h-4 mr-1.5" />
                        Prod
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`flex-1 flex items-center justify-center p-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'categories'
                            ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <TagIcon className="w-4 h-4 mr-1.5" />
                        Cat
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={onScanClick}
                        className="p-2 rounded-xl text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 transition-colors"
                        aria-label="Scan Barcode"
                    >
                        <FiCamera className="w-6 h-6" />
                    </button>

                    <button
                        onClick={onAddClick}
                        className="p-2 rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 active:bg-blue-200 transition-colors"
                        aria-label="Add New"
                    >
                        <PlusIcon className="w-6 h-6" />
                    </button>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-2 rounded-xl transition-colors ${isMenuOpen
                                ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white'
                                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                        >
                            <EllipsisVerticalIcon className="w-6 h-6" />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => {
                                        setViewMode(viewMode === 'grid' ? 'list' : 'grid');
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <span>{viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}</span>
                                </button>

                                <div className="my-1 border-t border-gray-100 dark:border-white/5"></div>

                                <button
                                    onClick={() => {
                                        setShowArchived(!showArchived);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
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
