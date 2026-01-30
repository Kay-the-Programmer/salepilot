import React from 'react';
import GridIcon from '../../icons/GridIcon';
import FilterIcon from '../../icons/FilterIcon';
import CalendarIcon from '../../icons/CalendarIcon';
import UserIcon from '../../icons/UserIcon';
import { Customer } from '../../../types';

interface SalesHeaderProps {
    selectedStatus: string;
    setSelectedStatus: (status: string) => void;
    mobileView: 'summary' | 'history';
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
    setIsFilterSheetOpen: (isOpen: boolean) => void;
    hasActiveFilters: boolean;
    startDate: string;
    endDate: string;
    selectedCustomerId: string;
    resetFilters: () => void;
    customers: Customer[];
}

export default function SalesHeader({
    selectedStatus, setSelectedStatus, mobileView, isMobileMenuOpen, setIsMobileMenuOpen,
    setIsFilterSheetOpen, hasActiveFilters, startDate, endDate, selectedCustomerId,
    resetFilters, customers
}: SalesHeaderProps) {
    return (
        <>
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between px-6 py-4 sticky top-0 z-30">
                <div className="flex justify-between w-full">
                    <h1 className="text-xl font-bold text-gray-900">Sales History</h1>

                    {/* Status Pills */}
                    <div className="flex bg-gray-100/80 p-1 rounded-3xl shadow-lg border-white shrink-0">
                        {['', 'paid', 'unpaid', 'partially_paid'].map((status) => {
                            const isActive = selectedStatus === status;
                            const label = status === '' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                            return (
                                <button
                                    key={status}
                                    onClick={() => setSelectedStatus(status)}
                                    className={`px-4 py-1.5 rounded-2xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 md:hidden">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-bold text-gray-900">
                        {mobileView === 'summary' ? 'Sales Summary' : 'Sales History'}
                    </h1>
                    <div className="flex items-center space-x-2">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`p-2 rounded-lg active:bg-gray-100 transition-colors ${isMobileMenuOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
                            aria-label="Menu"
                        >
                            <GridIcon className="w-6 h-6" />
                        </button>

                        {/* Filter Button */}
                        <button
                            onClick={() => setIsFilterSheetOpen(true)}
                            className={`p-2 rounded-lg active:bg-gray-100 transition-colors relative ${hasActiveFilters ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
                            aria-label="Filter options"
                        >
                            <FilterIcon className="w-6 h-6" />
                            {hasActiveFilters && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Active Filters Chips (Mobile) */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 mt-3 pb-1">
                        {startDate && endDate && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-medium border border-blue-100">
                                <CalendarIcon className="w-3 h-3" />
                                {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                        {selectedCustomerId && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 text-purple-700 px-2.5 py-1 text-xs font-medium border border-purple-100">
                                <UserIcon className="w-3 h-3" />
                                {customers.find(c => String(c.id) === String(selectedCustomerId))?.name || 'Customer'}
                            </span>
                        )}
                        {selectedStatus && (
                            <span className="inline-flex items-center gap-1.5 rounded-full capitalize bg-green-50 text-green-700 px-2.5 py-1 text-xs font-medium border border-green-100">
                                {selectedStatus.replace('_', ' ')}
                            </span>
                        )}
                        <button onClick={resetFilters} className="text-xs text-red-600 underline ml-1">
                            Clear
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};
