import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { FiX } from 'react-icons/fi';

interface ScanBarcodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
}

const ScanBarcodeModal: React.FC<ScanBarcodeModalProps> = ({ isOpen, onClose, onScan }) => {
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        // Cleanup previous instance if any
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }

        // Initialize scanner with a robust check for the element
        const checkAndInit = () => {
            const element = document.getElementById("reader");
            if (element) {
                try {
                    const scanner = new Html5QrcodeScanner(
                        "reader",
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0,
                            showTorchButtonIfSupported: true,
                            rememberLastUsedCamera: true
                        },
                        /* verbose= */ false
                    );

                    scannerRef.current = scanner;

                    scanner.render(
                        (decodedText) => {
                            onScan(decodedText);
                            onClose();
                        },
                        (_) => {
                            // ignore scanning errors
                        }
                    );
                } catch (err) {
                    console.error("Error starting scanner:", err);
                    setError("Failed to start camera. Please ensure permissions are granted.");
                }
            } else {
                // Retry if element not found yet
                setTimeout(checkAndInit, 100);
            }
        };

        const timer = setTimeout(checkAndInit, 100);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch(console.error);
                } catch (e) {
                    console.error("Error clearing scanner", e);
                }
            }
        };
    }, [isOpen, onScan, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Scan Product</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 bg-gray-50">
                    {error ? (
                        <div className="text-center text-red-600 p-4 border border-red-200 rounded-xl bg-red-50">
                            {error}
                        </div>
                    ) : (
                        <div className="rounded-xl overflow-hidden bg-black relative min-h-[300px]">
                            <div id="reader" className="w-full h-full"></div>
                        </div>
                    )}
                    <p className="text-center text-gray-500 mt-4 text-sm">
                        Point camera at a barcode to scan
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ScanBarcodeModal;
