import React, { useState, useEffect } from 'react';
import XMarkIcon from '../../icons/XMarkIcon';
import ChevronDownIcon from '../../icons/ChevronDownIcon';
import CalendarIcon from '../../icons/CalendarIcon';
import UserIcon from '../../icons/UserIcon';
import { Customer } from '../../../types';

interface SalesFilterSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: { start: string; end: string; customer: string; status: string }) => void;
    onReset: () => void;
    initialFilters: { start: string; end: string; customer: string; status: string };
    customers: Customer[];
    sortBy: string;
    setSortBy: (val: string) => void;
    sortOrder: 'asc' | 'desc';
    setSortOrder: (val: 'asc' | 'desc') => void;
}

export default function SalesFilterSheet({
    isOpen, onClose, onApply, onReset, initialFilters, customers,
    sortBy, setSortBy, sortOrder, setSortOrder
}: SalesFilterSheetProps) {
    const [tempStartDate, setTempStartDate] = useState(initialFilters.start);
    const [tempEndDate, setTempEndDate] = useState(initialFilters.end);
    const [tempCustomerId, setTempCustomerId] = useState(initialFilters.customer);
    const [tempStatus, setTempStatus] = useState(initialFilters.status);

    useEffect(() => {
        if (isOpen) {
            setTempStartDate(initialFilters.start);
            setTempEndDate(initialFilters.end);
            setTempCustomerId(initialFilters.customer);
            setTempStatus(initialFilters.status);
        }
    }, [isOpen, initialFilters]);

    const handleApply = () => {
        onApply({ start: tempStartDate, end: tempEndDate, customer: tempCustomerId, status: tempStatus });
        onClose();
    };

    const handleResetAndClose = () => {
        onReset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 animate-fade-in" />
            <div
                className="absolute top-[60px] right-4 left-auto w-72 bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up border border-gray-100 flex flex-col max-h-[80vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Filter Options</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 overflow-y-auto custom-scrollbar space-y-5">

                    {/* Sort By */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Sort By</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'date', label: 'Date' },
                                { id: 'total', label: 'Amount' },
                                { id: 'customer', label: 'Customer' },
                                { id: 'status', label: 'Status' },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setSortBy(opt.id)}
                                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${sortBy === opt.id
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                        >
                            <span>Order: {sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        </button>
                    </div>

                    <div className="border-t border-gray-100 my-2" />

                    {/* Date Range */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-blue-500" />
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date Range</label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-gray-500">From</label>
                                <input
                                    type="date"
                                    value={tempStartDate}
                                    onChange={e => setTempStartDate(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-gray-500">To</label>
                                <input
                                    type="date"
                                    value={tempEndDate}
                                    onChange={e => setTempEndDate(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Customer */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-purple-500" />
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</label>
                        </div>
                        <div className="relative">
                            <select
                                value={tempCustomerId}
                                onChange={e => setTempCustomerId(e.target.value)}
                                className="w-full p-2 pr-8 rounded-lg border border-gray-200 bg-gray-50 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                            >
                                <option value="">All Customers</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Status</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: '', label: 'All' },
                                { value: 'paid', label: 'Paid' },
                                { value: 'unpaid', label: 'Unpaid' },
                                { value: 'partially_paid', label: 'Partial' },
                            ].map((status) => (
                                <button
                                    key={status.value}
                                    onClick={() => setTempStatus(status.value)}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${tempStatus === status.value
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2">
                    <button
                        onClick={handleResetAndClose}
                        className="flex-1 py-2 px-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold shadow-sm hover:bg-gray-50"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 py-2 px-3 bg-gray-900 text-white rounded-xl text-xs font-semibold shadow-md active:scale-[0.98] transition-all"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}
