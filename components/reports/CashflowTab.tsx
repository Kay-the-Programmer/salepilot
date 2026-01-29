import React from 'react';
import { StatCard } from './StatCard';
import { RevenueChart } from './DashboardCharts';
import { formatCurrency } from '../../utils/currency';
import { StoreSettings } from '../../types';
import PlusIcon from '../icons/PlusIcon';
import TrendingUpIcon from '../icons/TrendingUpIcon';
import TrendingDownIcon from '../icons/TrendingDownIcon';
import ScaleIcon from '../icons/ScaleIcon';
import ReceiptPercentIcon from '../icons/ReceiptPercentIcon';

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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Inflow"
                    value={formatCurrency(cashflow.totalInflow, storeSettings)}
                    icon={<TrendingUpIcon className="h-5 w-5 text-green-600" />}
                    color="bg-green-100"
                    tooltip="Total money received by the business (Sales, Payments, etc.)"
                />
                <StatCard
                    title="Total Outflow"
                    value={formatCurrency(cashflow.totalOutflow, storeSettings)}
                    icon={<TrendingDownIcon className="h-5 w-5 text-red-600" />}
                    color="bg-red-100"
                    tooltip="Total money spent by the business (Expenses, Supplier Payments, etc.)"
                />
                <StatCard
                    title="Net Cashflow"
                    value={formatCurrency(cashflow.netCashflow, storeSettings)}
                    icon={<ScaleIcon className={`h-5 w-5 ${cashflow.netCashflow >= 0 ? 'text-blue-600' : 'text-red-600'}`} />}
                    color={cashflow.netCashflow >= 0 ? 'bg-blue-100' : 'bg-red-100'}
                    tooltip="The difference between Total Inflow and Total Outflow. Positive means more money came in than went out."
                />
                <StatCard
                    title="Efficiency"
                    value={cashflow.totalInflow > 0 ? `${((cashflow.netCashflow / cashflow.totalInflow) * 100).toFixed(1)}%` : '0%'}
                    icon={<ReceiptPercentIcon className="h-5 w-5 text-purple-600" />}
                    color="bg-purple-100"
                    tooltip="Percentage of Inflow that remains after all Outflows. (Net Cashflow / Total Inflow)"
                />
            </div>

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
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider text-slate-400">Where is the money going?</h3>
                        <div className="space-y-4">
                            {(cashflow.outflowBreakdown || []).slice(0, 5).map((item: any, i: number) => (
                                <div key={i} className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700">{item.category}</span>
                                        <span className="text-sm font-bold text-slate-900">{formatCurrency(item.amount, storeSettings)}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-red-500 h-full rounded-full"
                                            style={{ width: `${Math.min(100, (item.amount / (cashflow.totalOutflow || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {(!cashflow.outflowBreakdown || cashflow.outflowBreakdown.length === 0) && (
                                <div className="text-center py-6 text-slate-400">
                                    <ScaleIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">No outflow data recorded</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                        <h3 className="font-bold text-lg mb-1">Financial Position</h3>
                        <p className="text-blue-100 text-xs mb-4">Current performance insight</p>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${cashflow.netCashflow >= 0 ? 'bg-green-400/20' : 'bg-red-400/20'}`}>
                                <ScaleIcon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-sm font-medium leading-tight">
                                Your net cashflow is <span className="font-bold underlineDecoration decoration-2">{cashflow.netCashflow >= 0 ? 'positive' : 'negative'}</span>.
                                {cashflow.netCashflow >= 0 ? ' Great job maintaining surplus!' : ' Consider reviewing upcoming expenses.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
