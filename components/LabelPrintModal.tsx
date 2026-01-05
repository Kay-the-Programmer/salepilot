
import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Product, StoreSettings } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import { formatCurrency } from '../utils/currency';

interface LabelPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    storeSettings: StoreSettings;
}

const LabelPrintModal: React.FC<LabelPrintModalProps> = ({ isOpen, onClose, product, storeSettings }) => {
    const barcodeRef = useRef<HTMLCanvasElement>(null);
    const qrCodeRef = useRef<HTMLCanvasElement>(null);
    const printAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && product) {
            const barcodeValue = product.barcode || product.sku;
            if (barcodeRef.current) {
                try {
                    JsBarcode(barcodeRef.current, barcodeValue, {
                        format: "CODE128",
                        displayValue: true,
                        fontSize: 14,
                        margin: 10,
                        height: 50,
                    });
                } catch (e) {
                    console.error("Failed to generate barcode:", e);
                }
            }
            if (qrCodeRef.current) {
                QRCode.toCanvas(qrCodeRef.current, barcodeValue, { width: 80, margin: 1 }, (error) => {
                    if (error) console.error("Failed to generate QR code:", error);
                });
            }
        }
    }, [isOpen, product]);

    const handlePrint = () => {
        const printContents = printAreaRef.current?.innerHTML;
        const originalContents = document.body.innerHTML;
        const printWindow = window.open('', '', 'height=600,width=800');

        if (printWindow && printContents) {
            printWindow.document.write('<html><head><title>Print Label</title>');
            printWindow.document.write('<style>body { text-align: center; font-family: sans-serif; } .label-container { display: inline-block; padding: 1rem; border: 1px dashed #ccc; } h3 { margin: 0 0 0.25rem; } p { margin: 0; font-size: 1.25rem; font-weight: bold; } canvas { max-width: 100%; } .codes { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 0.5rem; } </style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContents);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-end sm:items-center z-50 p-0 sm:p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-white rounded-t-2xl rounded-b-none sm:rounded-lg shadow-xl transform transition-all sm:max-w-md w-full m-0 sm:m-4 animate-slide-up-mobile sm:animate-none">
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            Print Product Label
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{product.name}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 text-center">
                    <div ref={printAreaRef}>
                        <div className="label-container inline-block p-4 border border-dashed border-gray-400">
                            <h3 className="text-lg font-semibold">{product.name}</h3>
                            <p className="text-2xl font-bold mb-2">{formatCurrency(product.price, storeSettings)}</p>
                            <div className="codes flex items-center justify-center gap-4">
                                <canvas ref={qrCodeRef}></canvas>
                            </div>
                            <canvas ref={barcodeRef}></canvas>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t">
                    <button type="button" onClick={handlePrint} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                        Print
                    </button>
                    <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LabelPrintModal;
