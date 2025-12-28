
import React from 'react';
import { Sale, StoreSettings } from '@/types.ts';
import XMarkIcon from '../icons/XMarkIcon';
import PrinterIcon from '../icons/PrinterIcon';
import { formatCurrency } from '@/utils/currency.ts';
import ReceiptModal from './ReceiptModal';

interface SaleDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: Sale | null;
    storeSettings: StoreSettings;
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ isOpen, onClose, sale, storeSettings }) => {
    const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);

    if (!isOpen || !sale) return null;

    const balanceDue = sale.total - sale.amountPaid;

    return (
        <>
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div className="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-4xl w-full">
                    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">Sale Details</h3>
                            <p className="text-sm text-gray-500">{sale.transactionId}</p>
                        </div>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500"><XMarkIcon className="h-6 w-6" /></button>
                    </div>
                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Customer</h4>
                                <p className="text-md text-gray-900">{sale.customerName || 'Walk-in Customer'}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Date & Time</h4>
                                <p className="text-md text-gray-900">{new Date(sale.timestamp).toLocaleString()}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500">Payment Status</h4>
                                <p className="text-md text-gray-900 capitalize">{sale.paymentStatus.replace('_', ' ')}</p>
                            </div>
                        </div>

                        <h4 className="text-md font-semibold text-gray-800 mb-2 border-b pb-1">Items</h4>
                        <table className="min-w-full divide-y divide-gray-200 mb-6">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sale.cart.map(item => (
                                    <tr key={item.productId}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.name}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-center">{item.quantity}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{formatCurrency(item.price, storeSettings)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium">{formatCurrency(item.price * item.quantity, storeSettings)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                {(sale.payments?.length || 0) > 0 && (
                                    <>
                                    <h4 className="font-semibold text-gray-800 mb-2">Payments</h4>
                                    <ul className="divide-y divide-gray-200 border rounded-md">
                                        {sale.payments?.map(p => (
                                            <li key={p.id} className="px-3 py-2 flex justify-between text-sm">
                                                <span>{new Date(p.date).toLocaleDateString()} - <span className="capitalize">{p.method}</span></span>
                                                <span className="font-medium text-green-600">{formatCurrency(p.amount, storeSettings)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    </>
                                )}
                            </div>
                            <div className="text-right space-y-1 text-sm">
                                <p><strong>Subtotal:</strong> {formatCurrency(sale.subtotal, storeSettings)}</p>
                                {sale.discount > 0 && <p className="text-red-600"><strong>Discount:</strong> -{formatCurrency(sale.discount, storeSettings)}</p>}
                                <p><strong>Tax:</strong> {formatCurrency(sale.tax, storeSettings)}</p>
                                {sale.storeCreditUsed && sale.storeCreditUsed > 0 && <p className="text-green-600"><strong>Store Credit Used:</strong> -{formatCurrency(sale.storeCreditUsed, storeSettings)}</p>}
                                <p className="text-lg font-bold border-t pt-2 mt-2"><strong>Total:</strong> {formatCurrency(sale.total, storeSettings)}</p>
                                <p className="text-green-600"><strong>Paid:</strong> {formatCurrency(sale.amountPaid, storeSettings)}</p>
                                {balanceDue > 0.01 && <p className="text-xl font-bold text-red-600"><strong>Balance Due:</strong> {formatCurrency(balanceDue, storeSettings)}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end gap-3 border-t">
                        <button onClick={() => setIsReceiptOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                            <PrinterIcon className="w-5 h-5"/> View/Print Receipt
                        </button>
                        <button onClick={onClose} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                            Close
                        </button>
                    </div>
                </div>
            </div>
            {isReceiptOpen && sale && (
                <ReceiptModal 
                    isOpen={isReceiptOpen}
                    onClose={() => setIsReceiptOpen(false)}
                    saleData={sale}
                    storeSettings={storeSettings}
                    showSnackbar={() => {}} 
                />
            )}
        </>
    );
};

export default SaleDetailModal;
