import React from 'react';
import { Sale, StoreSettings } from '../../types';
import UnifiedListGrid from '../ui/UnifiedListGrid';
import { StandardCard, StandardRow } from '../ui/standard';
import { formatCurrency } from '../../utils/currency';
import { toneClass, fulfillmentMeta, paymentMeta } from '../ui/StatusPill';

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
                        <div className="w-full h-full bg-surface-variant text-brand-text-muted flex items-center justify-center font-bold text-xs group-hover:bg-sp-navy-soft group-hover:text-sp-navy transition-colors active:scale-95 duration-300">
                            #{order.transactionId.slice(-4)}
                        </div>
                    }
                    status={
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${toneClass(fulfillmentMeta(order.fulfillmentStatus).tone)}`}>
                            {order.fulfillmentStatus?.replace('_', ' ') || 'pending'}
                        </span>
                    }
                    primaryInfo={formatCurrency(order.total, storeSettings)}
                    secondaryInfo={
                        <div className="text-xs text-brand-text-muted font-medium">
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
                        <div className="w-10 h-10 rounded-lg bg-surface-variant text-brand-text-muted flex items-center justify-center font-bold text-xs group-hover:bg-sp-navy-soft group-hover:text-sp-navy transition-colors shrink-0 active:scale-95 duration-300">
                            #{order.transactionId.slice(-4)}
                        </div>
                    }
                    status={
                        <div className="flex flex-col sm:flex-row gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider w-fit ${toneClass(fulfillmentMeta(order.fulfillmentStatus).tone)}`}>
                                {order.fulfillmentStatus?.replace('_', ' ') || 'pending'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider w-fit ${toneClass(paymentMeta(order.paymentStatus).tone)}`}>
                                {order.paymentStatus?.replace('_', ' ') || 'pending'}
                            </span>
                        </div>
                    }
                    primaryMeta={formatCurrency(order.total, storeSettings)}
                    details={[
                        <span className="text-xs text-brand-text-muted font-medium" key="items">
                            {order.cart.length} items
                        </span>
                    ]}
                />
            )}
        />
    );
};

export default OrdersList;
