import { useState } from 'react';
import FilterIcon from '../../icons/FilterIcon';
import XMarkIcon from '../../icons/XMarkIcon';
import CalendarIcon from '../../icons/CalendarIcon';
import UserIcon from '../../icons/UserIcon';
import ChevronDownIcon from '../../icons/ChevronDownIcon';
import { Customer } from '../../../types';
import ChartBarIcon from '../../icons/ChartBarIcon';
import FunnelIcon from '@/components/icons/FunnelIcon';
import { ClockIcon } from 'lucide-react';
import SalesFilterSheet from './SalesFilterSheet';

interface SalesHeaderProps {
    selectedStatus: string;
    setSelectedStatus: (status: string) => void;
    mobileView: 'summary' | 'history';
    setMobileView: (view: 'summary' | 'history') => void;
    hasActiveFilters: boolean;
    startDate: string;
    endDate: string;
    selectedCustomerId: string;
    resetFilters: () => void;
    customers: Customer[];
    total: number;
    // Filter dropdown props
    isFilterOpen: boolean;
    setIsFilterOpen: (isOpen: boolean) => void;
    onApplyFilters: (filters: { start: string; end: string; customer: string; status: string }) => void;
    initialFilters: { start: string; end: string; customer: string; status: string };
    sortBy: string;
    setSortBy: (val: string) => void;
    sortOrder: 'asc' | 'desc';
    setSortOrder: (val: 'asc' | 'desc') => void;
    onExportCSV?: () => void;
    onExportPDF?: () => void;
}

