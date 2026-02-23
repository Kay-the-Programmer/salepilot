import FilterIcon from '../../icons/FilterIcon';
import CalendarIcon from '../../icons/CalendarIcon';
import UserIcon from '../../icons/UserIcon';
import ChevronDownIcon from '../../icons/ChevronDownIcon';
import { Customer } from '../../../types';
import ChartBarIcon from '../../icons/ChartBarIcon';
import FunnelIcon from '@/components/icons/FunnelIcon';
import { ClockIcon } from 'lucide-react';

interface SalesHeaderProps {
    selectedStatus: string;
    setSelectedStatus: (status: string) => void;
    mobileView: 'summary' | 'history';
    setMobileView: (view: 'summary' | 'history') => void;
    setIsFilterSheetOpen: (isOpen: boolean) => void;
    hasActiveFilters: boolean;
    startDate: string;
    endDate: string;
    selectedCustomerId: string;
    resetFilters: () => void;
    customers: Customer[];
    total: number;
}

export default function SalesHeader({
    selectedStatus, setSelectedStatus, mobileView, setMobileView,
    setIsFilterSheetOpen, hasActiveFilters, startDate, endDate, selectedCustomerId,
    resetFilters, customers, total
}: SalesHeaderProps) {
    return (
        <>
            {/* Desktop Header */}
            <div className="hidden dark:bg-slate-950/90 bg-slate-50/90 backdrop-blur-2xl md:flex items-center justify-between px-8 py-4 sticky top-0 z-30 border-b border-transparent transition-all duration-300">
                <div className="flex justify-between w-full max-w-[1400px] mx-auto">
                    <div>
                        <h1 className="text-[34px] font-semibold text-slate-900 dark:text-white leading-tight tracking-tight">Recent Sales</h1>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">
                            {total} sale{total !== 1 ? 's' : ''} found
                        </p>
                    </div>

                    {/* Right side actions: Status Pills + Filter Toggle */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Status Pills */}
                        <div className="flex bg-slate-200/50 dark:bg-slate-800/80 p-1.5 rounded-[16px] shadow-inner items-center">
                            {['', 'paid', 'unpaid', 'partially_paid'].map((status) => {
                                const isActive = selectedStatus === status;
                                const label = status === '' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                                return (
                                    <button
                                        key={status}
                                        onClick={() => setSelectedStatus(status)}
                                        className={`px-4 py-2 rounded-[12px] text-[13px] font-bold tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-300 ${isActive
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Filter Trigger Button */}
                        <button
                            onClick={() => setIsFilterSheetOpen(true)}
                            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[15px] font-bold tracking-wide transition-all duration-300 active:scale-95 shadow-sm border ${hasActiveFilters
                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20'
                                : 'bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl text-slate-700 dark:text-slate-200 border-slate-200/50 dark:border-white/10 hover:shadow-md'
                                }`}
                        >
                            <FilterIcon className={`w-4.5 h-4.5 ${hasActiveFilters ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                            <span>Filters</span>
                            {hasActiveFilters && (
                                <span className="flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-[10px] rounded-full font-bold ml-1 animate-in zoom-in-50">
                                    !
                                </span>
                            )}
                            <ChevronDownIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="sticky top-0 z-30 dark:bg-slate-950/90 bg-slate-50/90 backdrop-blur-2xl px-4 py-4 md:hidden border-b border-transparent transition-all duration-300">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide uppercase mb-1">
                            {total} sale{total !== 1 ? 's' : ''} found
                        </p>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                            {mobileView === 'summary' ? 'Sales Summary' : 'Recent Sales'}
                        </h1>
                    </div>
                    <div className="flex items-center space-x-2">

                        <div className="flex bg-slate-200/50 dark:bg-slate-800/80 p-1.5 rounded-[16px] gap-1 shadow-inner items-center">

                            {/* Filter Button */}
                            <button
                                onClick={() => setIsFilterSheetOpen(true)}
                                className={`p-2 rounded-[12px] transition-colors relative ${hasActiveFilters ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/20 shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                aria-label="Filter options"
                            >
                                <FunnelIcon className="w-4.5 h-4.5" />
                                {hasActiveFilters && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
                                )}
                            </button>
                            <button
                                onClick={() => setMobileView('summary')}
                                className={`flex items-center gap-2 p-2 rounded-[12px] transition-all duration-300 ${mobileView === 'summary'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <ChartBarIcon className="w-4.5 h-4.5" />
                            </button>
                            <button
                                onClick={() => setMobileView('history')}
                                className={`flex items-center gap-2 p-2 rounded-[12px] transition-all duration-300 ${mobileView === 'history'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <ClockIcon className="w-4.5 h-4.5" />
                            </button>

                        </div>
                    </div>
                </div>

                {/* Active Filters Chips (Mobile) */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 mt-4 pb-1">
                        {startDate && endDate && (
                            <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-3 py-1.5 text-[11px] font-bold tracking-wide border border-blue-100 dark:border-blue-500/20">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                        {selectedCustomerId && (
                            <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-3 py-1.5 text-[11px] font-bold tracking-wide border border-purple-100 dark:border-purple-500/20">
                                <UserIcon className="w-3.5 h-3.5" />
                                {customers.find(c => String(c.id) === String(selectedCustomerId))?.name || 'Customer'}
                            </span>
                        )}
                        {selectedStatus && (
                            <span className="inline-flex items-center gap-1.5 rounded-[10px] capitalize bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 text-[11px] font-bold tracking-wide border border-emerald-100 dark:border-emerald-500/20">
                                {selectedStatus.replace('_', ' ')}
                            </span>
                        )}
                        <button onClick={resetFilters} className="text-[11px] font-bold tracking-wide text-rose-600 dark:text-rose-400 underline ml-2 transition-all duration-300 active:opacity-70">
                            Clear
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};
