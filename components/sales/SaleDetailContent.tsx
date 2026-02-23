import { Sale, StoreSettings } from '@/types';
import { formatCurrency } from '@/utils/currency';

interface SaleDetailContentProps {
    sale: Sale;
    storeSettings: StoreSettings;
}

export default function SaleDetailContent({ sale, storeSettings }: SaleDetailContentProps) {
    const calculatedAmountPaid = sale.amountPaid !== undefined ? sale.amountPaid : (sale.payments?.reduce((sum, p) => sum + p.amount, 0) ?? sale.amountPaid);
    const balanceDue = Math.max(0, sale.total - calculatedAmountPaid);

    let derivedPaymentStatus = sale.paymentStatus as string;
    if (sale.refundStatus && sale.refundStatus !== 'none') {
        derivedPaymentStatus = sale.refundStatus;
    } else if (balanceDue <= 0.01) {
        derivedPaymentStatus = 'paid';
    } else if (calculatedAmountPaid > 0) {
        derivedPaymentStatus = 'partially_paid';
    }

    const statusColors: Record<string, string> = {
        paid: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
        partially_paid: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10',
        returned: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-500/10',
        partially_returned: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10',
        unpaid: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10',
    };

    return (
        <div className="space-y-6">
            {/* Key info — flat rows instead of boxed cards */}
            <div className="space-y-0">
                <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Customer</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white text-right">
                        {sale.customerName || 'Walk-in'}
                    </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/5">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Date</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white tabular-nums">
                        {new Date(sale.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        <span className="text-slate-400 dark:text-slate-500 ml-1.5">
                            {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </span>
                </div>
                <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${statusColors[derivedPaymentStatus] || statusColors.unpaid}`}>
                        {derivedPaymentStatus?.replace('_', ' ') || 'Unknown'}
                    </span>
                </div>
            </div>

            {/* Items */}
            <div>
                <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                    Items ({sale.cart.length})
                </h4>
                <div className="space-y-0 divide-y divide-slate-100 dark:divide-white/5">
                    {sale.cart.map(item => (
                        <div key={item.productId} className="py-3 first:pt-0 last:pb-0">
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white break-words leading-snug">{item.name}</p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 dark:text-slate-500">
                                        <span className="tabular-nums">{item.quantity} × {formatCurrency(item.price, storeSettings)}</span>
                                        {item.returnedQuantity !== undefined && item.returnedQuantity > 0 && (
                                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                                                {item.returnedQuantity} returned
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums flex-shrink-0">
                                    {formatCurrency(item.price * item.quantity, storeSettings)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payments */}
            {(sale.payments?.length || 0) > 0 && (
                <div>
                    <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                        Payments
                    </h4>
                    <div className="space-y-0 divide-y divide-slate-100 dark:divide-white/5">
                        {sale.payments?.map(p => (
                            <div key={p.id} className="flex items-center justify-between py-2.5">
                                <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-white capitalize">{p.method}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                                        {new Date(p.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                    {formatCurrency(p.amount, storeSettings)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Totals — clean flat rows */}
            <div className="pt-2">
                <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                    Summary
                </h4>
                <div className="space-y-0">
                    <div className="flex justify-between py-2">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Subtotal</span>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 tabular-nums">{formatCurrency(sale.subtotal, storeSettings)}</span>
                    </div>

                    {sale.discount > 0 && (
                        <div className="flex justify-between py-2">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Discount</span>
                            <span className="text-sm font-medium text-red-600 dark:text-red-400 tabular-nums">−{formatCurrency(sale.discount, storeSettings)}</span>
                        </div>
                    )}

                    <div className="flex justify-between py-2">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Tax</span>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 tabular-nums">{formatCurrency(sale.tax, storeSettings)}</span>
                    </div>

                    {sale.storeCreditUsed && sale.storeCreditUsed > 0 && (
                        <div className="flex justify-between py-2">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Store Credit</span>
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">−{formatCurrency(sale.storeCreditUsed, storeSettings)}</span>
                        </div>
                    )}

                    {sale.totalRefunded !== undefined && sale.totalRefunded > 0 && (
                        <>
                            <div className="flex justify-between py-2 border-t border-slate-100 dark:border-white/5">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Original Total</span>
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 tabular-nums">{formatCurrency(sale.originalTotal ?? sale.total + (sale.totalRefunded ?? 0), storeSettings)}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Refunded</span>
                                <span className="text-sm font-medium text-amber-600 dark:text-amber-400 tabular-nums">−{formatCurrency(sale.totalRefunded, storeSettings)}</span>
                            </div>
                        </>
                    )}

                    <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-200 dark:border-white/10">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Net Total</span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(sale.total, storeSettings)}</span>
                    </div>

                    <div className="flex justify-between py-2">
                        <span className="text-sm text-emerald-600 dark:text-emerald-400">Paid</span>
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(calculatedAmountPaid, storeSettings)}</span>
                    </div>

                    {balanceDue > 0.01 && (
                        <div className="flex justify-between items-center pt-2 border-t border-red-100 dark:border-red-500/10">
                            <span className="text-sm font-semibold text-red-600 dark:text-red-400">Balance Due</span>
                            <span className="text-base font-bold text-red-600 dark:text-red-400 tabular-nums">{formatCurrency(balanceDue, storeSettings)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
