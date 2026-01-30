import React from 'react';
import { Sale, StoreSettings } from '../../types';
import {
    HiOutlineTruck,
    HiOutlineCurrencyDollar,
    HiOutlineUser,
    HiOutlineMapPin,
    HiOutlineCreditCard,
    HiOutlineCalendar
} from 'react-icons/hi2';
import { formatCurrency } from '../../utils/currency';

interface OrderDetailContentProps {
    order: Sale;
    storeSettings: StoreSettings;
}

const OrderDetailContent: React.FC<OrderDetailContentProps> = ({ order, storeSettings }) => {
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

    return (
        <div className="space-y-8">
            {/* ID and Date - Shown in sideview but redundant in modal header, keeping for consistency in content flow */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <HiOutlineCalendar className="w-4 h-4" />
                    <span className="font-medium">{new Date(order.timestamp).toLocaleString()}</span>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-5 rounded-2xl border-2 ${getStatusStyles(order.fulfillmentStatus)} flex items-center gap-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200`}>
                    <div className="p-3 rounded-xl bg-white/50 border border-slate-100 shadow-sm">
                        <HiOutlineTruck className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs uppercase font-bold tracking-widest text-slate-500 mb-1">Fulfillment</p>
                        <div className="flex items-center justify-between">
                            <p className="text-lg font-bold">{formatStatusString(order.fulfillmentStatus || 'Pending')}</p>
                        </div>
                    </div>
                </div>
                <div className={`p-5 rounded-2xl border-2 ${getPaymentStatusStyles(order.paymentStatus)} flex items-center gap-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200`}>
                    <div className="p-3 rounded-xl bg-white/50 border border-slate-100 shadow-sm">
                        <HiOutlineCurrencyDollar className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs uppercase font-bold tracking-widest text-slate-500 mb-1">Payment</p>
                        <div className="flex items-center justify-between">
                            <p className="text-lg font-bold">{formatStatusString(order.paymentStatus || 'Pending')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
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
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl flex items-center justify-center font-bold text-xs text-indigo-700 border border-indigo-100 shadow-sm shrink-0">
                                        {item.quantity}x
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate mb-0.5">{item.name}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">
                                            {formatCurrency(Number(item.price), storeSettings)} each
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right whitespace-nowrap ml-4">
                                    <p className="text-sm font-bold text-slate-900">
                                        {formatCurrency(Number(item.price) * (item.quantity || 1), storeSettings)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-t border-slate-100 space-y-2">
                        <div className="flex justify-between items-center text-xs text-slate-600">
                            <span>Subtotal</span>
                            <span className="font-medium">{formatCurrency(order.subtotal, storeSettings)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-600">
                            <span>Tax</span>
                            <span className="font-medium">{formatCurrency(order.tax, storeSettings)}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between items-center text-xs text-green-600">
                                <span>Discount</span>
                                <span className="font-medium">-{formatCurrency(order.discount, storeSettings)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                            <span>Total</span>
                            <span className="text-base">{formatCurrency(order.total, storeSettings)}</span>
                        </div>
                    </div>
                </section>

                {/* Customer Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            Customer info
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center shadow-sm border border-emerald-100 shrink-0">
                                <HiOutlineUser className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-base truncate mb-0.5">
                                    {order.customerDetails?.name || order.customerName || 'Guest Customer'}
                                </p>
                                <p className="text-xs text-slate-500 truncate">{order.customerDetails?.email || 'No email'}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{order.customerDetails?.phone || 'No phone'}</p>
                            </div>
                        </div>

                        {order.customerDetails?.address && (
                            <div className="pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <HiOutlineMapPin className="w-3.5 h-3.5 text-slate-400" />
                                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Address</h4>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    {order.customerDetails.address}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Progress Section */}
                <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white overflow-hidden relative shadow-lg">
                    <div className="relative z-10 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <HiOutlineCreditCard className="w-4 h-4 text-slate-400" />
                                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Payment Progress</h4>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-bold">{formatCurrency(order.amountPaid || 0, storeSettings)}</span>
                                    <span className="text-xs text-slate-400">/ {formatCurrency(order.total, storeSettings)}</span>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${order.paymentStatus === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                                {formatStatusString(order.paymentStatus)}
                            </div>
                        </div>

                        <div className="mb-2">
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${order.paymentStatus === 'paid'
                                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                        : 'bg-gradient-to-r from-amber-400 to-amber-500'}`}
                                    style={{ width: `${paymentProgress}%` }}
                                />
                            </div>
                        </div>

                        {order.paymentStatus !== 'paid' && (
                            <div className="pt-3 border-t border-slate-700/50">
                                <p className="text-xs text-slate-300">
                                    <span className="font-bold">Remaining:</span>{' '}
                                    <span className="text-amber-300 font-bold">{formatCurrency(remainingAmount, storeSettings)}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default OrderDetailContent;
