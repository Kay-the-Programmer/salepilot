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
        <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none sm:items-center sm:p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in pointer-events-auto" />
            <div
                className="bg-white dark:bg-slate-900/95 backdrop-blur-2xl rounded-t-[32px] sm:rounded-[32px] w-full max-w-md animate-notification-slide-down sm:animate-fade-in-up border border-slate-200/50 dark:border-white/10 flex flex-col max-h-[90vh] pointer-events-auto shadow-2xl relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Filter Sales</h3>
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Refine your sales data view</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-full transition-all duration-300 active:scale-95"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">

                    {/* Sort By */}
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 block">Sort By</label>
                        <div className="grid grid-cols-2 gap-2.5">
                            {[
                                { id: 'date', label: 'Date' },
                                { id: 'total', label: 'Amount' },
                                { id: 'customer', label: 'Customer' },
                                { id: 'status', label: 'Status' },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setSortBy(opt.id)}
                                    className={`px-4 py-3 text-[13px] font-bold tracking-wide rounded-[14px] border transition-all duration-300 ${sortBy === opt.id
                                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/20'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="mt-3 w-full flex items-center justify-between gap-2 px-4 py-3 text-[13px] font-bold tracking-wide rounded-[14px] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all duration-300"
                        >
                            <span>Order Layout</span>
                            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                                <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                                <span className="w-5 h-5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            </div>
                        </button>
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/5" />

                    {/* Date Range */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4.5 h-4.5 text-blue-500" />
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date Range</label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 ml-1">From</label>
                                <input
                                    type="date"
                                    value={tempStartDate}
                                    onChange={e => setTempStartDate(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-[14px] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-[14px] font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 ml-1">To</label>
                                <input
                                    type="date"
                                    value={tempEndDate}
                                    onChange={e => setTempEndDate(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-[14px] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-[14px] font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/5" />

                    {/* Customer */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-4.5 h-4.5 text-purple-500" />
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Customer</label>
                        </div>
                        <div className="relative">
                            <select
                                value={tempCustomerId}
                                onChange={e => setTempCustomerId(e.target.value)}
                                className="w-full px-4 py-3 pr-10 rounded-[14px] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-[14px] font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none transition-all duration-300"
                            >
                                <option value="">All Customers</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/5" />

                    {/* Status */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Status</label>
                        <div className="grid grid-cols-2 gap-2.5">
                            {[
                                { value: '', label: 'All' },
                                { value: 'paid', label: 'Paid' },
                                { value: 'unpaid', label: 'Unpaid' },
                                { value: 'partially_paid', label: 'Partial' },
                            ].map((status) => (
                                <button
                                    key={status.value}
                                    onClick={() => setTempStatus(status.value)}
                                    className={`px-4 py-3 rounded-[14px] text-[13px] font-bold tracking-wide border transition-all duration-300 ${tempStatus === status.value
                                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/20'
                                        }`}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900 flex flex-col gap-3 rounded-b-[32px]">
                    <div className="flex gap-3">
                        <button
                            onClick={handleResetAndClose}
                            className="flex-1 py-3.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-[14px] sm:rounded-[16px] text-[15px] font-bold tracking-wide shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-95 transition-all duration-300"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleApply}
                            className="flex-1 flex-[2] py-3.5 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[14px] sm:rounded-[16px] text-[15px] font-bold tracking-wide shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.98] transition-all duration-300"
                        >
                            Apply Filters
                        </button>
                    </div>

                    {(onExportCSV || onExportPDF) && (
                        <div className="flex gap-3 pt-2">
                            {onExportCSV && (
                                <button
                                    onClick={onExportCSV}
                                    className="flex-1 py-2.5 px-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-[12px] sm:rounded-[14px] text-[13px] font-bold tracking-wide transition-colors flex items-center justify-center gap-2 active:scale-95 transition-all duration-300 shadow-sm"
                                >
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                    Export CSV
                                </button>
                            )}
                            {onExportPDF && (
                                <button
                                    onClick={onExportPDF}
                                    className="flex-1 py-2.5 px-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-[12px] sm:rounded-[14px] text-[13px] font-bold tracking-wide transition-colors flex items-center justify-center gap-2 active:scale-95 transition-all duration-300 shadow-sm"
                                >
                                    <div className="w-2 h-2 bg-rose-500 rounded-full" />
                                    Export PDF
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

