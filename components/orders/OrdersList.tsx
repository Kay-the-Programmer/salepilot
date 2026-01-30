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
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'fulfilled': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'shipped': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getPaymentStatusStyles = (status?: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'partially_paid': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
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
                        <div className="w-full h-full bg-slate-50 text-slate-400 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
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
                        <div className="text-xs text-slate-500 font-medium">
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
                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
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
                        <span className="text-xs text-slate-500 font-medium" key="items">
                            {order.cart.length} items
                        </span>
                    ]}
                />
            )}
        />
    );
};

export default OrdersList;
