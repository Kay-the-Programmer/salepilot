import React from 'react';
import { formatCurrency } from '../../../utils/currency';
import { StoreSettings } from '../../../types';

interface RecentOrdersTableProps {
    recentOrders: any[];
    recentOrdersTab: 'all' | 'online' | 'pos';
    setRecentOrdersTab: (tab: 'all' | 'online' | 'pos') => void;
    storeSettings: StoreSettings;
}

export const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({
    recentOrders,
    recentOrdersTab,
    setRecentOrdersTab,
    storeSettings,
}) => {
    return (
        <div className="liquid-glass-card rounded-[2rem] lg:col-span-2 dark:bg-slate-800 p-5 border border-slate-100 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Recent Orders</h3>
                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-lg">
                    {(['all', 'online', 'pos'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setRecentOrdersTab(tab)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${recentOrdersTab === tab
                                ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white'
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
                            <th className="py-2 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Product ID</th>
                            <th className="py-2 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                            <th className="py-2 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                            <th className="py-2 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                        {recentOrders
                            ?.filter((order: any) => recentOrdersTab === 'all' || order.channel === recentOrdersTab)
                            .slice(0, 5)
                            .map((order: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors active:scale-95 transition-all duration-300">
                                    <td className="py-3 text-sm text-slate-600 dark:text-gray-400 font-medium truncate max-w-[100px]" title={order.transactionId}>
                                        #{order.transactionId.substring(0, 8)}...
                                    </td>
                                    <td className="py-3 text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-gray-400">
                                            {(order.customerName || 'W').charAt(0)}
                                        </div>
                                        {order.customerName || 'Walk-in Customer'}
                                    </td>
                                    <td className="py-3 text-sm text-slate-900 dark:text-white font-bold">
                                        {formatCurrency(order.total, storeSettings)}
                                    </td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        {(!recentOrders || recentOrders
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
    );
};
