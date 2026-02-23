import React from 'react';
import Header from '../../components/Header';
import { FiFilter } from 'react-icons/fi';
import ListGridToggle from '../ui/ListGridToggle';
import CheckIcon from '../icons/CheckIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import AdjustmentsHorizontalIcon from '../icons/AdjustmentsHorizontalIcon';

interface InventoryHeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    isSearchActive: boolean;
    setIsSearchActive: (active: boolean) => void;
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
}

const InventoryHeader: React.FC<InventoryHeaderProps> = React.memo(({
    searchTerm,
    setSearchTerm,
    isSearchActive,
    setIsSearchActive,
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
    onOpenAddCategory
}) => {
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const settingsRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="sticky top-0 z-30 liquid-glass-header hidden md:block">
            <Header
                title={activeTab === 'products' ? 'Products' : 'Categories'}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isSearchActive={isSearchActive}
                setIsSearchActive={setIsSearchActive}
                className="!static !border-none !shadow-none !bg-transparent"
                buttonText={canManageProducts ? (activeTab === 'products' ? 'Add Product' : 'Add Category') : undefined}
                onButtonClick={canManageProducts ? (activeTab === 'products' ? onOpenAddProduct : onOpenAddCategory) : undefined}
                searchLeftContent={
                    <div className="flex bg-gray-100/60 dark:bg-slate-800/80 p-1 rounded-xl shrink-0">
                        <button
                            onClick={() => {
                                setActiveTab('products');
                                setSearchTerm('');
                            }}
                            className={`px-5 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-200 active:scale-95 ${activeTab === 'products'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Products
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('categories');
                                setSearchTerm('');
                            }}
                            className={`px-5 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-200 active:scale-95 ${activeTab === 'categories'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Categories
                        </button>
                    </div>
                }
                rightContent={
                    activeTab === 'products' ? (
                        <div className="flex items-center gap-2">
                            {/* Barcode Lookup - Primary Action */}
                            <button
                                onClick={() => setIsManualLookupOpen(true)}
                                className="hidden lg:flex items-center justify-center p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all duration-200 active:scale-90 active:scale-95 transition-all duration-300"
                                title="Lookup Barcode"
                            >
                                <span className="text-xl leading-none">⌨️</span>
                            </button>

                            <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>

                            {/* View Settings Dropdown */}
                            <div className="relative" ref={settingsRef}>
                                <button
                                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 active:scale-95 ${isSettingsOpen || showArchived || showFilters
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'liquid-glass-pill text-slate-700 dark:text-slate-300'
                                        }`}
                                >
                                    <AdjustmentsHorizontalIcon className="w-5 h-5" />
                                    <span className="text-sm font-medium">Display</span>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isSettingsOpen && (
                                    <div className="liquid-glass-card rounded-[2rem] absolute right-0 top-full mt-2 w-64 dark:bg-slate-800 border border-gray-100 dark:border-white/10 p-2 z-50 animate-in fade-in zoom-in-95 duration-200 font-medium">
                                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            View Layout
                                        </div>
                                        <div className="px-2">
                                            <ListGridToggle
                                                viewMode={viewMode}
                                                onViewModeChange={(mode) => {
                                                    setViewMode(mode);
                                                    // Don't close for better UX
                                                }}
                                                size="sm"
                                            />
                                        </div>

                                        <div className="my-2 border-t border-gray-100 dark:border-white/5"></div>

                                        <button
                                            onClick={() => setShowFilters(!showFilters)}
                                            className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors active:scale-95 transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FiFilter className="w-4 h-4" />
                                                <span>Show Filters</span>
                                            </div>
                                            {showFilters && <CheckIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                        </button>

                                        <button
                                            onClick={() => setShowArchived(!showArchived)}
                                            className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors active:scale-95 transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="w-4 h-4 flex items-center justify-center text-xs">📦</span>
                                                <span>Show Archived</span>
                                            </div>
                                            {showArchived && <CheckIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null
                }
            />
        </div>
    );
});

export default InventoryHeader;
