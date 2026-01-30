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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Customer</h4>
                    <p className="text-sm font-bold text-gray-900 truncate">
                        {sale.customerName || 'Walk-in Customer'}
                    </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date & Time</h4>
                    <p className="text-sm font-bold text-gray-900">
                        {new Date(sale.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                        {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${derivedPaymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        derivedPaymentStatus === 'partially_paid' ? 'bg-blue-100 text-blue-800' :
                            derivedPaymentStatus === 'returned' ? 'bg-slate-100 text-slate-800' :
                                derivedPaymentStatus === 'partially_returned' ? 'bg-orange-100 text-orange-800' :
                                    'bg-red-100 text-red-800'
                        }`}>
                        {derivedPaymentStatus?.replace('_', ' ') || 'Unknown'}
                    </span>
                </div>
            </div>

            {/* Items section */}
            <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Items ({sale.cart.length})</h4>
                <div className="space-y-2">
                    {sale.cart.map(item => (
                        <div key={item.productId} className="bg-white border border-gray-100 rounded-xl p-3 hover:border-blue-200 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex-1 min-w-0 mr-2">
                                    <p className="font-bold text-gray-900 text-sm truncate">{item.name}</p>
                                    <p className="text-xs text-gray-400">SKU: {item.sku || 'N/A'}</p>
                                </div>
                                <p className="font-bold text-gray-900 text-sm">
                                    {formatCurrency(item.price * item.quantity, storeSettings)}
                                </p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium bg-gray-100 px-1.5 py-0.5 rounded">Qty: {item.quantity}</span>
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
                        <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Payments</h4>
                        <div className="space-y-2">
                            {sale.payments?.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-2 bg-green-50/50 rounded-lg border border-green-100">
                                    <div>
                                        <p className="font-bold text-gray-900 text-xs capitalize">{p.method}</p>
                                        <p className="text-[10px] text-gray-500">
                                            {new Date(p.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="font-bold text-green-700 text-sm">
                                        {formatCurrency(p.amount, storeSettings)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Totals section */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium text-gray-900">{formatCurrency(sale.subtotal, storeSettings)}</span>
                        </div>

                        {sale.discount > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>Discount</span>
                                <span className="font-medium">-{formatCurrency(sale.discount, storeSettings)}</span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span className="text-gray-500">Tax</span>
                            <span className="font-medium text-gray-900">{formatCurrency(sale.tax, storeSettings)}</span>
                        </div>

                        {sale.storeCreditUsed && sale.storeCreditUsed > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Store Credit Used</span>
                                <span className="font-medium">-{formatCurrency(sale.storeCreditUsed, storeSettings)}</span>
                            </div>
                        )}

                        <div className="border-t border-gray-200 pt-2 flex justify-between">
                            <span className="text-gray-500">Original Total</span>
                            <span className="font-medium text-gray-900">{formatCurrency(sale.originalTotal ?? sale.total + (sale.totalRefunded ?? 0), storeSettings)}</span>
                        </div>

                        {sale.totalRefunded !== undefined && sale.totalRefunded > 0 && (
                            <div className="flex justify-between text-orange-600">
                                <span>Total Refunded</span>
                                <span className="font-medium">-{formatCurrency(sale.totalRefunded, storeSettings)}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-3 mt-1">
                            <span className="text-gray-900">Net Total</span>
                            <span className="text-gray-900">{formatCurrency(sale.total, storeSettings)}</span>
                        </div>

                        <div className="flex justify-between text-green-700 font-medium">
                            <span>Paid</span>
                            <span className="font-bold">{formatCurrency(calculatedAmountPaid, storeSettings)}</span>
                        </div>

                        {balanceDue > 0.01 && (
                            <div className="flex justify-between text-red-700 pt-2 border-t border-gray-200 mt-1">
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
