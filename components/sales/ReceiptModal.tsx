import React, { useRef, useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { Sale, StoreSettings } from '@/types.ts';
import { SnackbarType } from '../../App';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import DevicePhoneMobileIcon from '../icons/DevicePhoneMobileIcon';
import LinkIcon from '../icons/LinkIcon';
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
    const [email, setEmail] = useState('');
    const [sms, setSms] = useState('');

    useEffect(() => {
        if (isOpen && transactionId && barcodeRef.current) {
            try {
                // Use a shorter barcode ID for better receipt formatting
                const barcodeId = transactionId.length > 12
                    ? transactionId.slice(-10) // Last 10 characters
                    : transactionId;

                JsBarcode(barcodeRef.current, barcodeId, {
                    format: "CODE128",
                    displayValue: true, // Show the ID below barcode
                    margin: 5,
                    height: 35,
                    width: 1.2,
                    fontSize: 12,
                    textMargin: 2
                });
            } catch(e) {
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
    
    const handleShare = (type: 'email' | 'sms') => {
        if (type === 'email') {
            if (!email) { showSnackbar('Please enter an email address.', 'error'); return; }
            showSnackbar(`Receipt sent to ${email} (simulated).`, 'success');
            setEmail('');
        } else {
            if (!sms) { showSnackbar('Please enter a phone number.', 'error'); return; }
            showSnackbar(`Receipt sent to ${sms} (simulated).`, 'success');
            setSms('');
        }
    };

    const handleCopyLink = () => {
        // In a real app, this would be a unique URL to a hosted receipt page.
        const receiptLink = `${window.location.origin}/receipt/${transactionId}`;
        navigator.clipboard.writeText(receiptLink);
        showSnackbar('Receipt link copied to clipboard.', 'info');
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-sm w-full flex flex-col max-h-[90vh]">
                <div ref={modalPrintAreaRef} className="p-6 text-gray-800 overflow-y-auto">
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold">{storeSettings.name}</h2>
                        <p className="text-sm">Sale Receipt</p>
                        <p className="text-xs text-gray-500">{new Date(timestamp).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Transaction ID: {transactionId}</p>
                        {customerName && <p className="text-sm text-gray-600 mt-2">Customer: {customerName}</p>}
                    </div>
                    <div className="item-list space-y-2 text-sm border-t border-b border-dashed py-2">
                        {cart.map(item => (
                            <div key={item.productId} className="item-row">
                                <div>{item.name}</div>
                                <div className="item-row-details">
                                    <span>{item.quantity} x @ {formatCurrency(item.price, storeSettings)}</span>
                                    {/*<span>{formatCurrency(item.quantity * item.price, storeSettings)}</span>*/}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="totals space-y-1 text-sm pt-2">
                        <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(subtotal, storeSettings)}</span></div>
                        {discount > 0 && <div className="flex justify-between"><span>Discount:</span><span>-{formatCurrency(discount, storeSettings)}</span></div>}
                        {storeCreditUsed && storeCreditUsed > 0 && <div className="flex justify-between text-green-600"><span>Store Credit:</span><span>-{formatCurrency(storeCreditUsed, storeSettings)}</span></div>}
                        <div className="flex justify-between"><span>Tax:</span><span>{formatCurrency(tax, storeSettings)}</span></div>
                        <div className="flex justify-between text-base font-bold border-t mt-2 pt-2"><span>Total:</span><span>{formatCurrency(total, storeSettings)}</span></div>
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-6 whitespace-pre-wrap">{storeSettings.receiptMessage}</p>
                    <div className="text-center barcode-container mt-4">
                        <canvas ref={barcodeRef} style={{ display: 'block', margin: '0 auto' }}></canvas>
                    </div>
                </div>

                <div className="px-6 pb-4 space-y-4 border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-center text-gray-600">Share Receipt</h4>
                    <div className="flex items-center space-x-2">
                        <EnvelopeIcon className="w-5 h-5 text-gray-500"/>
                        <input type="email" placeholder="Customer's email" value={email} onChange={e => setEmail(e.target.value)} className="flex-1 min-w-0 block w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"/>
                        <button onClick={() => handleShare('email')} className="text-sm font-medium text-blue-600 hover:text-blue-800">Send</button>
                    </div>
                     <div className="flex items-center space-x-2">
                        <DevicePhoneMobileIcon className="w-5 h-5 text-gray-500"/>
                        <input type="tel" placeholder="Customer's phone" value={sms} onChange={e => setSms(e.target.value)} className="flex-1 min-w-0 block w-full px-3 py-1.5 text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"/>
                        <button onClick={() => handleShare('sms')} className="text-sm font-medium text-blue-600 hover:text-blue-800">Send</button>
                    </div>
                     <div className="flex items-center space-x-2">
                        <LinkIcon className="w-5 h-5 text-gray-500"/>
                        <p className="flex-1 text-sm text-gray-500">Copy a shareable link.</p>
                        <button onClick={handleCopyLink} className="text-sm font-medium text-blue-600 hover:text-blue-800">Copy</button>
                    </div>
                </div>

                 <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col sm:flex-row-reverse gap-2 border-t">
                    <button type="button" onClick={onClose} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm">
                        Done
                    </button>
                    <button type="button" onClick={handlePrint} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm">
                        Print
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;