export default function SalesHeader({
    selectedStatus, setSelectedStatus, mobileView, setMobileView,
    hasActiveFilters, startDate, endDate, selectedCustomerId,
    resetFilters, customers, total,
    isFilterOpen, setIsFilterOpen, onApplyFilters, initialFilters,
    sortBy, setSortBy, sortOrder, setSortOrder, onExportCSV, onExportPDF
}: SalesHeaderProps) {
    return (
        <>
            {/* Desktop Header */}
            <div className="hidden bg-white/70 dark:bg-slate-950/70 backdrop-blur-3xl md:flex items-center justify-between px-8 py-5 sticky top-0 z-30 border-b border-slate-200/50 dark:border-white/5 transition-all duration-300 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                <div className="flex justify-between items-center w-full max-w-[1400px] mx-auto">
                    <div>
                        <h1 className="text-[32px] font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">Recent Sales</h1>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
                            {total} sale{total !== 1 ? 's' : ''} found
                        </p>
                    </div>

                    {/* Right side actions: Status Pills + Filter Toggle */}
                    <div className="flex items-center gap-5 flex-shrink-0">
                        {/* Segmented Control Status Pills */}
                        <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-full shadow-inner items-center border border-slate-200/50 dark:border-white/5 backdrop-blur-md">
                            {['', 'paid', 'unpaid', 'partially_paid'].map((status) => {
                                const isActive = selectedStatus === status;
                                const label = status === '' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                                return (
                                    <button
                                        key={status}
                                        onClick={() => setSelectedStatus(status)}
                                        className={`px-5 py-2 rounded-full text-[13px] font-bold tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-300 relative ${isActive
                                            ? 'text-slate-900 dark:text-white'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        {isActive && (
                                            <div className="absolute inset-0 bg-white dark:bg-slate-700 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] -z-10 animate-in fade-in zoom-in-95 duration-200"></div>
                                        )}
                                        <span className="relative z-10">{label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Filter Trigger Button + Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-full text-[14px] font-bold tracking-wide transition-all duration-300 active:scale-95 shadow-sm border ${hasActiveFilters
                                    ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.2)]'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300 dark:hover:border-white/20'
                                    }`}
                            >
                                <FilterIcon className={`w-4.5 h-4.5 ${hasActiveFilters ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                                <span>Filters</span>
                                {hasActiveFilters && (
                                    <span className="flex items-center justify-center w-5 h-5 bg-white text-blue-600 text-[11px] rounded-full font-bold ml-1 animate-in zoom-in-50">
                                        !
                                    </span>
                                )}
                                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Filter Dropdown */}
                            <SalesFilterSheet
                                isOpen={isFilterOpen}
                                onClose={() => setIsFilterOpen(false)}
                                onApply={onApplyFilters}
                                onReset={resetFilters}
                                initialFilters={initialFilters}
                                customers={customers}
                                sortBy={sortBy}
                                setSortBy={setSortBy}
                                sortOrder={sortOrder}
                                setSortOrder={setSortOrder}
                                onExportCSV={onExportCSV}
                                onExportPDF={onExportPDF}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl px-5 py-4 md:hidden border-b border-slate-200/50 dark:border-white/5 transition-all duration-300">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase mb-1">
                            {total} sale{total !== 1 ? 's' : ''} found
                        </p>
                        <h1 className="text-[28px] font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">
                            {mobileView === 'summary' ? 'Summary' : 'Recent Sales'}
                        </h1>
                    </div>
                    <div className="flex items-center space-x-2">

                        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-full gap-1 shadow-inner items-center border border-slate-200/50 dark:border-white/5">

                            {/* Filter Button (Mobile) */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={`p-2.5 rounded-full transition-all relative ${hasActiveFilters ? 'text-white bg-blue-600 shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700'}`}
                                    aria-label="Filter options"
                                >
                                    <FunnelIcon className="w-4.5 h-4.5" />
                                    {hasActiveFilters && (
                                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-white rounded-full ring-2 ring-blue-600" />
                                    )}
                                </button>

                                {/* Filter Dropdown (Mobile) */}
                                <SalesFilterSheet
                                    isOpen={isFilterOpen}
                                    onClose={() => setIsFilterOpen(false)}
                                    onApply={onApplyFilters}
                                    onReset={resetFilters}
                                    initialFilters={initialFilters}
                                    customers={customers}
                                    sortBy={sortBy}
                                    setSortBy={setSortBy}
                                    sortOrder={sortOrder}
                                    setSortOrder={setSortOrder}
                                    onExportCSV={onExportCSV}
                                    onExportPDF={onExportPDF}
                                />
                            </div>
                            <button
                                onClick={() => setMobileView('summary')}
                                className={`flex items-center gap-2 p-2.5 rounded-full transition-all duration-300 ${mobileView === 'summary'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                <ChartBarIcon className="w-4.5 h-4.5" />
                            </button>
                            <button
                                onClick={() => setMobileView('history')}
                                className={`flex items-center gap-2 p-2.5 rounded-full transition-all duration-300 ${mobileView === 'history'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                <ClockIcon className="w-4.5 h-4.5" />
                            </button>

                        </div>
                    </div>
                </div>

                {/* Active Filters Chips (Mobile) */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 mt-5 pb-1">
                        {startDate && endDate && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-3.5 py-1.5 text-[11px] font-bold tracking-wide border border-blue-100 dark:border-blue-500/20">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                        {selectedCustomerId && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-3.5 py-1.5 text-[11px] font-bold tracking-wide border border-purple-100 dark:border-purple-500/20">
                                <UserIcon className="w-3.5 h-3.5" />
                                {customers.find(c => String(c.id) === String(selectedCustomerId))?.name || 'Customer'}
                            </span>
                        )}
                        {selectedStatus && (
                            <span className="inline-flex items-center gap-1.5 rounded-full capitalize bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3.5 py-1.5 text-[11px] font-bold tracking-wide border border-emerald-100 dark:border-emerald-500/20">
                                {selectedStatus.replace('_', ' ')}
                            </span>
                        )}
                        <button onClick={resetFilters} className="text-[12px] font-bold tracking-wide text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 ml-2 transition-all duration-300 active:scale-95 flex items-center gap-1">
                            <XMarkIcon className="w-3.5 h-3.5" /> Clear All
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};
