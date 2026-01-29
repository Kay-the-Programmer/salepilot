import React from 'react';
import {
    MagnifyingGlassIcon,
    GridIcon,
    ListIcon,
    ClockIcon,
    QuestionMarkCircleIcon
} from '../icons';

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
    return (
        <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto ml-4 md:ml-0">
                <div className="relative flex-1 md:flex-none">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        id="pos-search"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search products..."
                        className="w-full md:w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                {/* View Toggle (Desktop Only) */}
                <div id="pos-view-toggle" className="hidden md:flex items-center gap-1 bg-white rounded-xl p-0">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-xl transition-colors ${viewMode === 'grid'
                            ? 'bg-white text-blue-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                        title="Grid view"
                    >
                        <GridIcon className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-200" />
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-xl transition-colors ${viewMode === 'list'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                        title="List view"
                    >
                        <ListIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <button
                id="pos-held-btn"
                onClick={onOpenHeldSales}
                className="px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 text-sm font-medium rounded-xl border border-amber-200 flex items-center gap-2 hover:border-amber-300 transition-colors relative"
            >
                <ClockIcon className="w-4 h-4" />
                Held Sales
                {heldSalesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {heldSalesCount}
                    </span>
                )}
            </button>
            <button
                onClick={onTourStart}
                className="p-2 text-slate-500 hover:text-blue-600 transition-colors"
                title="Help Guide"
            >
                <QuestionMarkCircleIcon className="w-6 h-6" />
            </button>
        </div>
    );
};
