import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import XMarkIcon from '../icons/XMarkIcon';

interface QrScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
    onScanError: (errorMessage: string) => void;
}

const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, onScanSuccess, onScanError }) => {
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const readerId = "qr-reader";

    useEffect(() => {
        if (isOpen) {
            if (!html5QrCodeRef.current) {
                html5QrCodeRef.current = new Html5Qrcode(readerId);
            }
            const html5QrCode = html5QrCodeRef.current;

            const config = { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [] };

            html5QrCode.start(
                { facingMode: "environment" },
                config,
                (decodedText, decodedResult) => {
                    onScanSuccess(decodedText);
                },
                (errorMessage) => {
                    // Ignore continuous errors when no code is found
                }
            ).catch((err) => {
                onScanError(`Unable to start QR scanner: ${err}`);
                onClose();
            });
        }

        return () => {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop().catch(err => {
                    console.warn("QR Scanner stop failed, likely already stopped:", err);
                });
            }
        };
    }, [isOpen, onScanSuccess, onScanError, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
                 <div className="p-4 flex justify-between items-center border-b">
                     <h3 className="text-lg font-medium text-gray-900" id="modal-title">Scan Product QR Code</h3>
                     <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                 </div>
                <div className="p-4">
                    <div id={readerId} className="w-full"></div>
                    <p className="text-center text-sm text-gray-500 mt-4">Position the QR code within the frame.</p>
                </div>
            </div>
        </div>
    );
};

export default QrScannerModal;
