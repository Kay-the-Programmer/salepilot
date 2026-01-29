import React from 'react';
import { OnboardingTaskList } from './OnboardingTaskList';
import { AiSummaryCard } from './AiSummaryCard';
import { FilterableStatCard } from './FilterableStatCard';
import { FilterableRevenueChart } from './FilterableRevenueChart';
import { FilterableSalesChannelChart } from './FilterableSalesChannelChart';
import { FilterableTopSales } from './FilterableTopSales';
import { formatCurrency } from '../../utils/currency';
import { StoreSettings } from '../../types';
import CurrencyDollarIcon from '../icons/CurrencyDollarIcon';
import ShoppingCartIcon from '../icons/ShoppingCartIcon';
import UsersIcon from '../icons/UsersIcon';
import DocumentTextIcon from '../icons/DocumentTextIcon';

interface OverviewTabProps {
    reportData: any;
    storeSettings: StoreSettings;
    userName?: string;
    recentOrdersTab: 'all' | 'online' | 'pos';
    setRecentOrdersTab: (tab: 'all' | 'online' | 'pos') => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
    reportData,
    storeSettings,
    userName,
    recentOrdersTab,
    setRecentOrdersTab,
}) => {
    const sales = reportData.sales;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Onboarding Task List for new users */}
            <OnboardingTaskList
                stats={{
                    totalUnits: reportData.inventory.totalUnits,
                    totalSuppliers: reportData.customers.totalSuppliers,
                    totalCustomers: reportData.customers.totalCustomers,
                }}
            />

            {/* AI Summary Card */}
            <AiSummaryCard reportData={reportData} storeSettings={storeSettings} userName={userName} />

            <>
                {/* Row 1: Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Earnings */}
                    <FilterableStatCard
                        title="Total Earnings"
                        type="revenue"
                        icon={<CurrencyDollarIcon className="w-5 h-5 text-emerald-600" />}
                        color="bg-emerald-100"
                        sparklineColor="#10b981"
                        storeSettings={storeSettings}
                    />

                    {/* Card 2: Total Orders */}
                    <FilterableStatCard
                        title="Total Orders"
                        type="orders"
                        icon={<ShoppingCartIcon className="w-5 h-5 text-orange-600" />}
                        color="bg-orange-100"
                        sparklineColor="#f97316"
                        storeSettings={storeSettings}
                    />

                    {/* Card 3: Customers */}
                    <FilterableStatCard
                        title="Customers"
                        type="customers"
                        icon={<UsersIcon className="w-5 h-5 text-indigo-600" />}
                        color="bg-indigo-100"
                        sparklineColor="#6366f1"
                        storeSettings={storeSettings}
                    />

                    {/* Card 4: Net Profit */}
                    <FilterableStatCard
                        title="Net Profit"
                        type="profit"
                        icon={<DocumentTextIcon className="w-5 h-5 text-blue-600" />}
                        color="bg-blue-100"
                        sparklineColor="#3b82f6"
                        storeSettings={storeSettings}
                    />
                </div>

                {/* Row 2: Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <FilterableRevenueChart storeSettings={storeSettings} />
                    <FilterableSalesChannelChart totalRevenue={sales.totalRevenue} />
                </div>

                {/* Row 3: Recent Orders & Top Sales */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Recent Orders - 2 Cols */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 text-lg">Recent Orders</h3>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {(['all', 'online', 'pos'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setRecentOrdersTab(tab)}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${recentOrdersTab === tab
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        {tab === 'all' ? 'All' : tab === 'online' ? 'Online' : 'In-Store'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product ID</th>
                                        <th className="py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                        <th className="py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                        <th className="py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {reportData.sales.recentOrders
                                        ?.filter((order: any) => recentOrdersTab === 'all' || order.channel === recentOrdersTab)
                                        .slice(0, 5)
                                        .map((order: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-3 text-sm text-slate-600 font-medium truncate max-w-[100px]" title={order.transactionId}>
                                                    #{order.transactionId.substring(0, 8)}...
                                                </td>
                                                <td className="py-3 text-sm text-slate-900 flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                        {(order.customerName || 'W').charAt(0)}
                                                    </div>
                                                    {order.customerName || 'Walk-in Customer'}
                                                </td>
                                                <td className="py-3 text-sm text-slate-900 font-bold">
                                                    {formatCurrency(order.total, storeSettings)}
                                                </td>
                                                <td className="py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    {(!reportData.sales.recentOrders || reportData.sales.recentOrders
                                        .filter((order: any) => recentOrdersTab === 'all' || order.channel === recentOrdersTab).length === 0) && (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-slate-400">
                                                    No recent {recentOrdersTab === 'all' ? '' : recentOrdersTab === 'online' ? 'online' : 'in-store'} orders found
                                                </td>
                                            </tr>
                                        )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Top Sale - 1 Col */}
                    <FilterableTopSales storeSettings={storeSettings} />
                </div>
            </>
        </div>
    );
};
