import React from 'react';
import GridIcon from '../../icons/GridIcon';
import FilterIcon from '../../icons/FilterIcon';
import CalendarIcon from '../../icons/CalendarIcon';
import UserIcon from '../../icons/UserIcon';
import ChevronDownIcon from '../../icons/ChevronDownIcon';
import { Customer } from '../../../types';
import ChartBarIcon from '../../icons/ChartBarIcon';
import RefreshIcon from '../../icons/RefreshIcon';
import FunnelIcon from '@/components/icons/FunnelIcon';
import { ClockIcon } from 'lucide-react';

interface SalesHeaderProps {
    selectedStatus: string;
    setSelectedStatus: (status: string) => void;
    mobileView: 'summary' | 'history';
    setMobileView: (view: 'summary' | 'history') => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
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
    selectedStatus, setSelectedStatus, mobileView, setMobileView, isMobileMenuOpen, setIsMobileMenuOpen,
    setIsFilterSheetOpen, hasActiveFilters, startDate, endDate, selectedCustomerId,
    resetFilters, customers, total
}: SalesHeaderProps) {
    return (
        <>
            {/* Desktop Header */}
            <div className="hidden dark:bg-slate-900 md:flex items-center justify-between px-6 py-2 sticky top-0 z-30">
                <div className="flex justify-between w-full">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white uppercase leading-tight">Recent Sales</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {total} sale{total !== 1 ? 's' : ''} found
                        </p>
                    </div>

                    {/* Right side actions: Status Pills + Filter Toggle */}
                    <div className="flex items-center gap-4">
                        {/* Status Pills */}
                        <div className="flex bg-gray-100/80 dark:bg-white/5 p-1 rounded-3xl shadow-sm border border-gray-100 dark:border-white/10 shrink-0">
                            {['', 'paid', 'unpaid', 'partially_paid'].map((status) => {
                                const isActive = selectedStatus === status;
                                const label = status === '' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                                return (
                                    <button
                                        key={status}
                                        onClick={() => setSelectedStatus(status)}
                                        className={`px-4 py-1.5 rounded-2xl text-sm font-medium transition-all duration-200 ${isActive
                                            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
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
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 border shadow-sm ${hasActiveFilters
                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 hover:bg-blue-100'
                                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                                }`}
                        >
                            <FilterIcon className={`w-4 h-4 ${hasActiveFilters ? 'text-blue-600' : 'text-gray-500'}`} />
                            <span>Filters</span>
                            {hasActiveFilters && (
                                <span className="flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-[10px] rounded-full font-bold ml-1 animate-in zoom-in-50">
                                    !
                                </span>
                            )}
                            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 px-4 py-3 md:hidden">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                            {mobileView === 'summary' ? 'Sales Summary' : 'Recent Sales'}
                        </h1>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium -mt-0.5">
                            {total} sale{total !== 1 ? 's' : ''} found
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">

                        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl gap-1">

                            {/* Filter Button */}
                            <button
                                onClick={() => setIsFilterSheetOpen(true)}
                                className={`p-2 rounded-lg active:bg-gray-100 dark:active:bg-white/10 transition-colors relative ${hasActiveFilters ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/20' : 'text-gray-600 dark:text-gray-400'}`}
                                aria-label="Filter options"
                            >
                                <FunnelIcon className="w-6 h-6" />
                                {hasActiveFilters && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
                                )}
                            </button>
                            <button
                                onClick={() => setMobileView('summary')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${mobileView === 'summary'
                                    ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                <ChartBarIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setMobileView('history')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${mobileView === 'history'
                                    ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                <ClockIcon className="w-4 h-4" />
                            </button>

                        </div>
                    </div>
                </div>

                {/* Active Filters Chips (Mobile) */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 mt-3 pb-1">
                        {startDate && endDate && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2.5 py-1 text-xs font-medium border border-blue-100 dark:border-blue-500/20">
                                <CalendarIcon className="w-3 h-3" />
                                {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                        {selectedCustomerId && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-2.5 py-1 text-xs font-medium border border-purple-100 dark:border-purple-500/20">
                                <UserIcon className="w-3 h-3" />
                                {customers.find(c => String(c.id) === String(selectedCustomerId))?.name || 'Customer'}
                            </span>
                        )}
                        {selectedStatus && (
                            <span className="inline-flex items-center gap-1.5 rounded-full capitalize bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-2.5 py-1 text-xs font-medium border border-green-100 dark:border-green-500/20">
                                {selectedStatus.replace('_', ' ')}
                            </span>
                        )}
                        <button onClick={resetFilters} className="text-xs text-red-600 dark:text-red-400 underline ml-1">
                            Clear
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};
