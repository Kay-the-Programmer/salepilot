import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import JsBarcode from 'jsbarcode';
import { Sale, StoreSettings } from '@/types.ts';
import { SnackbarType } from '../../App';
import { formatCurrency } from '@/utils/currency.ts';
import PosIcon from './PosIcon';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    saleData: Sale;
    showSnackbar: (message: string, type?: SnackbarType) => void;
    storeSettings: StoreSettings;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, saleData, showSnackbar, storeSettings }) => {
    const { transactionId, timestamp, cart, total, subtotal, tax, discount, customerName, customerPhone, attendedBy, storeCreditUsed } = saleData;
    const modalPrintAreaRef = useRef<HTMLDivElement>(null);
    const barcodeRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (isOpen && transactionId && barcodeRef.current) {
            try {
                const barcodeId = transactionId.length > 12 ? transactionId.slice(-10) : transactionId;
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
            if (e.key === 'Escape' && isOpen) onClose();
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
                .font-extrabold { font-weight: 800; }
                .font-semibold { font-weight: 600; }
                .font-medium { font-weight: 500; }
                .text-sm { font-size: 0.85rem; }
                .text-xs { font-size: 0.75rem; }
                .text-lg { font-size: 1.1rem; }
                .text-xl { font-size: 1.25rem; }
                .text-2xl { font-size: 1.5rem; }
                .text-3xl { font-size: 1.6rem; }
                .uppercase { text-transform: uppercase; }
                .tracking-widest { letter-spacing: 0.1em; }
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
                .items-end { align-items: flex-end; }
                .border-dashed { border-style: dashed !important; }
                .border-t { border-top: 1px solid #ddd; }
                .border-b { border-bottom: 1px solid #ddd; }
                .border-slate-200, .border-gray-200 { border-color: #eee !important; }
                .grid { display: grid; }
                .grid-cols-2 { grid-template-columns: 1fr 1fr; }
                .gap-3 { gap: 0.75rem; }
                .text-right { text-align: right; }
                h2, h3, h4, p { margin: 0; }
                .whitespace-pre-wrap { white-space: pre-wrap; }
                .print-hidden { display: none !important; }
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

    return createPortal(
        <div
            className="fixed inset-0 z-[200] bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 transition-all duration-300 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-title"
            onClick={onClose}
        >
            <div
                className="relative w-full sm:max-w-[400px] max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-background rounded-t-2xl sm:rounded-2xl border border-brand-border shadow-xl overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle (mobile) */}
                <div className="flex-none flex justify-center pt-2.5 pb-1 sm:hidden print-hidden">
                    <div className="w-10 h-1 bg-brand-border rounded-full" />
                </div>

                {/* Slim confirmation header */}
                <div className="flex-none flex items-center justify-between gap-3 px-5 pt-4 sm:pt-5 pb-4 print-hidden">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex-none w-8 h-8 rounded-full bg-success-muted flex items-center justify-center">
                            <PosIcon name="check_circle" size={18} fill={1} className="text-success" />
                        </span>
                        <div className="min-w-0 leading-tight">
                            <p id="receipt-title" className="text-sm font-bold text-brand-text">Payment successful</p>
                            <p className="text-xs text-brand-text-muted">{formatCurrency(total, storeSettings)} received</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close receipt"
                        className="flex-none w-8 h-8 flex items-center justify-center rounded-lg text-brand-text-muted hover:bg-surface-variant hover:text-brand-text transition-colors active:scale-95"
                    >
                        <PosIcon name="close" size={18} />
                    </button>
                </div>

                {/* Scrollable receipt */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 pb-6">
                    <div
                        ref={modalPrintAreaRef}
                        className="bg-white text-slate-900 rounded-lg border border-slate-200 p-6 print:border-0 print:p-0 mx-auto w-full max-w-sm"
                    >
                        {/* Header */}
                        <div className="text-center mb-6">
                            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 mb-1">{storeSettings.name}</h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Official Receipt</p>
                        </div>

                        {/* Meta */}
                        <div className="grid grid-cols-2 gap-3 py-4 border-t border-b border-dashed border-slate-200 mb-5 text-left">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Receipt No</p>
                                <p className="text-sm font-bold text-slate-900 break-all">{transactionId}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Date</p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {new Date(timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            {attendedBy && (
                                <div className="col-span-2">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Attended By</p>
                                    <p className="text-sm font-semibold text-slate-900">{attendedBy}</p>
                                </div>
                            )}
                            {(customerName || customerPhone) && (
                                <div className="col-span-2">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Customer</p>
                                    <p className="text-sm font-semibold text-slate-900">{customerName || customerPhone}</p>
                                    {customerName && customerPhone && (
                                        <p className="text-xs text-slate-500">{customerPhone}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Items */}
                        <div className="mb-5 space-y-3.5">
                            {cart.map(item => (
                                <div key={item.productId} className="flex justify-between items-start text-sm">
                                    <div className="flex-1 pr-4">
                                        <p className="font-semibold text-slate-900">{item.name}</p>
                                        <p className="text-slate-500 mt-0.5">
                                            {item.quantity} × {formatCurrency(item.price, storeSettings)}
                                            {item.returnedQuantity !== undefined && item.returnedQuantity > 0 && (
                                                <span className="text-rose-500 ml-1 font-semibold">(Ret: {item.returnedQuantity})</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="font-semibold text-slate-900 text-right pt-0.5">
                                        {formatCurrency(item.price * item.quantity, storeSettings)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="border-t border-dashed border-slate-200 pt-4 space-y-2.5 text-sm">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal</span>
                                <span className="font-medium text-slate-900">{formatCurrency(subtotal, storeSettings)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-slate-600">
                                    <span>Discount</span>
                                    <span className="font-medium text-slate-900">-{formatCurrency(discount, storeSettings)}</span>
                                </div>
                            )}
                            {storeCreditUsed && storeCreditUsed > 0 && (
                                <div className="flex justify-between text-slate-600">
                                    <span>Store Credit</span>
                                    <span className="font-medium text-slate-900">-{formatCurrency(storeCreditUsed, storeSettings)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-600">
                                <span>Tax</span>
                                <span className="font-medium text-slate-900">{formatCurrency(tax, storeSettings)}</span>
                            </div>
                            {saleData.totalRefunded !== undefined && saleData.totalRefunded > 0 && (
                                <div className="flex justify-between text-rose-600 font-medium">
                                    <span>Refunded</span>
                                    <span>-{formatCurrency(saleData.totalRefunded, storeSettings)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-end pt-3">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total</span>
                                <span className="text-2xl font-extrabold tracking-tight" style={{ color: '#002b6b' }}>
                                    {formatCurrency(total, storeSettings)}
                                </span>
                            </div>
                        </div>

                        {/* Footer / barcode */}
                        <div className="border-t border-dashed border-slate-200 mt-5 pt-5 text-center">
                            {storeSettings.receiptMessage && (
                                <p className="text-sm font-medium text-slate-600 whitespace-pre-wrap mb-5">
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

                {/* Action bar */}
                <div className="flex-none p-4 sm:px-6 border-t border-brand-border bg-background print-hidden flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-none px-5 py-3 rounded-lg bg-surface-variant text-brand-text font-semibold text-[15px] hover:bg-warm-300 active:scale-95 transition-all"
                    >
                        Done
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 py-3 bg-secondary hover:bg-secondary/90 text-white rounded-lg text-[15px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                        <PosIcon name="print" size={18} />
                        Print receipt
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ReceiptModal;
