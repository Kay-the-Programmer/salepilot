import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import XMarkIcon from './icons/XMarkIcon';


interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
    onScanError?: (errorMessage: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScanSuccess, onScanError }) => {
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const readerId = "barcode-reader";

    useEffect(() => {
        if (isOpen) {
            // Slight delay to ensure DOM element exists
            const timer = setTimeout(() => {
                if (!html5QrCodeRef.current) {
                    html5QrCodeRef.current = new Html5Qrcode(readerId);
                }
                const html5QrCode = html5QrCodeRef.current;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.QR_CODE,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.CODE_39,
                        Html5QrcodeSupportedFormats.UPC_A,
                        Html5QrcodeSupportedFormats.UPC_E,
                        Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
                    ]
                };

                html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText, decodedResult) => {
                        onScanSuccess(decodedText);
                        // Stop immediately after success to prevent multiple reads
                        html5QrCode.stop().then(() => {
                            html5QrCodeRef.current = null;
                        }).catch(err => console.error("Failed to stop scanner", err));
                    },
                    (errorMessage) => {
                        if (onScanError) onScanError(errorMessage);
                    }
                ).catch((err) => {
                    console.error("Error starting scanner:", err);
                    if (onScanError) onScanError(`Unable to start scanner: ${err}`);
                });
            }, 100);

            return () => clearTimeout(timer);
        }

        return () => {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop().catch(err => {
                    console.warn("Scanner stop failed:", err);
                });
                html5QrCodeRef.current = null;
            }
        };
    }, [isOpen, onScanSuccess, onScanError]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
                <div className="p-4 flex justify-between items-center border-b">
                    <h3 className="text-lg font-medium text-gray-900" id="modal-title">Scan Barcode</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-4">
                    <div id={readerId} className="w-full overflow-hidden rounded-lg bg-gray-100 min-h-[250px]"></div>
                    <p className="text-center text-sm text-gray-500 mt-4">Position the barcode within the frame.</p>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScannerModal;
