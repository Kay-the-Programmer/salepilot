import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { FiX } from 'react-icons/fi';

interface ScanBarcodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
}

const ScanBarcodeModal: React.FC<ScanBarcodeModalProps> = ({ isOpen, onClose, onScan }) => {
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isRunningRef = useRef<boolean>(false);

    useEffect(() => {
        if (!isOpen) return;

        // Cleanup function to stop scanner if it's running
        const cleanup = async () => {
            if (scannerRef.current && isRunningRef.current) {
                try {
                    await scannerRef.current.stop();
                    isRunningRef.current = false;
                } catch (e) {
                    console.error("Failed to stop scanner", e);
                }
            }
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear();
                } catch (e) {
                    console.error("Failed to clear scanner", e);
                }
                scannerRef.current = null;
            }
        };

        const initScanner = async () => {
            // Wait for the DOM element to be ready
            const element = document.getElementById("reader");
            if (!element) {
                setTimeout(initScanner, 100);
                return;
            }

            // Clean up any existing instance first
            await cleanup();

            try {
                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        // Success callback
                        if (isRunningRef.current) {
                            cleanup().then(() => {
                                onScan(decodedText);
                                onClose();
                            });
                        }
                    },
                    (errorMessage) => {
                        // Error callback - ignore for frame errors
                    }
                );
                isRunningRef.current = true;
            } catch (err) {
                console.error("Error starting scanner:", err);
                setError("Failed to start camera. Please ensure permissions are granted.");
            }
        };

        // Small delay to ensure animation/modal transition doesn't interfere
        const timer = setTimeout(initScanner, 300);

        return () => {
            clearTimeout(timer);
            cleanup();
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
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
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
