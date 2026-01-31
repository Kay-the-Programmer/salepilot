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
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Sales Tax Report</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track and report sales tax collections</p>
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
                            className="w-full sm:w-auto pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-700 dark:text-slate-300"
                        />
                    </div>
                    <span className="hidden sm:block text-slate-400 dark:text-slate-600 px-1">-</span>
                    <div className="relative group flex-1 sm:flex-none">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <CalendarDaysIcon className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full sm:w-auto pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-700 dark:text-slate-300"
                        />
                    </div>
                </div>
            </div>

            {/* Tax Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-widest">Taxable Sales</div>
                        <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 opacity-60" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(filteredData.totalSales, storeSettings)}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Subject to Tax</div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Tax Collected</div>
                        <BanknotesIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 opacity-60" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(filteredData.totalTax, storeSettings)}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">At {taxRate}% tax rate</div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-widest">Transactions</div>
                        <ReceiptPercentIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 opacity-60" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{filteredData.numberOfTransactions}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Count</div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">Avg Transaction</div>
                        <CalculatorIcon className="w-5 h-5 text-slate-500 dark:text-slate-400 opacity-60" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(filteredData.averageTransaction, storeSettings)}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Inc. Tax</div>
                </div>
            </div>

            {/* Tax Calculation Details */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        <CalculatorIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Tax Calculation Breakdown</h3>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Taxable Sales</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">{formatCurrency(filteredData.totalSales, storeSettings)}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Base amount</div>
                        </div>

                        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30">
                            <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Tax Collected</div>
                            <div className="text-lg font-bold text-blue-900 dark:text-blue-100 tracking-tight">{formatCurrency(filteredData.totalTax, storeSettings)}</div>
                            <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">To be remitted ({taxRate}%)</div>
                        </div>

                        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Total inclusive</div>
                            <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100 tracking-tight">
                                {formatCurrency(filteredData.totalSales + filteredData.totalTax, storeSettings)}
                            </div>
                            <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">Sum of sales and tax</div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-800 border-dashed">
                        <div className="flex items-start gap-3">
                            <InformationCircleIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-0.5" />
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    This report summarizes the total sales tax collected at the rate of <span className="font-semibold text-slate-900 dark:text-slate-100">{taxRate}%</span> for the selected period.
                                    The tax amount of <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(filteredData.totalTax, storeSettings)}</span> should be remitted to the relevant tax authorities.
                                </p>
                                <div className="mt-2 text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
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
