import React, { useState, useRef, useEffect } from 'react';
import {
    MagnifyingGlassIcon,
    ClockIcon,
    QuestionMarkCircleIcon
} from '../icons';
import ListGridToggle from '../ui/ListGridToggle';

interface SalesHeaderActionsProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
    heldSalesCount: number;
    onOpenHeldSales: () => void;
    onTourStart: () => void;
}

export const SalesHeaderActions: React.FC<SalesHeaderActionsProps> = ({
    searchTerm,
    setSearchTerm,
    viewMode,
    setViewMode,
    heldSalesCount,
    onOpenHeldSales,
    onTourStart
}) => {
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchExpanded && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchExpanded]);

    return (
        <div className="hidden md:flex items-center gap-3">
            <div id="pos-search-container" className={`flex items-center gap-2 transition-all duration-300 ${isSearchExpanded ? 'w-full md:w-64' : 'w-auto'}`}>
                {isSearchExpanded ? (
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            ref={searchInputRef}
                            id="pos-search"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onBlur={() => {
                                if (!searchTerm) setIsSearchExpanded(false);
                            }}
                            placeholder="Search products..."
                            className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setIsSearchExpanded(false);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 p-1"
                            title="Close search"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsSearchExpanded(true)}
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50/30 dark:hover:bg-blue-500/10 transition-all shadow-sm group"
                        title="Search Products"
                    >
                        <MagnifyingGlassIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                )}

                {/* View Toggle (Desktop Only) */}
                <ListGridToggle viewMode={viewMode} onViewModeChange={setViewMode} size="sm" />
            </div>

            <button
                id="pos-held-btn"
                onClick={onOpenHeldSales}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:text-amber-700 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-500/30 hover:bg-amber-50/50 dark:hover:bg-amber-500/10 transition-all shadow-sm flex items-center gap-2 group relative"
                title="View Held Sales"
            >
                <ClockIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span className="hidden lg:inline">Held Sales</span>
                {heldSalesCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 dark:bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm animate-in zoom-in">
                        {heldSalesCount}
                    </span>
                )}
            </button>

            <button
                onClick={onTourStart}
                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50/30 dark:hover:bg-blue-500/10 transition-all shadow-sm group"
                title="Launch Help Guide"
            >
                <QuestionMarkCircleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
        </div>
    );
};
