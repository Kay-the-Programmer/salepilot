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
    const dateInput = "w-full sm:w-auto pl-10 pr-4 py-2.5 rounded-lg text-sm font-medium m3-bg-surface-container m3-text-on-surface border m3-border-outline-variant focus:outline-none focus:ring-2 focus:ring-[color:var(--m3-primary)] focus:border-transparent transition-all";

    return (
        <div className="space-y-6 md:space-y-8 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold m3-text-on-surface tracking-tight">Sales Tax Report</h3>
                    <p className="text-sm m3-text-on-surface-variant mt-1">Track and report sales tax collections</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative group flex-1 sm:flex-none">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <CalendarDaysIcon className="w-4 h-4 m3-text-on-surface-variant" />
                        </div>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className={dateInput}
                        />
                    </div>
                    <span className="hidden sm:block m3-text-on-surface-variant px-1">-</span>
                    <div className="relative group flex-1 sm:flex-none">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <CalendarDaysIcon className="w-4 h-4 m3-text-on-surface-variant" />
                        </div>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className={dateInput}
                        />
                    </div>
                </div>
            </div>

            {/* Tax Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="m3-bg-surface-lowest rounded-2xl p-4 border m3-border-outline-variant shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium m3-text-primary uppercase tracking-widest">Taxable Sales</div>
                        <ArrowTrendingUpIcon className="w-5 h-5 m3-text-primary opacity-70" />
                    </div>
                    <div className="text-2xl font-bold m3-text-on-surface tracking-tight">{formatCurrency(filteredData.totalSales, storeSettings)}</div>
                    <div className="text-xs m3-text-on-surface-variant mt-1">Subject to Tax</div>
                </div>

                <div className="m3-bg-surface-lowest rounded-2xl p-4 border m3-border-outline-variant shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium m3-text-secondary uppercase tracking-widest">Tax Collected</div>
                        <BanknotesIcon className="w-5 h-5 m3-text-secondary opacity-70" />
                    </div>
                    <div className="text-2xl font-bold m3-text-on-surface tracking-tight">{formatCurrency(filteredData.totalTax, storeSettings)}</div>
                    <div className="text-xs m3-text-on-surface-variant mt-1">At {taxRate}% tax rate</div>
                </div>

                <div className="m3-bg-surface-lowest rounded-2xl p-4 border m3-border-outline-variant shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium m3-text-tertiary uppercase tracking-widest">Transactions</div>
                        <ReceiptPercentIcon className="w-5 h-5 m3-text-tertiary opacity-70" />
                    </div>
                    <div className="text-2xl font-bold m3-text-on-surface tracking-tight">{filteredData.numberOfTransactions}</div>
                    <div className="text-xs m3-text-on-surface-variant mt-1">Total Count</div>
                </div>

                <div className="m3-bg-surface-lowest rounded-2xl p-4 border m3-border-outline-variant shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium m3-text-on-surface-variant uppercase tracking-widest">Avg Transaction</div>
                        <CalculatorIcon className="w-5 h-5 m3-text-on-surface-variant opacity-70" />
                    </div>
                    <div className="text-2xl font-bold m3-text-on-surface tracking-tight">{formatCurrency(filteredData.averageTransaction, storeSettings)}</div>
                    <div className="text-xs m3-text-on-surface-variant mt-1">Inc. Tax</div>
                </div>
            </div>

            {/* Tax Calculation Details */}
            <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b m3-border-outline-variant m3-bg-surface-container">
                    <div className="flex items-center gap-2">
                        <CalculatorIcon className="w-5 h-5 m3-text-primary" />
                        <h3 className="text-base font-bold m3-text-on-surface tracking-tight">Tax Calculation Breakdown</h3>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 m3-bg-surface-container rounded-lg border m3-border-outline-variant">
                            <div className="text-xs font-medium m3-text-on-surface-variant mb-1">Taxable Sales</div>
                            <div className="text-lg font-bold m3-text-on-surface tracking-tight">{formatCurrency(filteredData.totalSales, storeSettings)}</div>
                            <div className="text-xs m3-text-on-surface-variant mt-1">Base amount</div>
                        </div>

                        <div className="p-4 m3-bg-primary-fixed rounded-lg">
                            <div className="text-xs font-medium m3-text-primary mb-1">Tax Collected</div>
                            <div className="text-lg font-bold m3-text-primary tracking-tight">{formatCurrency(filteredData.totalTax, storeSettings)}</div>
                            <div className="text-xs m3-text-primary mt-1" style={{ opacity: 0.7 }}>To be remitted ({taxRate}%)</div>
                        </div>

                        <div className="p-4 m3-bg-secondary-fixed rounded-lg">
                            <div className="text-xs font-medium m3-text-secondary mb-1">Total inclusive</div>
                            <div className="text-lg font-bold m3-text-secondary tracking-tight">
                                {formatCurrency(filteredData.totalSales + filteredData.totalTax, storeSettings)}
                            </div>
                            <div className="text-xs m3-text-secondary mt-1" style={{ opacity: 0.7 }}>Sum of sales and tax</div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 m3-bg-surface-container rounded-lg border m3-border-outline-variant border-dashed">
                        <div className="flex items-start gap-3">
                            <InformationCircleIcon className="w-5 h-5 m3-text-on-surface-variant mt-0.5" />
                            <div>
                                <p className="text-sm m3-text-on-surface-variant leading-relaxed">
                                    This report summarizes the total sales tax collected at the rate of <span className="font-semibold m3-text-on-surface">{taxRate}%</span> for the selected period.
                                    The tax amount of <span className="font-semibold m3-text-primary">{formatCurrency(filteredData.totalTax, storeSettings)}</span> should be remitted to the relevant tax authorities.
                                </p>
                                <div className="mt-2 text-xs m3-text-on-surface-variant flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full" style={{ background: 'var(--m3-outline)' }}></div>
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
