import { Sale, StoreSettings } from '@/types';
import { formatCurrency } from '@/utils/currency';

interface SaleDetailContentProps {
    sale: Sale;
    storeSettings: StoreSettings;
}

export default function SaleDetailContent({ sale, storeSettings }: SaleDetailContentProps) {
    // Use the amountPaid from server (which is net) or fallback to calculated if net is somehow missing
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

    return (
        <div className="space-y-6">
            {/* Key info cards - responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-2 border border-gray-200 dark:border-white/10">
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Customer</h4>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {sale.customerName || 'Walk-in Customer'}
                    </p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-2 border border-gray-200 dark:border-white/10">
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Date & Time</h4>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {new Date(sale.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-2 border border-gray-200 dark:border-white/10">
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${derivedPaymentStatus === 'paid' ? 'bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-400' :
                        derivedPaymentStatus === 'partially_paid' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400' :
                            derivedPaymentStatus === 'returned' ? 'bg-slate-100 dark:bg-slate-500/10 text-slate-800 dark:text-slate-400' :
                                derivedPaymentStatus === 'partially_returned' ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-800 dark:text-orange-400' :
                                    'bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-400'
                        }`}>
                        {derivedPaymentStatus?.replace('_', ' ') || 'Unknown'}
                    </span>
                </div>
            </div>

            {/* Items section */}
            <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Items ({sale.cart.length})</h4>
                <div className="space-y-2">
                    {sale.cart.map(item => (
                        <div key={item.productId} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-xl p-3 hover:border-blue-200 dark:hover:border-blue-500/50 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex-1 min-w-0 mr-2">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{item.name}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">SKU: {item.sku || 'N/A'}</p>
                                </div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">
                                    {formatCurrency(item.price * item.quantity, storeSettings)}
                                </p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">Qty: {item.quantity}</span>
                                    {item.returnedQuantity !== undefined && item.returnedQuantity > 0 && (
                                        <span className="text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded">
                                            Returned: {item.returnedQuantity}
                                        </span>
                                    )}
                                </div>
                                <span>{formatCurrency(item.price, storeSettings)} / each</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payments & Totals */}
            <div className="space-y-4">
                {/* Payments section */}
                {(sale.payments?.length || 0) > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Payments</h4>
                        <div className="space-y-2">
                            {sale.payments?.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-2 bg-green-50/50 dark:bg-green-500/5 rounded-lg border border-green-100 dark:border-green-500/10">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-xs capitalize">{p.method}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                            {new Date(p.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="font-bold text-green-700 dark:text-green-400 text-sm">
                                        {formatCurrency(p.amount, storeSettings)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Totals section */}
                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/10">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(sale.subtotal, storeSettings)}</span>
                        </div>

                        {sale.discount > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>Discount</span>
                                <span className="font-medium">-{formatCurrency(sale.discount, storeSettings)}</span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Tax</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(sale.tax, storeSettings)}</span>
                        </div>

                        {sale.storeCreditUsed && sale.storeCreditUsed > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Store Credit Used</span>
                                <span className="font-medium">-{formatCurrency(sale.storeCreditUsed, storeSettings)}</span>
                            </div>
                        )}

                        <div className="border-t border-gray-200 dark:border-white/10 pt-2 flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Original Total</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(sale.originalTotal ?? sale.total + (sale.totalRefunded ?? 0), storeSettings)}</span>
                        </div>

                        {sale.totalRefunded !== undefined && sale.totalRefunded > 0 && (
                            <div className="flex justify-between text-orange-600">
                                <span>Total Refunded</span>
                                <span className="font-medium">-{formatCurrency(sale.totalRefunded, storeSettings)}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-base font-bold border-t border-gray-200 dark:border-white/10 pt-3 mt-1">
                            <span className="text-gray-900 dark:text-white">Net Total</span>
                            <span className="text-gray-900 dark:text-white">{formatCurrency(sale.total, storeSettings)}</span>
                        </div>

                        <div className="flex justify-between text-green-700 dark:text-green-400 font-medium">
                            <span>Paid</span>
                            <span className="font-bold">{formatCurrency(calculatedAmountPaid, storeSettings)}</span>
                        </div>

                        {balanceDue > 0.01 && (
                            <div className="flex justify-between text-red-700 dark:text-red-400 pt-2 border-t border-gray-200 dark:border-white/10 mt-1">
                                <span className="font-bold">Balance Due</span>
                                <span className="text-lg font-bold">{formatCurrency(balanceDue, storeSettings)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
