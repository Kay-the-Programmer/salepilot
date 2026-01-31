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
        <div className="space-y-6 md:space-y-8 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Sales Tax Report</h3>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">Track and report sales tax collections</p>
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
                            className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 text-sm font-bold text-slate-700 dark:text-slate-300"
                        />
                    </div>
                    <span className="hidden sm:block text-slate-400 dark:text-slate-600 font-black px-1">/</span>
                    <div className="relative group flex-1 sm:flex-none">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <CalendarDaysIcon className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 text-sm font-bold text-slate-700 dark:text-slate-300"
                        />
                    </div>
                </div>
            </div>

            {/* Tax Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div glass-effect="" className="rounded-2xl border border-blue-200/50 dark:border-blue-500/20 p-5 md:p-6 !bg-blue-50/50 dark:!bg-blue-900/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-white dark:bg-blue-900/40 rounded-xl shadow-sm border border-blue-100 dark:border-blue-500/20">
                            <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-100/50 dark:bg-blue-500/20 px-2 py-1 rounded-lg">Taxable Sales</span>
                    </div>
                    <div className="text-xl md:text-2xl font-black text-blue-900 dark:text-blue-50 tracking-tight">{formatCurrency(filteredData.totalSales, storeSettings)}</div>
                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-2 uppercase tracking-widest opacity-80">Subject to Tax</div>
                </div>

                <div glass-effect="" className="rounded-2xl border border-emerald-200/50 dark:border-emerald-500/20 p-5 md:p-6 !bg-emerald-50/50 dark:!bg-emerald-900/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-white dark:bg-emerald-900/40 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                            <BanknotesIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-100/50 dark:bg-emerald-500/20 px-2 py-1 rounded-lg">Tax Collected</span>
                    </div>
                    <div className="text-xl md:text-2xl font-black text-emerald-900 dark:text-emerald-50 tracking-tight">{formatCurrency(filteredData.totalTax, storeSettings)}</div>
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-2 uppercase tracking-widest opacity-80">At {taxRate}% tax rate</div>
                </div>

                <div glass-effect="" className="rounded-2xl border border-purple-200/50 dark:border-purple-500/20 p-5 md:p-6 !bg-purple-50/50 dark:!bg-purple-900/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-white dark:bg-purple-900/40 rounded-xl shadow-sm border border-purple-100 dark:border-purple-500/20">
                            <ReceiptPercentIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest bg-purple-100/50 dark:bg-purple-500/20 px-2 py-1 rounded-lg">Transactions</span>
                    </div>
                    <div className="text-xl md:text-2xl font-black text-purple-900 dark:text-purple-50 tracking-tight">{filteredData.numberOfTransactions}</div>
                    <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-2 uppercase tracking-widest opacity-80">Total Count</div>
                </div>

                <div glass-effect="" className="rounded-2xl border border-slate-200/50 dark:border-slate-800 p-5 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <CalculatorIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">Avg Transaction</span>
                    </div>
                    <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(filteredData.averageTransaction, storeSettings)}</div>
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest opacity-80">Inc. Tax</div>
                </div>
            </div>

            {/* Tax Calculation Details */}
            <div glass-effect="" className="rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <CalculatorIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">Tax Calculation Breakdown</h3>
                    </div>
                </div>
                <div className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                            <div className="text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 mb-2">Taxable Sales</div>
                            <div className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(filteredData.totalSales, storeSettings)}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-500 mt-2 font-bold uppercase tracking-tighter">Base amount</div>
                        </div>

                        <div className="p-5 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-900/40 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                            <div className="text-[10px] uppercase tracking-widest font-black text-blue-700 dark:text-blue-400 mb-2">Tax Collected</div>
                            <div className="text-xl font-black text-blue-900 dark:text-blue-50 tracking-tight">{formatCurrency(filteredData.totalTax, storeSettings)}</div>
                            <div className="text-[10px] text-blue-600 dark:text-blue-400/60 mt-2 font-bold uppercase tracking-tighter">To be remitted ({taxRate}%)</div>
                        </div>

                        <div className="p-5 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/40 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                            <div className="text-[10px] uppercase tracking-widest font-black text-emerald-700 dark:text-emerald-400 mb-2">Total inclusive</div>
                            <div className="text-xl font-black text-emerald-900 dark:text-emerald-50 tracking-tight">
                                {formatCurrency(filteredData.totalSales + filteredData.totalTax, storeSettings)}
                            </div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400/60 mt-2 font-bold uppercase tracking-tighter">Sum of sales and tax</div>
                        </div>
                    </div>

                    <div className="mt-6 p-5 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200/50 dark:border-slate-800 border-dashed">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                <InformationCircleIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                    This report summarizes the total sales tax collected at the rate of <span className="font-black text-slate-900 dark:text-white px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700 mx-1">{taxRate}%</span> for the selected period.
                                    The tax amount of <span className="font-black text-blue-600 dark:text-blue-400">{formatCurrency(filteredData.totalTax, storeSettings)}</span> should be remitted to the relevant tax authorities.
                                </p>
                                <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                    Simplified report based on a single tax rate
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxReportView;
