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
import { toneClass, fulfillmentMeta, paymentMeta } from '../ui/StatusPill';

interface OrderDetailContentProps {
    order: Sale;
    storeSettings: StoreSettings;
}

const OrderDetailContent: React.FC<OrderDetailContentProps> = ({ order, storeSettings }) => {
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
                <div className="flex items-center gap-2 text-sm text-brand-text-muted">
                    <HiOutlineCalendar className="w-4 h-4" />
                    <span className="font-medium">{new Date(order.timestamp).toLocaleString()}</span>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-1 rounded-lg border border-brand-border ${toneClass(fulfillmentMeta(order.fulfillmentStatus).tone)} flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-200`}>
                    <div className="p-3">
                        <HiOutlineTruck className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs uppercase font-bold tracking-widest text-brand-text-muted mb-1">Fulfillment</p>
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold">{formatStatusString(order.fulfillmentStatus || 'Pending')}</p>
                        </div>
                    </div>
                </div>
                <div className={`p-1 rounded-lg border border-brand-border ${toneClass(paymentMeta(order.paymentStatus).tone)} flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-200`}>
                    <div className="p-3">
                        <HiOutlineCurrencyDollar className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs uppercase font-bold tracking-widest text-brand-text-muted mb-1">Payment</p>
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold">{formatStatusString(order.paymentStatus || 'Pending')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Items Section */}
                <section className="rounded-lg border border-brand-border overflow-hidden bg-surface">
                    <div className="px-6 py-4 border-b border-brand-border bg-surface-variant/60">
                        <h3 className="text-sm font-bold text-brand-text flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-sp-navy rounded-full"></span>
                            Ordered Items ({order.cart.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-brand-border">
                        {order.cart.map((item, idx) => (
                            <div key={idx} className="p-5 flex items-center justify-between hover:bg-surface-variant/40 transition-colors duration-150">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-sp-navy-soft rounded-lg flex items-center justify-center font-bold text-xs text-sp-navy border border-brand-border shadow-sm shrink-0">
                                        {item.quantity}x
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-brand-text truncate mb-0.5">{item.name}</p>
                                        <p className="text-[10px] text-brand-text-muted font-medium">
                                            {formatCurrency(Number(item.price), storeSettings)} each
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right whitespace-nowrap ml-4">
                                    <p className="text-sm font-bold text-brand-text tnum">
                                        {formatCurrency(Number(item.price) * (item.quantity || 1), storeSettings)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-6 bg-surface-variant/60 border-t border-brand-border space-y-2">
                        <div className="flex justify-between items-center text-xs text-brand-text-muted">
                            <span>Subtotal</span>
                            <span className="font-medium text-brand-text tnum">{formatCurrency(order.subtotal, storeSettings)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-brand-text-muted">
                            <span>Tax</span>
                            <span className="font-medium text-brand-text tnum">{formatCurrency(order.tax, storeSettings)}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between items-center text-xs text-success">
                                <span>Discount</span>
                                <span className="font-medium tnum">-{formatCurrency(order.discount, storeSettings)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm font-bold text-brand-text pt-2 border-t border-brand-border">
                            <span>Total</span>
                            <span className="text-base tnum">{formatCurrency(order.total, storeSettings)}</span>
                        </div>
                    </div>
                </section>

                {/* Customer Card */}
                <div className="rounded-lg border border-brand-border overflow-hidden bg-surface">
                    <div className="px-6 py-4 border-b border-brand-border bg-surface-variant/60">
                        <h3 className="text-sm font-bold text-brand-text flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-sp-orange rounded-full"></span>
                            Customer info
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-sp-navy-soft rounded-lg flex items-center justify-center shadow-sm border border-brand-border shrink-0">
                                <HiOutlineUser className="w-6 h-6 text-sp-navy" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-brand-text text-base truncate mb-0.5">
                                    {order.customerDetails?.name || order.customerName || 'Guest Customer'}
                                </p>
                                <p className="text-xs text-brand-text-muted truncate">{order.customerDetails?.email || 'No email'}</p>
                                <p className="text-xs text-brand-text-muted mt-0.5">{order.customerDetails?.phone || 'No phone'}</p>
                            </div>
                        </div>

                        {order.customerDetails?.address && (
                            <div className="pt-4 border-t border-brand-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <HiOutlineMapPin className="w-3.5 h-3.5 text-brand-text-muted" />
                                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-brand-text-muted">Address</h4>
                                </div>
                                <p className="text-xs text-brand-text leading-relaxed bg-surface-variant p-3 rounded-lg border border-brand-border">
                                    {order.customerDetails.address}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Progress Section — structural navy block per the Velocity system */}
                <section className="bg-sp-navy rounded-lg text-white overflow-hidden relative shadow-lg">
                    <div className="relative z-10 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <HiOutlineCreditCard className="w-4 h-4 text-white/60" />
                                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/60">Payment Progress</h4>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-bold tnum">{formatCurrency(order.amountPaid || 0, storeSettings)}</span>
                                    <span className="text-xs text-white/60 tnum">/ {formatCurrency(order.total, storeSettings)}</span>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${order.paymentStatus === 'paid'
                                ? 'bg-success/20 text-success-muted border-success/30'
                                : 'bg-sp-orange/20 text-sp-orange-light border-sp-orange/30'}`}>
                                {formatStatusString(order.paymentStatus)}
                            </div>
                        </div>

                        <div className="mb-2">
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${order.paymentStatus === 'paid'
                                        ? 'bg-success'
                                        : 'bg-sp-orange'}`}
                                    style={{ width: `${paymentProgress}%` }}
                                />
                            </div>
                        </div>

                        {order.paymentStatus !== 'paid' && (
                            <div className="pt-3 border-t border-white/10">
                                <p className="text-xs text-white/80">
                                    <span className="font-bold">Remaining:</span>{' '}
                                    <span className="text-sp-orange-light font-bold tnum">{formatCurrency(remainingAmount, storeSettings)}</span>
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
