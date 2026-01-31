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

            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/70 dark:from-black/90 dark:via-black/80 dark:to-black/85 backdrop-blur-md transition-all duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-white dark:bg-slate-900 w-full sm:max-w-6xl max-h-[96vh] sm:h-[90vh] sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up border border-slate-100 dark:border-slate-800">

                {/* Header */}
                <div className="px-6 py-5 sm:px-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-800/30">
                            <HiOutlineShoppingBag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Order Details</h2>
                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black rounded-full border border-slate-200 dark:border-slate-700 uppercase tracking-widest">
                                    #{order.transactionId.slice(-8)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="hidden sm:flex items-center justify-center p-2.5 text-slate-500 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800/30" title="Print Order">
                            <HiOutlinePrinter className="w-5 h-5" />
                        </button>
                        <button className="hidden sm:flex items-center justify-center p-2.5 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                            <HiOutlineEllipsisVertical className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm ml-2"
                        >
                            <HiOutlineXMark className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto premium-scrollbar p-6 sm:p-8 space-y-8 bg-gradient-to-b from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-950">
                    <OrderDetailContent order={order} storeSettings={storeSettings} />
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-5 sm:px-8 border-t border-slate-200 dark:border-slate-800 bg-gradient-to-r from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 sticky bottom-0 z-20">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="text-sm text-slate-500 dark:text-slate-500 font-medium">
                            Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            {order.paymentStatus === 'paid' && (order.fulfillmentStatus === 'shipped' || order.fulfillmentStatus === 'cancelled') ? (
                                <div className="px-6 py-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/30 font-bold flex items-center justify-center gap-2">
                                    <HiOutlineCheckCircle className="w-5 h-5" />
                                    Order Completed
                                </div>
                            ) : (
                                <>
                                    {order.paymentStatus !== 'paid' && onRecordPayment && (
                                        <button
                                            onClick={() => onRecordPayment(order)}
                                            className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600 hover:from-emerald-700 hover:to-emerald-800 dark:hover:from-emerald-600 dark:hover:to-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 transition-all duration-200 flex items-center justify-center gap-2"
                                        >
                                            <HiOutlineBanknotes className="w-5 h-5" />
                                            Record Payment
                                        </button>
                                    )}

                                    {order.fulfillmentStatus === 'pending' && onUpdateStatus && (
                                        <button
                                            onClick={() => onUpdateStatus(order.transactionId, 'fulfilled')}
                                            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 hover:from-indigo-700 hover:to-indigo-800 dark:hover:from-indigo-600 dark:hover:to-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all duration-200 flex items-center justify-center gap-2"
                                        >
                                            <HiOutlineCheckCircle className="w-5 h-5" />
                                            Fulfill Order
                                        </button>
                                    )}

                                    {order.fulfillmentStatus === 'fulfilled' && onUpdateStatus && (
                                        <button
                                            onClick={() => onUpdateStatus(order.transactionId, 'shipped')}
                                            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all duration-200 flex items-center justify-center gap-2"
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