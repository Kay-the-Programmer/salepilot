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
        <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Persistent Search Bar - Desktop Only */}
            <div className="relative hidden md:block w-48 lg:w-64 xl:w-80 transition-all duration-300">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                    ref={searchInputRef}
                    id="pos-search"
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search products…"
                    className="w-full pl-10 pr-9 py-2.5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/40 dark:border-white/10 focus:border-blue-500/50 dark:focus:border-blue-400/50 rounded-full text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 dark:focus:ring-blue-500/5 transition-all"
                />
                {searchTerm ? (
                    <button
                        onClick={() => { setSearchTerm(''); searchInputRef.current?.focus(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200/50 dark:bg-slate-700/50 backdrop-blur-sm flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        aria-label="Clear search"
                    >
                        <XMarkIcon className="w-3 h-3 text-slate-500 dark:text-white" />
                    </button>
                ) : (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 dark:text-slate-600 hidden xl:block select-none pointer-events-none">
                        /
                    </span>
                )}
            </div>

            {/* View Toggle - Always Visible */}
            <ListGridToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                size="sm"
                className="!bg-transparent !border-none !shadow-none !p-2 hover:bg-white/50 dark:hover:bg-slate-700/50"
            />

            {/* Admin Actions - Desktop Only */}
            <div className="hidden md:flex items-center gap-2">
                <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />

                <button
                    id="pos-held-btn"
                    onClick={onOpenHeldSales}
                    className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all active:scale-95"
                    aria-label={`Held sales${heldSalesCount > 0 ? ` (${heldSalesCount})` : ''}`}
                >
                    <ClockIcon className="w-4 h-4" />
                    <span className="hidden lg:inline text-xs">Held</span>
                    {heldSalesCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                            {heldSalesCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={onTourStart}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all active:scale-95"
                    aria-label="Launch help guide"
                >
                    <QuestionMarkCircleIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
