import React from 'react';
import ChevronDownIcon from '../icons/ChevronDownIcon';

interface PaginationProps {
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    label?: string;
    className?: string;
    compact?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
    total,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    label = 'items',
    className = '',
    compact = false
}) => {
    if (total === 0) return null;

    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, total);

    return (
        <div className={`p-4 bg-white dark:bg-slate-900 dark:border-white/10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-10 ${className}`}>
            <div className={`flex ${compact ? 'flex-row' : 'flex-col sm:flex-row'} items-center justify-between gap-4`}>
                {/* Page Info */}
                <div className="text-sm text-slate-500 dark:text-gray-400 font-medium whitespace-nowrap">
                    Showing <span className="text-slate-900 dark:text-white font-bold">{startItem}</span> - <span className="text-slate-900 dark:text-white font-bold">{endItem}</span> of <span className="text-slate-900 dark:text-white font-bold">{total}</span> {label}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                    {/* Rows per page */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-500 dark:text-gray-400 font-medium hidden sm:block">Rows:</label>
                        <div className="relative">
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    onPageSizeChange(parseInt(e.target.value, 10));
                                    onPageChange(1);
                                }}
                                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all hover:border-slate-300 dark:hover:border-white/20 cursor-pointer"
                            >
                                {[10, 20, 50, 100].map(sz => (
                                    <option key={sz} value={sz}>{sz}</option>
                                ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                        <button
                            className="px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-all"
                            onClick={() => onPageChange(Math.max(1, page - 1))}
                            disabled={page <= 1}
                        >
                            Prev
                        </button>
                        <div className="px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-white min-w-[30px] text-center">
                            {page}
                        </div>
                        <button
                            className="px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-all"
                            onClick={() => onPageChange(page * pageSize < total ? page + 1 : page)}
                            disabled={page * pageSize >= total}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pagination;
