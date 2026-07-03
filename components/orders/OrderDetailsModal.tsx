import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sale, StoreSettings } from '../../types';
import {
    HiOutlineXMark,
    HiOutlinePrinter,
    HiOutlineEllipsisVertical,
    HiOutlineCheckCircle,
    HiOutlineShoppingBag,
    HiOutlineBanknotes,
    HiOutlineTruck
} from 'react-icons/hi2';
import OrderDetailContent from './OrderDetailContent';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    orders: Sale[];
    order: Sale | null;
    storeSettings: StoreSettings;
    onRecordPayment?: (order: Sale) => void;
    onUpdateStatus?: (orderId: string, status: NonNullable<Sale['fulfillmentStatus']>) => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
    isOpen,
    onClose,
    order,
    storeSettings,
    onRecordPayment,
    onUpdateStatus
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !order) return null;

    const styles = `
        .premium-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .premium-scrollbar::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 10px;
        }
        .premium-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        .premium-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
        .dark .premium-scrollbar::-webkit-scrollbar-thumb {
            background: #334155;
        }
        .dark .premium-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #475569;
        }
        
        @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-slide-up {
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-fade-in {
            animation: fadeIn 0.2s ease-out 0.1s both;
        }
    `;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <style>{styles}</style>

            {/* Backdrop — 20% black + blur per the Velocity overlay spec */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-all duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-surface w-full sm:max-w-6xl max-h-[96vh] sm:h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col animate-slide-up border border-brand-border shadow-xl">

                {/* Header */}
                <div className="px-6 py-5 sm:px-8 border-b border-brand-border flex items-center justify-between bg-surface sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-sp-navy-soft rounded-lg shadow-sm border border-brand-border">
                            <HiOutlineShoppingBag className="w-6 h-6 text-sp-navy" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-brand-text">Order Details</h2>
                                <span className="px-2.5 py-1 bg-surface-variant text-brand-text-muted text-xs font-black rounded-full border border-brand-border uppercase tracking-widest">
                                    #{order.transactionId.slice(-8)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="hidden sm:flex items-center justify-center p-2.5 text-brand-text-muted hover:text-sp-navy rounded-lg hover:bg-sp-navy-soft transition-all duration-200 border border-transparent hover:border-brand-border active:scale-95" title="Print Order">
                            <HiOutlinePrinter className="w-5 h-5" />
                        </button>
                        <button className="hidden sm:flex items-center justify-center p-2.5 text-brand-text-muted hover:text-brand-text rounded-lg hover:bg-surface-variant transition-all duration-200 border border-transparent hover:border-brand-border active:scale-95">
                            <HiOutlineEllipsisVertical className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-lg bg-surface text-brand-text-muted hover:text-brand-text hover:bg-surface-variant transition-all duration-200 border border-brand-border shadow-sm ml-2 active:scale-95"
                        >
                            <HiOutlineXMark className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto premium-scrollbar p-6 sm:p-8 space-y-8 bg-background">
                    <OrderDetailContent order={order} storeSettings={storeSettings} />
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-5 sm:px-8 border-t border-brand-border bg-surface sticky bottom-0 z-20">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="text-sm text-brand-text-muted font-medium">
                            Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            {order.paymentStatus === 'paid' && (order.fulfillmentStatus === 'shipped' || order.fulfillmentStatus === 'cancelled') ? (
                                <div className="px-6 py-3 bg-success-muted text-success rounded-lg border border-success/30 font-bold flex items-center justify-center gap-2">
                                    <HiOutlineCheckCircle className="w-5 h-5" />
                                    Order Completed
                                </div>
                            ) : (
                                <>
                                    {order.paymentStatus !== 'paid' && onRecordPayment && (
                                        <button
                                            onClick={() => onRecordPayment(order)}
                                            className="px-6 py-3.5 bg-sp-orange hover:bg-sp-orange-light text-white rounded-lg font-black uppercase tracking-widest text-[11px] shadow-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <HiOutlineBanknotes className="w-5 h-5" />
                                            Record Payment
                                        </button>
                                    )}

                                    {order.fulfillmentStatus === 'pending' && onUpdateStatus && (
                                        <button
                                            onClick={() => onUpdateStatus(order.transactionId, 'fulfilled')}
                                            className="px-6 py-3.5 bg-sp-navy hover:bg-sp-navy-light text-white rounded-lg font-black uppercase tracking-widest text-[11px] shadow-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <HiOutlineCheckCircle className="w-5 h-5" />
                                            Fulfill Order
                                        </button>
                                    )}

                                    {order.fulfillmentStatus === 'fulfilled' && onUpdateStatus && (
                                        <button
                                            onClick={() => onUpdateStatus(order.transactionId, 'shipped')}
                                            className="px-6 py-3.5 bg-sp-navy hover:bg-sp-navy-light text-white rounded-lg font-black uppercase tracking-widest text-[11px] shadow-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <HiOutlineTruck className="w-5 h-5" />
                                            Mark Shipped
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default OrderDetailsModal;