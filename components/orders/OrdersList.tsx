import React from 'react';
import { Sale, StoreSettings } from '../../types';
import UnifiedListGrid from '../ui/UnifiedListGrid';
import { StandardCard, StandardRow } from '../ui/standard';
import { formatCurrency } from '../../utils/currency';

interface OrdersListProps {
    orders: Sale[];
    viewMode: 'grid' | 'list';
    loading: boolean;
    onOrderClick: (order: Sale) => void;
    storeSettings: StoreSettings;
    selectedOrderId?: string;
}

const OrdersList: React.FC<OrdersListProps> = ({
    orders,
    viewMode,
    loading,
    onOrderClick,
    storeSettings,
    selectedOrderId
}) => {
    const getStatusStyles = (status?: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/30';
            case 'fulfilled': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30';
            case 'shipped': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/30';
            case 'cancelled': return 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/30';
            default: return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    const getPaymentStatusStyles = (status?: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30';
            case 'pending': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/30';
            case 'partially_paid': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/30';
            default: return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    return (
        <UnifiedListGrid<Sale>
            items={orders}
            viewMode={viewMode}
            isLoading={loading}
            emptyMessage="No orders found"
            getItemId={(order) => order.transactionId}
            onItemClick={onOrderClick}
            selectedId={selectedOrderId}
            renderGridItem={(order, _index, isSelected) => (
                <StandardCard
                    title={order.customerDetails?.name || order.customerName || 'Guest'}
                    subtitle={`${new Date(order.timestamp).toLocaleDateString()} • ${new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    isSelected={isSelected}
                    onClick={() => onOrderClick(order)}
                    image={
                        <div className="w-full h-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors active:scale-95 transition-all duration-300">
                            #{order.transactionId.slice(-4)}
                        </div>
                    }
                    status={
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(order.fulfillmentStatus)}`}>
                            {order.fulfillmentStatus?.replace('_', ' ') || 'pending'}
                        </span>
                    }
                    primaryInfo={formatCurrency(order.total, storeSettings)}
                    secondaryInfo={
                        <div className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                            {order.cart.length} items
                        </div>
                    }
                />
            )}
            renderListItem={(order, _index, isSelected) => (
                <StandardRow
                    title={order.customerDetails?.name || order.customerName || 'Guest'}
                    subtitle={`${new Date(order.timestamp).toLocaleDateString()} • ${new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    isSelected={isSelected}
                    onClick={() => onOrderClick(order)}
                    leading={
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0 active:scale-95 transition-all duration-300">
                            #{order.transactionId.slice(-4)}
                        </div>
                    }
                    status={
                        <div className="flex flex-col sm:flex-row gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border w-fit ${getStatusStyles(order.fulfillmentStatus)}`}>
                                {order.fulfillmentStatus?.replace('_', ' ') || 'pending'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border w-fit ${getPaymentStatusStyles(order.paymentStatus)}`}>
                                {order.paymentStatus?.replace('_', ' ') || 'pending'}
                            </span>
                        </div>
                    }
                    primaryMeta={formatCurrency(order.total, storeSettings)}
                    details={[
                        <span className="text-xs text-slate-500 dark:text-slate-500 font-medium" key="items">
                            {order.cart.length} items
                        </span>
                    ]}
                />
            )}
        />
    );
};

export default OrdersList;
