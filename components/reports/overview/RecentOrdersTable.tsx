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
        <div className="dashboard-card h-full">
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-brand-text text-lg tracking-tight">Recent Orders</h3>
                    <div className="flex bg-surface-variant p-1 rounded-lg">
                        {(['all', 'online', 'pos'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setRecentOrdersTab(tab)}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${recentOrdersTab === tab
                                    ? 'bg-sp-navy text-white shadow-sm'
                                    : 'text-brand-text-muted hover:text-brand-text'
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
                            <tr className="border-b border-brand-border">
                                <th className="py-2 text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">Order</th>
                                <th className="py-2 text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">Customer</th>
                                <th className="py-2 text-[10px] font-bold text-brand-text-muted uppercase tracking-wider text-right">Amount</th>
                                <th className="py-2 text-[10px] font-bold text-brand-text-muted uppercase tracking-wider text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {recentOrders
                                ?.filter((order: any) => recentOrdersTab === 'all' || order.channel === recentOrdersTab)
                                .slice(0, 5)
                                .map((order: any, i: number) => (
                                    <tr key={i} className="hover:bg-surface-variant/40 transition-colors">
                                        <td className="py-3 text-sm text-brand-text-muted font-medium truncate max-w-[100px]" title={order.transactionId}>
                                            #{order.transactionId.substring(0, 8)}
                                        </td>
                                        <td className="py-3 text-sm text-brand-text">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-sp-navy-soft flex items-center justify-center text-[11px] font-bold text-sp-navy flex-shrink-0">
                                                    {(order.customerName || 'W').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="truncate">{order.customerName || 'Walk-in Customer'}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-sm text-brand-text font-bold text-right tnum">
                                            {formatCurrency(order.total, storeSettings)}
                                        </td>
                                        <td className="py-3 text-right">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${order.paymentStatus === 'paid' ? 'bg-success/15 text-success' : 'bg-sp-orange/15 text-sp-orange'}`}>
                                                {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            {(!recentOrders || recentOrders
                                .filter((order: any) => recentOrdersTab === 'all' || order.channel === recentOrdersTab).length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-sm text-brand-text-muted">
                                            No recent {recentOrdersTab === 'all' ? '' : recentOrdersTab === 'online' ? 'online' : 'in-store'} orders found
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
