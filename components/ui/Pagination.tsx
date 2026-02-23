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
        <div className={`p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-gray-100/50 dark:border-white/5 shadow-[0_-4px_24px_-10px_rgba(0,0,0,0.05)] z-10 ${className}`}>
            <div className={`flex ${compact ? 'flex-row' : 'flex-col md:flex-row'} items-center justify-between gap-4 max-w-7xl mx-auto`}>
                {/* Page Info */}
                <div className="text-[13px] text-slate-500 dark:text-gray-400 font-medium whitespace-nowrap hidden sm:block">
                    Showing <span className="text-slate-900 dark:text-white font-semibold">{startItem}</span> to <span className="text-slate-900 dark:text-white font-semibold">{endItem}</span> of <span className="text-slate-900 dark:text-white font-semibold">{total}</span> {label}
                </div>

                {/* Mobile Page Info (Compact) */}
                <div className="text-[12px] text-slate-500 dark:text-gray-400 font-medium whitespace-nowrap sm:hidden">
                    <span className="text-slate-900 dark:text-white font-semibold">{startItem}-{endItem}</span> of <span className="text-slate-900 dark:text-white font-semibold">{total}</span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Rows per page */}
                    <div className="flex items-center gap-2">
                        <label className="text-[13px] text-slate-500 dark:text-gray-400 font-medium hidden sm:block">Rows</label>
                        <div className="relative">
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    onPageSizeChange(parseInt(e.target.value, 10));
                                    onPageChange(1);
                                }}
                                className="appearance-none pl-3 pr-8 py-1.5 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-slate-800 text-[13px] font-medium text-slate-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 cursor-pointer active:scale-95 transition-all duration-200"
                            >
                                {[10, 20, 50, 100].map(sz => (
                                    <option key={sz} value={sz}>{sz}</option>
                                ))}
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-white/5 p-1 rounded-full">
                        <button
                            className="px-3 sm:px-4 py-1.5 rounded-full text-[13px] font-medium text-slate-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-all active:scale-95 duration-200"
                            onClick={() => onPageChange(Math.max(1, page - 1))}
                            disabled={page <= 1}
                        >
                            Prev
                        </button>
                        <div className="px-2 py-1.5 text-[13px] font-semibold text-slate-900 dark:text-white min-w-[28px] text-center">
                            {page}
                        </div>
                        <button
                            className="px-3 sm:px-4 py-1.5 rounded-full text-[13px] font-medium text-slate-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-all active:scale-95 duration-200"
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
