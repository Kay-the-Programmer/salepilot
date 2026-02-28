import React, { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { Sale, StoreSettings } from '@/types.ts';
import { SnackbarType } from '../../App';
import XMarkIcon from '../icons/XMarkIcon';
import PrinterIcon from '../icons/PrinterIcon';
import { formatCurrency } from '@/utils/currency.ts';

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
                const barcodeId = transactionId.length > 12
                    ? transactionId.slice(-10)
                    : transactionId;

                JsBarcode(barcodeRef.current, barcodeId, {
                    format: "CODE128",
                    displayValue: true,
                    margin: 0,
                    height: 40,
                    width: 1.5,
                    fontSize: 14,
                    textMargin: 4,
                    fontOptions: "bold",
                    lineColor: "#000000"
                });
            } catch (e) {
                console.error("Failed to generate receipt barcode:", e);
            }
        }
    }, [isOpen, transactionId]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handlePrint = () => {
        if (!modalPrintAreaRef.current || !barcodeRef.current) return;

        const printWindow = window.open('', '', 'height=600,width=400');
        if (!printWindow) {
            showSnackbar("Could not open print window. Please check your browser's pop-up settings.", "error");
            return;
        }

        const barcodeDataUrl = barcodeRef.current.toDataURL();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalPrintAreaRef.current.innerHTML;

        const canvas = tempDiv.querySelector('canvas');
        if (canvas) {
            const img = document.createElement('img');
            img.src = barcodeDataUrl;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            canvas.parentNode?.replaceChild(img, canvas);
        }

        // Clean up UI-only elements before printing (like shadows, rounded corners that don't matter)
        const finalHtml = tempDiv.innerHTML;

        printWindow.document.write('<html><head><title>Receipt</title>');
        printWindow.document.write(`
            <style>
                @page { margin: 0; }
                body { 
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                    width: 100%;
                    max-width: 320px;
                    font-size: 12px;
                    line-height: 1.5;
                    color: #000;
                    margin: 0 auto;
                    padding: 20px 15px;
                }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .font-semibold { font-weight: 600; }
                .font-medium { font-weight: 500; }
                .text-sm { font-size: 0.85rem; }
                .text-xs { font-size: 0.75rem; }
                .text-lg { font-size: 1.1rem; }
                .text-xl { font-size: 1.25rem; }
                .text-2xl { font-size: 1.5rem; }
                .text-gray-500, .text-slate-500 { color: #666 !important; }
                .text-gray-400, .text-slate-400 { color: #888 !important; }
                .mb-1 { margin-bottom: 0.25rem; } .mb-2 { margin-bottom: 0.5rem; } .mb-3 { margin-bottom: 0.75rem; } .mb-4 { margin-bottom: 1rem; } .mb-6 { margin-bottom: 1.5rem; } .mb-8 { margin-bottom: 2rem; }
                .mt-1 { margin-top: 0.25rem; } .mt-2 { margin-top: 0.5rem; } .mt-4 { margin-top: 1rem; } .mt-6 { margin-top: 1.5rem; } .mt-8 { margin-top: 2rem; }
                .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
                .pt-3 { padding-top: 0.75rem; }
                .pt-4 { padding-top: 1rem; }
                .pb-4 { padding-bottom: 1rem; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .items-center { align-items: center; }
                .items-start { align-items: flex-start; }
                .border-dashed { border-style: dashed !important; }
                .border-t { border-top: 1px solid #ddd; }
                .border-b { border-bottom: 1px solid #ddd; }
                .border-slate-200, .border-gray-200 { border-color: #eee !important; }
                h2, h3, h4, p { margin: 0; }
                .whitespace-pre-wrap { white-space: pre-wrap; }
                
                /* Hide screen-only decorative elements */
                .print-hidden { display: none !important; }
                
                /* Override any dark mode classes for print */
                * { color: #000 !important; background: transparent !important; }
                
                .barcode-wrapper { text-align: center; margin-top: 20px; }
                .barcode-wrapper img { margin: 0 auto; display: block; }
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
            className="fixed inset-0 z-[100] bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 transition-all duration-300 animate-fade-in"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            {/* The Modal Container */}
            <div
                className="relative w-full sm:max-w-[420px] max-h-[90vh] sm:max-h-[85vh] flex flex-col bg-slate-100 dark:bg-slate-900 sm:rounded-[32px] rounded-t-[32px] shadow-[0_20px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.4)] ring-1 ring-slate-900/5 dark:ring-white/10 overflow-hidden animate-slide-up transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle area (Mobile only) */}
                <div className="absolute top-0 inset-x-0 h-10 flex justify-center items-center sm:hidden z-20">
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700/60 rounded-full" />
                </div>

                {/* Close Button (Floating Top Right) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-800/80 border border-slate-300/50 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors backdrop-blur-md active:scale-95"
                >
                    <XMarkIcon className="w-4.5 h-4.5" />
                </button>

                {/* Scrollable Receipt Area */}
                <div className="flex-1 overflow-y-auto no-scrollbar pt-12 sm:pt-6 pb-28 px-4 sm:px-6">

                    {/* --- THE RECEIPT "PAPER" --- */}
                    <div
                        ref={modalPrintAreaRef}
                        className="bg-white dark:bg-white text-slate-900 rounded-3xl sm:rounded-[2rem] p-6 sm:p-8 shadow-sm print:shadow-none print:p-0 mx-auto w-full max-w-sm"
                    >
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4 print-hidden">
                                {/* Sleek placeholder logo/icon - could be replaced with store logo later */}
                                <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 7h-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 5h4v2h-4V5zm10 13H4V9h16v9z" />
                                    <circle cx="12" cy="14" r="2.5" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">{storeSettings.name}</h2>
                            <p className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-widest print:text-xs">Receipt</p>

                            <div className="text-xs text-slate-500 space-y-1">
                                <p>{new Date(timestamp).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p>{new Date(timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>

                            {customerName && (
                                <div className="mt-4 inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-slate-100 text-sm font-medium text-slate-700">
                                    <span className="text-slate-500 mr-2">Customer:</span> {customerName}
                                </div>
                            )}
                        </div>

                        {/* Items Divider */}
                        <div className="border-t-2 border-dashed border-slate-200 mb-6 print:border-t" />

                        {/* Items List */}
                        <div className="mb-6">
                            <div className="space-y-4">
                                {cart.map(item => (
                                    <div key={item.productId} className="flex justify-between items-start text-sm">
                                        <div className="flex-1 pr-4">
                                            <p className="font-semibold text-slate-900">{item.name}</p>
                                            <p className="text-slate-500 mt-0.5">
                                                {item.quantity} × {formatCurrency(item.price, storeSettings)}
                                                {item.returnedQuantity !== undefined && item.returnedQuantity > 0 && (
                                                    <span className="text-rose-500 ml-1 font-semibold">
                                                        (Ret: {item.returnedQuantity})
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="font-semibold text-slate-900 text-right pt-0.5">
                                            {formatCurrency(item.price * item.quantity, storeSettings)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals Divider */}
                        <div className="border-t-2 border-dashed border-slate-200 mb-4 print:border-t" />

                        {/* Totals Section */}
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center text-slate-600">
                                <span>Subtotal</span>
                                <span className="font-medium text-slate-900">{formatCurrency(subtotal, storeSettings)}</span>
                            </div>

                            {discount > 0 && (
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Discount</span>
                                    <span className="font-medium text-slate-900">-{formatCurrency(discount, storeSettings)}</span>
                                </div>
                            )}

                            {storeCreditUsed && storeCreditUsed > 0 && (
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Store Credit</span>
                                    <span className="font-medium text-slate-900">-{formatCurrency(storeCreditUsed, storeSettings)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-slate-600">
                                <span>Tax</span>
                                <span className="font-medium text-slate-900">{formatCurrency(tax, storeSettings)}</span>
                            </div>

                            {saleData.totalRefunded !== undefined && saleData.totalRefunded > 0 && (
                                <div className="flex justify-between items-center text-rose-600 font-medium">
                                    <span>Refunded</span>
                                    <span>-{formatCurrency(saleData.totalRefunded, storeSettings)}</span>
                                </div>
                            )}

                            {/* Net Total (Big!) */}
                            <div className="flex justify-between items-end pt-4 pb-2">
                                <span className="text-base font-medium text-slate-500 uppercase tracking-wider mb-0.5">Total</span>
                                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                                    {formatCurrency(total, storeSettings)}
                                </span>
                            </div>
                        </div>

                        {/* Footer Divider */}
                        <div className="border-t-2 border-dashed border-slate-200 mt-4 mb-6 print:border-t" />

                        {/* Footer / Barcode */}
                        <div className="text-center">
                            {storeSettings.receiptMessage && (
                                <p className="text-sm font-medium text-slate-600 whitespace-pre-wrap mb-6">
                                    {storeSettings.receiptMessage}
                                </p>
                            )}

                            <div className="barcode-wrapper flex flex-col items-center justify-center">
                                <canvas ref={barcodeRef} className="max-w-full print:grayscale"></canvas>
                                <p className="text-[10px] font-medium text-slate-400 mt-2 uppercase tracking-widest">
                                    ID: {transactionId}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Fixed Bottom Action Bar */}
                <div className="absolute bottom-0 inset-x-0 p-5 px-6 border-t border-slate-200/50 dark:border-white/5 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xl z-20">
                    <button
                        onClick={handlePrint}
                        className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[16px] text-[15px] font-bold tracking-wide shadow-[0_8px_20px_rgb(0,0,0,0.12)] hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center justify-center gap-2 active:scale-95 transition-all duration-300"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        Print Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;