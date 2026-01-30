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
            background: #f1f5f9;
            border-radius: 10px;
        }
        .premium-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        .premium-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
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
                className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/70 backdrop-blur-sm transition-all duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-white w-full sm:max-w-6xl max-h-[96vh] sm:h-[90vh] sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up border border-slate-100">

                {/* Header */}
                <div className="px-6 py-5 sm:px-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white to-slate-50/50 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-50 rounded-xl shadow-sm border border-indigo-100">
                            <HiOutlineShoppingBag className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Order Details</h2>
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200">
                                    #{order.transactionId.slice(-8)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="hidden sm:flex items-center justify-center p-2.5 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all duration-200 border border-transparent hover:border-indigo-100" title="Print Order">
                            <HiOutlinePrinter className="w-5 h-5" />
                        </button>
                        <button className="hidden sm:flex items-center justify-center p-2.5 text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all duration-200 border border-transparent hover:border-slate-200">
                            <HiOutlineEllipsisVertical className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-xl bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all duration-200 border border-slate-200 hover:border-slate-300 shadow-sm ml-2"
                        >
                            <HiOutlineXMark className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto premium-scrollbar p-6 sm:p-8 space-y-8 bg-gradient-to-b from-white to-slate-50/30">
                    <OrderDetailContent order={order} storeSettings={storeSettings} />
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-5 sm:px-8 border-t border-slate-200 bg-gradient-to-r from-white to-slate-50/50 sticky bottom-0 z-20">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="text-sm text-slate-500 font-medium">
                            Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            {order.paymentStatus === 'paid' && (order.fulfillmentStatus === 'shipped' || order.fulfillmentStatus === 'cancelled') ? (
                                <div className="px-6 py-3 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 rounded-xl border border-emerald-200 font-medium flex items-center justify-center gap-2">
                                    <HiOutlineCheckCircle className="w-5 h-5" />
                                    Order Completed
                                </div>
                            ) : (
                                <>
                                    {order.paymentStatus !== 'paid' && onRecordPayment && (
                                        <button
                                            onClick={() => onRecordPayment(order)}
                                            className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all duration-200 flex items-center justify-center gap-2"
                                        >
                                            <HiOutlineBanknotes className="w-5 h-5" />
                                            Record Payment
                                        </button>
                                    )}

                                    {order.fulfillmentStatus === 'pending' && onUpdateStatus && (
                                        <button
                                            onClick={() => onUpdateStatus(order.transactionId, 'fulfilled')}
                                            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-200 flex items-center justify-center gap-2"
                                        >
                                            <HiOutlineCheckCircle className="w-5 h-5" />
                                            Fulfill Order
                                        </button>
                                    )}

                                    {order.fulfillmentStatus === 'fulfilled' && onUpdateStatus && (
                                        <button
                                            onClick={() => onUpdateStatus(order.transactionId, 'shipped')}
                                            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all duration-200 flex items-center justify-center gap-2"
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