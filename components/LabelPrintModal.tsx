
import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Product, StoreSettings } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import { formatCurrency } from '../utils/currency';
import { Button } from './ui/Button';

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
                QRCode.toCanvas(qrCodeRef.current, barcodeValue, { width: 80, margin: 1 }, (error: Error | null | undefined) => {
                    if (error) console.error("Failed to generate QR code:", error);
                });
            }
        }
    }, [isOpen, product]);

    const handlePrint = () => {
        const printContents = printAreaRef.current?.innerHTML;
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
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center animate-fade-in" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-white w-full rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up sm:max-w-md m-0 sm:m-4">
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

                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col sm:flex-row-reverse gap-3 border-t">
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handlePrint}
                    >
                        Print
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LabelPrintModal;
