import React from 'react';
import DownloadIcon from '../../icons/DownloadIcon';
import { Customer } from '../../../types';

interface SalesFilterBarProps {
    showFilters: boolean;
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
    selectedCustomerId: string;
    setSelectedCustomerId: (val: string) => void;
    customers: Customer[];
    resetFilters: () => void;
    handleExportCSV: () => void;
    handleExportPDF: () => void;
}

export default function SalesFilterBar({
    showFilters, startDate, setStartDate, endDate, setEndDate,
    selectedCustomerId, setSelectedCustomerId, customers,
    resetFilters, handleExportCSV, handleExportPDF
}: SalesFilterBarProps) {
    if (!showFilters) return null;

    return (
        <div className="hidden md:block mb-6 animate-slideDown">
            <div className="liquid-glass-card rounded-[2rem] p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 items-center">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Customer</label>
                        <select
                            value={selectedCustomerId}
                            onChange={e => setSelectedCustomerId(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Customers</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-2 lg:col-span-3 justify-end h-full items-end pb-1">
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 transition-colors active:scale-95 transition-all duration-300"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="px-4 py-2.5 rounded-xl bg-white text-gray-700 font-medium text-sm border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2 active:scale-95 transition-all duration-300"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            CSV
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium text-sm hover:from-blue-700 hover:to-blue-800 transition-colors flex items-center gap-2"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
