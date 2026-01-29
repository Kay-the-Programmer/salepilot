import React, { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { Sale, StoreSettings } from '@/types.ts';
import { SnackbarType } from '../../App';
import XMarkIcon from '../icons/XMarkIcon';
import PrinterIcon from '../icons/PrinterIcon';
import { formatCurrency } from '@/utils/currency.ts';
import { Button } from '../ui/Button';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    saleData: Sale;
    showSnackbar: (message: string, type?: SnackbarType) => void;
    storeSettings: StoreSettings;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, saleData, showSnackbar, storeSettings }) => {
    const { transactionId, timestamp, cart, total, subtotal, tax, discount, customerName, storeCreditUsed } = saleData;
    const modalPrintAreaRef = useRef<HTMLDivElement>(null);
    const barcodeRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (isOpen && transactionId && barcodeRef.current) {
            try {
                // Use a shorter barcode ID for better receipt formatting
                const barcodeId = transactionId.length > 12
                    ? transactionId.slice(-10) // Last 10 characters
                    : transactionId;

                JsBarcode(barcodeRef.current, barcodeId, {
                    format: "CODE128",
                    displayValue: true,
                    margin: 5,
                    height: 35,
                    width: 1.2,
                    fontSize: 12,
                    textMargin: 2
                });
            } catch (e) {
                console.error("Failed to generate receipt barcode:", e);
            }
        }
    }, [isOpen, transactionId]);

    if (!isOpen) return null;

    const handlePrint = () => {
        if (!modalPrintAreaRef.current || !barcodeRef.current) return;

        const printWindow = window.open('', '', 'height=600,width=400');
        if (!printWindow) {
            showSnackbar("Could not open print window. Please check your browser's pop-up settings.", "error");
            return;
        }

        // Convert the canvas to an image data URL
        const barcodeDataUrl = barcodeRef.current.toDataURL();

        // Create a temporary container to manipulate the DOM for printing
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalPrintAreaRef.current.innerHTML;

        // Find the canvas in our temporary DOM and replace it with an image
        const canvas = tempDiv.querySelector('canvas');
        if (canvas) {
            const img = document.createElement('img');
            img.src = barcodeDataUrl;
            canvas.parentNode?.replaceChild(img, canvas);
        }

        const finalHtml = tempDiv.innerHTML;

        printWindow.document.write('<html><head><title>Receipt</title>');
        printWindow.document.write(`
            <style>
                body { 
                    font-family: 'Courier New', monospace; 
                    width: 300px;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #000;
                    margin: 0;
                    padding: 15px;
                }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .text-sm { font-size: 0.8rem; }
                .text-xs { font-size: 0.7rem; }
                .text-gray-500 { color: #555; }
                .mb-4 { margin-bottom: 1rem; }
                .mb-2 { margin-bottom: 0.5rem; }
                .mt-4 { margin-top: 1rem; }
                .mt-6 { margin-top: 1.5rem; }
                .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .border-dashed { border-style: dashed; }
                .border-t { border-top: 1px dashed #000; }
                .border-b { border-bottom: 1px dashed #000; }
                h2 { font-size: 1.2rem; margin: 0 0 0.5rem 0; }
                p { margin: 0; }
                .item-list { padding: 0.5rem 0; margin: 0.5rem 0; }
                .item-row { margin-bottom: 0.25rem; }
                .item-row > div:first-child { font-weight: bold; }
                .item-row-details { display: flex; justify-content: space-between; font-size: 11px; }
                .totals { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #000; }
                .barcode-container { margin-top: 1rem; text-align: center; }
                .barcode-container img { max-width: 100%; }
                .text-green-600 { color: #059669; }
                .whitespace-pre-wrap { white-space: pre-wrap; }
                @media print {
                    body { margin: 0; padding: 0; }
                }
            </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(finalHtml);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };



    return (
        <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-end sm:items-center justify-center animate-fade-in"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="bg-white/95 backdrop-blur-xl w-full rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-md border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                {/* iOS-style drag handle for mobile */}
                <div className="sm:hidden pt-3 pb-1 flex justify-center">
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                </div>

                {/* Header with close button */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-md px-4 pt-4 pb-3 sm:px-6 border-b border-gray-200/50 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">Receipt</h3>
                            <p className="text-sm text-gray-500 mt-0.5">Transaction #{transactionId}</p>
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

                {/* Scrollable receipt content */}
                <div className="overflow-y-auto flex-1">
                    {/* Receipt print area */}
                    <div ref={modalPrintAreaRef} className="p-6 text-gray-800">
                        {/* Store header */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{storeSettings.name}</h2>
                            <p className="text-sm text-gray-600 mb-3">Sale Receipt</p>
                            <div className="space-y-1 text-xs text-gray-500">
                                <p>{new Date(timestamp).toLocaleDateString()}</p>
                                <p>{new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            {customerName && (
                                <div className="mt-3 p-2 bg-blue-50 rounded-lg inline-block">
                                    <p className="text-sm font-medium text-blue-800">Customer: {customerName}</p>
                                </div>
                            )}
                        </div>

                        {/* Items list */}
                        <div className="mb-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Items ({cart.length})</h4>
                            <div className="space-y-2">
                                {cart.map(item => (
                                    <div key={item.productId} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {item.quantity} × {formatCurrency(item.price, storeSettings)}
                                                {item.returnedQuantity !== undefined && item.returnedQuantity > 0 && (
                                                    <span className="text-orange-600 ml-1 font-bold">
                                                        (Ret: {item.returnedQuantity})
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <p className="font-semibold text-gray-900 ml-2">
                                            {formatCurrency(item.price * item.quantity, storeSettings)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="bg-gray-50 rounded-xl p-5 mb-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Summary</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">{formatCurrency(subtotal, storeSettings)}</span>
                                </div>

                                {discount > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Discount</span>
                                        <span className="font-medium">-{formatCurrency(discount, storeSettings)}</span>
                                    </div>
                                )}

                                {storeCreditUsed && storeCreditUsed > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Store Credit</span>
                                        <span className="font-medium">-{formatCurrency(storeCreditUsed, storeSettings)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="font-medium">{formatCurrency(tax, storeSettings)}</span>
                                </div>

                                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                                    <span className="text-gray-600">Original Total</span>
                                    <span className="font-medium">{formatCurrency(saleData.originalTotal ?? total + (saleData.totalRefunded ?? 0), storeSettings)}</span>
                                </div>

                                {saleData.totalRefunded !== undefined && saleData.totalRefunded > 0 && (
                                    <div className="flex justify-between text-orange-600 text-sm">
                                        <span>Total Refunded</span>
                                        <span className="font-medium">-{formatCurrency(saleData.totalRefunded, storeSettings)}</span>
                                    </div>
                                )}

                                <div className="border-t border-gray-300 pt-3 flex justify-between text-lg font-bold">
                                    <span>Net Total</span>
                                    <span>{formatCurrency(total, storeSettings)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Store message */}
                        {storeSettings.receiptMessage && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                                <p className="text-center text-sm text-gray-600 whitespace-pre-wrap">
                                    {storeSettings.receiptMessage}
                                </p>
                            </div>
                        )}

                        {/* Barcode */}
                        <div className="text-center">
                            <div className="border border-gray-200 rounded-lg p-4 inline-block">
                                <canvas ref={barcodeRef} style={{ display: 'block', margin: '0 auto' }}></canvas>
                                <p className="text-xs text-gray-500 mt-2">Transaction ID: {transactionId}</p>
                            </div>
                        </div>
                    </div>


                </div>

                {/* Fixed action buttons */}
                <div className="sticky bottom-0 bg-white/80 backdrop-blur-md px-4 py-4 sm:px-6 border-t border-gray-200/50">
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handlePrint}
                            icon={<PrinterIcon className="w-5 h-5" />}
                        >
                            Print Receipt
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={onClose}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;