import React from 'react';
import { RevenueChart } from './charts/RevenueChart';
import { StoreSettings } from '../../types';
import PlusIcon from '../icons/PlusIcon';
import { CashflowStatsRow } from './cashflow/CashflowStatsRow';
import { OutflowBreakdown } from './cashflow/OutflowBreakdown';
import { FinancialPositionCard } from './cashflow/FinancialPositionCard';

interface CashflowTabProps {
    reportData: any;
    storeSettings: StoreSettings;
    cashflowTrend: any[];
    onClose?: () => void;
}

export const CashflowTab: React.FC<CashflowTabProps> = ({ reportData, storeSettings, cashflowTrend, onClose }) => {
    const cashflow = reportData.cashflow;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h3 className="font-bold text-slate-900 text-lg">Cashflow Summary</h3>
                    <p className="text-xs text-slate-500">Overview of money moving in and out</p>
                </div>
                <button
                    onClick={() => {
                        window.location.hash = '#expenses';
                        if (onClose) onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all active:scale-95"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span className="text-sm font-bold">Record Expense</span>
                </button>
            </div>

            <CashflowStatsRow cashflow={cashflow} storeSettings={storeSettings} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-900 text-lg mb-6">Cashflow Trend</h3>
                    <RevenueChart
                        data={cashflowTrend.map(d => ({ date: new Date(d.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), inflow: d.value1, outflow: d.value2 }))}
                        title="Net Cashflow Trend"
                        barKey="inflow"
                        lineKey="outflow"
                        storeSettings={storeSettings}
                    />
                </div>

                <div className="space-y-6">
                    <OutflowBreakdown
                        outflowBreakdown={cashflow.outflowBreakdown}
                        totalOutflow={cashflow.totalOutflow}
                        storeSettings={storeSettings}
                    />

                    <FinancialPositionCard netCashflow={cashflow.netCashflow} />
                </div>
            </div>
        </div>
    );
};
