import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sale, StoreSettings } from '../../types';
import {
    HiOutlineXMark,
    HiOutlinePrinter,
    HiOutlineEllipsisVertical,
    HiOutlineTruck,
    HiOutlineCurrencyDollar,
    HiOutlineUser,
    HiOutlineBanknotes,
    HiOutlineCheckCircle,
    HiOutlineShoppingBag,
    HiOutlineMapPin,
    HiOutlineCalendar,
    HiOutlineCreditCard
} from 'react-icons/hi2';
import { formatCurrency } from '../../utils/currency';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    orders: Sale[];
    order: Sale | null;
    storeSettings: StoreSettings;
    onRecordPayment: (order: Sale) => void;
    onUpdateStatus: (orderId: string, status: NonNullable<Sale['fulfillmentStatus']>) => void;
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

    const formatStatusString = (status?: string) => {
        if (!status) return 'Unknown';
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const paymentProgress = Math.min(100, (Number(order.amountPaid || 0) / Number(order.total)) * 100);
    const remainingAmount = Number(order.total) - Number(order.amountPaid || 0);

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
                                <h2 className="text-2xl font-bold text-slate-900">Order Details</h2>
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200">
                                    #{order.transactionId.slice(-8)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <HiOutlineCalendar className="w-4 h-4" />
                                <span className="font-medium">{new Date(order.timestamp).toLocaleString()}</span>
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

                    {/* Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <div className={`p-5 rounded-2xl border-2 ${getStatusStyles(order.fulfillmentStatus)} flex items-center gap-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200`}>
                            <div className="p-3 rounded-xl bg-white/50 border border-slate-100 shadow-sm">
                                <HiOutlineTruck className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs uppercase font-bold tracking-widest text-slate-500 mb-1">Fulfillment Status</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-lg font-bold">{formatStatusString(order.fulfillmentStatus || 'Pending')}</p>
                                    <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border">
                                        {order.fulfillmentStatus === 'fulfilled' ? 'Ready' : 'Processing'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={`p-5 rounded-2xl border-2 ${getPaymentStatusStyles(order.paymentStatus)} flex items-center gap-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200`}>
                            <div className="p-3 rounded-xl bg-white/50 border border-slate-100 shadow-sm">
                                <HiOutlineCurrencyDollar className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs uppercase font-bold tracking-widest text-slate-500 mb-1">Payment Status</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-lg font-bold">{formatStatusString(order.paymentStatus || 'Pending')}</p>
                                    <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border">
                                        {order.paymentStatus === 'paid' ? 'Completed' : 'Pending'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                        {/* Main Info Column */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Items Section */}
                            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                        Ordered Items ({order.cart.length})
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {order.cart.map((item, idx) => (
                                        <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors duration-150">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl flex items-center justify-center font-bold text-sm text-indigo-700 border border-indigo-100 shadow-sm">
                                                    {item.quantity}x
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-base font-bold text-slate-900 truncate mb-1">{item.name}</p>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-xs text-slate-500 font-medium">SKU: {item.sku || 'N/A'}</p>
                                                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                                                            {formatCurrency(Number(item.price), storeSettings)} each
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-base font-bold text-slate-900">
                                                    {formatCurrency(Number(item.price) * (item.quantity || 1), storeSettings)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-t border-slate-100 space-y-3">
                                    <div className="flex justify-between items-center text-sm text-slate-600">
                                        <span>Subtotal</span>
                                        <span className="font-medium">{formatCurrency(order.total, storeSettings)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-base font-bold text-slate-900 pt-3 border-t border-slate-200">
                                        <span>Total Amount</span>
                                        <span className="text-lg">{formatCurrency(order.total, storeSettings)}</span>
                                    </div>
                                </div>
                            </section>

                            {/* Payment Progress Section */}
                            <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white overflow-hidden relative shadow-xl">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl -mr-24 -mt-24"></div>
                                <div className="relative z-10 p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <HiOutlineCreditCard className="w-5 h-5 text-slate-400" />
                                                <h4 className="text-xs uppercase font-bold tracking-widest text-slate-400">Payment Progress</h4>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-bold">{formatCurrency(order.amountPaid || 0, storeSettings)}</span>
                                                <span className="text-slate-400">/ {formatCurrency(order.total, storeSettings)}</span>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border ${order.paymentStatus === 'paid' 
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                                            {formatStatusString(order.paymentStatus)}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ${order.paymentStatus === 'paid' 
                                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' 
                                                    : 'bg-gradient-to-r from-amber-400 to-amber-500'}`}
                                                style={{ width: `${paymentProgress}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2">
                                            <span className="text-xs text-slate-400">0%</span>
                                            <span className="text-xs font-medium">{paymentProgress.toFixed(0)}%</span>
                                            <span className="text-xs text-slate-400">100%</span>
                                        </div>
                                    </div>

                                    {order.paymentStatus !== 'paid' && (
                                        <div className="pt-4 border-t border-slate-700/50">
                                            <p className="text-sm text-slate-300">
                                                <span className="font-bold">Remaining:</span>{' '}
                                                <span className="text-amber-300 font-bold">{formatCurrency(remainingAmount, storeSettings)}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar Info Column */}
                        <div className="space-y-6">
                            {/* Customer Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                        Customer Information
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100">
                                            <HiOutlineUser className="w-7 h-7 text-emerald-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 text-lg truncate mb-1">
                                                {order.customerDetails?.name || order.customerName || 'Guest Customer'}
                                            </p>
                                            <p className="text-sm text-slate-500 truncate">{order.customerDetails?.email || 'No email provided'}</p>
                                            <p className="text-sm text-slate-500 mt-1">{order.customerDetails?.phone || 'No phone provided'}</p>
                                        </div>
                                    </div>

                                    {order.customerDetails?.address && (
                                        <div className="pt-5 border-t border-slate-100">
                                            <div className="flex items-center gap-2 mb-3">
                                                <HiOutlineMapPin className="w-4 h-4 text-slate-400" />
                                                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500">Delivery Address</h4>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                {order.customerDetails.address}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-sm p-6">
                                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                    Order Summary
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">Items Total</span>
                                        <span className="font-medium text-slate-900">{formatCurrency(order.total, storeSettings)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">Tax & Fees</span>
                                        <span className="font-medium text-slate-900">{formatCurrency(0, storeSettings)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">Shipping</span>
                                        <span className="font-medium text-slate-900">{formatCurrency(0, storeSettings)}</span>
                                    </div>
                                    <div className="pt-3 border-t border-blue-200/50">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-900">Total Paid</span>
                                            <span className="text-lg font-bold text-blue-700">{formatCurrency(order.total, storeSettings)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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
                                    {order.paymentStatus !== 'paid' && (
                                        <button
                                            onClick={() => onRecordPayment(order)}
                                            className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all duration-200 flex items-center justify-center gap-2"
                                        >
                                            <HiOutlineBanknotes className="w-5 h-5" />
                                            Record Payment
                                        </button>
                                    )}
                                    
                                    {order.fulfillmentStatus === 'pending' && (
                                        <button
                                            onClick={() => onUpdateStatus(order.transactionId, 'fulfilled')}
                                            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-200 flex items-center justify-center gap-2"
                                        >
                                            <HiOutlineCheckCircle className="w-5 h-5" />
                                            Fulfill Order
                                        </button>
                                    )}
                                    
                                    {order.fulfillmentStatus === 'fulfilled' && (
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