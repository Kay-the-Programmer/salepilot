import React, { useState, useMemo } from 'react';
import { Sale, StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import ArrowTrendingUpIcon from '../../icons/ArrowTrendingUpIcon';
import BanknotesIcon from '../../icons/BanknotesIcon';
import ReceiptPercentIcon from '../../icons/ReceiptPercentIcon';
import CalculatorIcon from '../../icons/CalculatorIcon';
import CalendarDaysIcon from '../../icons/CalendarDaysIcon';
import InformationCircleIcon from '../../icons/InformationCircleIcon';

interface TaxReportViewProps {
    sales: Sale[];
    storeSettings: StoreSettings;
}

const TaxReportView: React.FC<TaxReportViewProps> = ({ sales, storeSettings }) => {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const filteredData = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const relevantSales = sales.filter(s => {
            const saleDate = new Date(s.timestamp);
            return saleDate >= start && saleDate <= end;
        });

        const totalSales = relevantSales.reduce((sum, s) => sum + s.subtotal, 0);
        const totalTax = relevantSales.reduce((sum, s) => sum + s.tax, 0);
        const totalTransactions = relevantSales.reduce((sum, s) => sum + s.total, 0);

        return {
            totalSales,
            totalTax,
            totalTransactions,
            numberOfTransactions: relevantSales.length,
            averageTransaction: relevantSales.length > 0 ? totalTransactions / relevantSales.length : 0
        };
    }, [sales, startDate, endDate]);

    const taxRate = storeSettings.taxRate;

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900">Sales Tax Report</h3>
                    <p className="text-sm text-slate-600 mt-1">Track and report sales tax collections</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative group flex-1 sm:flex-none">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <CalendarDaysIcon className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm font-medium text-slate-700"
                        />
                    </div>
                    <span className="hidden sm:block text-slate-400 font-bold px-1">/</span>
                    <div className="relative group flex-1 sm:flex-none">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <CalendarDaysIcon className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm font-medium text-slate-700"
                        />
                    </div>
                </div>
            </div>

            {/* Tax Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-5 md:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                            <ArrowTrendingUpIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-blue-700">Taxable Sales</div>
                        </div>
                    </div>
                    <div className="text-xl md:text-2xl font-black text-blue-900 tracking-tight">{formatCurrency(filteredData.totalSales, storeSettings)}</div>
                    <div className="text-[10px] font-medium text-blue-600 mt-2 uppercase tracking-wider">Subject to Tax</div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 p-5 md:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-200">
                            <BanknotesIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">Tax Collected</div>
                        </div>
                    </div>
                    <div className="text-xl md:text-2xl font-black text-emerald-900 tracking-tight">{formatCurrency(filteredData.totalTax, storeSettings)}</div>
                    <div className="text-[10px] font-medium text-emerald-600 mt-2 uppercase tracking-wider">At {taxRate}% tax rate</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 p-5 md:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-purple-600 rounded-xl shadow-lg shadow-purple-200">
                            <ReceiptPercentIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-purple-700">Transactions</div>
                        </div>
                    </div>
                    <div className="text-xl md:text-2xl font-black text-purple-900 tracking-tight">{filteredData.numberOfTransactions}</div>
                    <div className="text-[10px] font-medium text-purple-600 mt-2 uppercase tracking-wider">Total Count</div>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-slate-600 rounded-xl shadow-lg shadow-slate-200">
                            <CalculatorIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-700">Avg Transaction</div>
                        </div>
                    </div>
                    <div className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(filteredData.averageTransaction, storeSettings)}</div>
                    <div className="text-[10px] font-medium text-slate-500 mt-2 uppercase tracking-wider">Inc. Tax</div>
                </div>
            </div>

            {/* Tax Calculation Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/30">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                            <CalculatorIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Tax Calculation Breakdown</h3>
                    </div>
                </div>
                <div className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Taxable Sales</div>
                            <div className="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(filteredData.totalSales, storeSettings)}</div>
                            <div className="text-[10px] text-slate-500 mt-2 font-medium">Base amount for calculation</div>
                        </div>

                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 hover:border-blue-200 transition-colors">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-blue-700 mb-1">Tax Collected</div>
                            <div className="text-xl font-black text-blue-900 tracking-tight">{formatCurrency(filteredData.totalTax, storeSettings)}</div>
                            <div className="text-[10px] text-blue-600 mt-2 font-medium">Amount to be remitted ({taxRate}%)</div>
                        </div>

                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 hover:border-emerald-200 transition-colors">
                            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 mb-1">Total inclusive</div>
                            <div className="text-xl font-black text-emerald-900 tracking-tight">
                                {formatCurrency(filteredData.totalSales + filteredData.totalTax, storeSettings)}
                            </div>
                            <div className="text-[10px] text-emerald-600 mt-2 font-medium">Sum of sales and tax</div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                    <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                            <InformationCircleIcon className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">
                                This report summarizes the total sales tax collected at the rate of {taxRate}% for the selected period.
                                The tax amount of {formatCurrency(filteredData.totalTax, storeSettings)} should be remitted to the relevant tax authorities.
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                                Note: This is a simplified report based on a single tax rate. For multi-rate tax management, further configuration is required.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxReportView;
