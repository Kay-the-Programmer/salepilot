import React, { useState, useRef, useEffect } from 'react';
import {
    MagnifyingGlassIcon,
    ClockIcon,
    QuestionMarkCircleIcon
} from '../icons';
import XMarkIcon from '../icons/XMarkIcon';
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

    // Close search on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isSearchExpanded) {
                setSearchTerm('');
                setIsSearchExpanded(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchExpanded]);

    return (
        <div className="hidden md:flex items-center gap-1.5">
            {/* Search */}
            <div className={`flex items-center transition-all duration-200 ${isSearchExpanded ? 'w-56 lg:w-72' : 'w-auto'}`}>
                {isSearchExpanded ? (
                    <div className="relative flex-1">
                        <label htmlFor="pos-search" className="sr-only">Search products</label>
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
                            placeholder="Search products…"
                            className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    searchInputRef.current?.focus();
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
                                aria-label="Clear search"
                            >
                                <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => setIsSearchExpanded(true)}
                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label="Search products"
                    >
                        <MagnifyingGlassIcon className="w-[18px] h-[18px]" />
                    </button>
                )}
            </div>

            {/* View Toggle */}
            <ListGridToggle viewMode={viewMode} onViewModeChange={setViewMode} size="sm" />

            {/* Divider */}
            <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-0.5" />

            {/* Held Sales */}
            <button
                id="pos-held-btn"
                onClick={onOpenHeldSales}
                className="relative flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={`View held sales${heldSalesCount > 0 ? ` (${heldSalesCount})` : ''}`}
            >
                <ClockIcon className="w-[18px] h-[18px]" />
                <span className="hidden lg:inline">Held</span>
                {heldSalesCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {heldSalesCount}
                    </span>
                )}
            </button>

            {/* Help */}
            <button
                onClick={onTourStart}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Launch help guide"
            >
                <QuestionMarkCircleIcon className="w-[18px] h-[18px]" />
            </button>
        </div>
    );
};
