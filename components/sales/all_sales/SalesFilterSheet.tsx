import { useState, useEffect } from 'react';
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
    onExportCSV?: () => void;
    onExportPDF?: () => void;
}


export default function SalesFilterSheet({
    isOpen, onClose, onApply, onReset, initialFilters, customers,
    sortBy, setSortBy, sortOrder, setSortOrder, onExportCSV, onExportPDF
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
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-auto" />
            <div
                className="relative w-full max-w-md mx-4 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up border border-gray-100 dark:border-white/10 flex flex-col max-h-[90vh] pointer-events-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Filter Sales</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Refine your sales data view</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-50 dark:bg-white/5 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 overflow-y-auto custom-scrollbar space-y-5">

                    {/* Sort By */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Sort By</label>
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
                                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400'
                                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                            <span>Order: {sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        </button>
                    </div>

                    <div className="border-t border-gray-100 dark:border-white/10 my-2" />

                    {/* Date Range */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-blue-500" />
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date Range</label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">From</label>
                                <input
                                    type="date"
                                    value={tempStartDate}
                                    onChange={e => setTempStartDate(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400">To</label>
                                <input
                                    type="date"
                                    value={tempEndDate}
                                    onChange={e => setTempEndDate(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Customer */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-purple-500" />
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</label>
                        </div>
                        <div className="relative">
                            <select
                                value={tempCustomerId}
                                onChange={e => setTempCustomerId(e.target.value)}
                                className="w-full p-2 pr-8 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-800 text-xs text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
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
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Status</label>
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
                                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400'
                                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-slate-900 flex flex-col gap-3">
                    <div className="flex gap-2">
                        <button
                            onClick={handleResetAndClose}
                            className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleApply}
                            className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-md active:scale-[0.98] transition-all hover:bg-blue-700"
                        >
                            Apply Filters
                        </button>
                    </div>

                    {(onExportCSV || onExportPDF) && (
                        <div className="flex gap-2 pt-1">
                            {onExportCSV && (
                                <button
                                    onClick={onExportCSV}
                                    className="flex-1 py-2 px-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                                >
                                    CSV
                                </button>
                            )}
                            {onExportPDF && (
                                <button
                                    onClick={onExportPDF}
                                    className="flex-1 py-2 px-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                                >
                                    PDF
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

