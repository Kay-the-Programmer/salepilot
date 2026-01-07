import React from 'react';
import { Sale, StoreSettings } from '@/types.ts';
import XMarkIcon from '../icons/XMarkIcon';
import PrinterIcon from '../icons/PrinterIcon';
import { formatCurrency } from '@/utils/currency.ts';
import ReceiptModal from './ReceiptModal';
import { Button } from '../ui/Button';

interface SaleDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: Sale | null;
    storeSettings: StoreSettings;
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ isOpen, onClose, sale, storeSettings }) => {
    const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);

    if (!isOpen || !sale) return null;

    // Calculate amount paid from payments array if available, as it might be more up-to-date than the static field
    const calculatedAmountPaid = sale.payments?.reduce((sum, p) => sum + p.amount, 0) ?? sale.amountPaid;
    const balanceDue = Math.max(0, sale.total - calculatedAmountPaid);

    let derivedPaymentStatus = sale.paymentStatus;
    if (balanceDue <= 0.01) {
        derivedPaymentStatus = 'paid';
    } else if (calculatedAmountPaid > 0) {
        derivedPaymentStatus = 'partially_paid';
    } else if (sale.paymentStatus === 'paid' && balanceDue > 0.01) {
        // Fallback if status says paid but balance is positive (unlikely with correct logic, but safe)
        derivedPaymentStatus = 'partially_paid';
    }

    return (
        <>
            {/* Mobile-optimized backdrop with native feel */}
            <div
                className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center animate-fade-in"
                aria-labelledby="modal-title"
                role="dialog"
                aria-modal="true"
                onClick={onClose}
            >
                <div
                    className="bg-white w-full rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* iOS-style drag handle for mobile */}
                    <div className="sm:hidden pt-3 pb-1 flex justify-center">
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                    </div>

                    {/* Header with fixed position on scroll */}
                    <div className="sticky top-0 bg-white px-4 py-3 sm:px-6 border-b border-gray-200 z-10">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">Sale Details</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{sale.transactionId}</p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 -m-2 text-gray-500 hover:text-gray-700 active:bg-gray-100 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable content area */}
                    <div className="overflow-y-auto max-h-[calc(85vh-130px)] px-4 sm:px-6 py-3">
                        {/* Key info cards - responsive grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                            <div className="bg-gray-50 rounded-xl p-3">
                                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Customer</h4>
                                <p className="text-base font-medium text-gray-900 truncate">
                                    {sale.customerName || 'Walk-in Customer'}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date & Time</h4>
                                <p className="text-base font-medium text-gray-900">
                                    {new Date(sale.timestamp).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Payment Status</h4>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${derivedPaymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                    derivedPaymentStatus === 'partially_paid' ? 'bg-blue-100 text-blue-800' :
                                        derivedPaymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                    }`}>
                                    {derivedPaymentStatus?.replace('_', ' ') || 'Unknown'}
                                </span>
                            </div>
                        </div>

                        {/* Items section */}
                        <div className="mb-4">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Items ({sale.cart.length})</h4>
                            <div className="space-y-2">
                                {sale.cart.map(item => (
                                    <div key={item.productId} className="bg-white border border-gray-200 rounded-xl p-3">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                                                <p className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</p>
                                            </div>
                                            <p className="font-semibold text-gray-900 ml-2">
                                                {formatCurrency(item.price * item.quantity, storeSettings)}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                            <span>Qty: {item.quantity}</span>
                                            <span>{formatCurrency(item.price, storeSettings)} each</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Two-column layout for desktop, stacked for mobile */}
                        <div className="space-y-4">
                            {/* Payments section */}
                            {(sale.payments?.length || 0) > 0 && (
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Payments</h4>
                                    <div className="space-y-2">
                                        {sale.payments?.map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-100">
                                                <div>
                                                    <p className="font-medium text-gray-900 capitalize">{p.method}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(p.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className="font-semibold text-green-700">
                                                    {formatCurrency(p.amount, storeSettings)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Totals section - optimized for mobile */}
                            <div className="bg-gray-50 rounded-2xl p-4">
                                <h4 className="text-lg font-semibold text-gray-900 mb-3">Summary</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">{formatCurrency(sale.subtotal, storeSettings)}</span>
                                    </div>

                                    {sale.discount > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>Discount</span>
                                            <span className="font-medium">-{formatCurrency(sale.discount, storeSettings)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax</span>
                                        <span className="font-medium">{formatCurrency(sale.tax, storeSettings)}</span>
                                    </div>

                                    {sale.storeCreditUsed && sale.storeCreditUsed > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Store Credit Used</span>
                                            <span className="font-medium">-{formatCurrency(sale.storeCreditUsed, storeSettings)}</span>
                                        </div>
                                    )}

                                    <div className="border-t border-gray-300 pt-2 flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span>{formatCurrency(sale.total, storeSettings)}</span>
                                    </div>

                                    <div className="flex justify-between text-green-700">
                                        <span>Paid</span>
                                        <span className="font-bold">{formatCurrency(calculatedAmountPaid, storeSettings)}</span>
                                    </div>

                                    {balanceDue > 0.01 && (
                                        <div className="flex justify-between text-red-700 pt-2 border-t border-gray-300">
                                            <span className="font-bold">Balance Due</span>
                                            <span className="text-xl font-bold">{formatCurrency(balanceDue, storeSettings)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fixed bottom action bar - iOS style */}
                    <div className="sticky bottom-0 bg-white px-4 py-3 sm:px-6 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setIsReceiptOpen(true)}
                                icon={<PrinterIcon className="w-5 h-5" />}
                            >
                                View Receipt
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={onClose}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {isReceiptOpen && sale && (
                <ReceiptModal
                    isOpen={isReceiptOpen}
                    onClose={() => setIsReceiptOpen(false)}
                    saleData={sale}
                    storeSettings={storeSettings}
                    showSnackbar={() => { }}
                />
            )}
        </>
    );
};

export default SaleDetailModal;