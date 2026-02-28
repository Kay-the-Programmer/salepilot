import React, { useRef, useEffect } from 'react';
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
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close search on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && searchTerm) {
                setSearchTerm('');
                searchInputRef.current?.blur();
            }
            // Focus search on '/' key when not typing
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchTerm]);

    return (
        <div className="hidden md:flex items-center gap-2 w-full max-w-2xl">
            {/* Persistent Search Bar */}
            <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                    ref={searchInputRef}
                    id="pos-search"
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search products, SKU, barcode…"
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500 rounded-full text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 dark:focus:ring-indigo-500/30 transition-all"
                />
                {searchTerm ? (
                    <button
                        onClick={() => { setSearchTerm(''); searchInputRef.current?.focus(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors"
                        aria-label="Clear search"
                    >
                        <XMarkIcon className="w-3 h-3 text-slate-700 dark:text-white" />
                    </button>
                ) : (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 dark:text-slate-600 hidden xl:block select-none pointer-events-none">
                        /
                    </span>
                )}
            </div>

            {/* View Toggle */}
            <ListGridToggle viewMode={viewMode} onViewModeChange={setViewMode} size="sm" />

            {/* Divider */}
            <div className="w-px h-5 bg-slate-200 dark:bg-white/10 flex-shrink-0" />

            {/* Held Sales */}
            <button
                id="pos-held-btn"
                onClick={onOpenHeldSales}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-90 transition-all duration-200 flex-shrink-0"
                aria-label={`Held sales${heldSalesCount > 0 ? ` (${heldSalesCount})` : ''}`}
            >
                <ClockIcon className="w-4 h-4" />
                <span className="hidden lg:inline">Held</span>
                {heldSalesCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                        {heldSalesCount}
                    </span>
                )}
            </button>

            {/* Help */}
            <button
                onClick={onTourStart}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-90 transition-all duration-200 flex-shrink-0"
                aria-label="Launch help guide"
            >
                <QuestionMarkCircleIcon className="w-4 h-4" />
            </button>
        </div>
    );
};
