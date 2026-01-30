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
                        {recentOrders
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
