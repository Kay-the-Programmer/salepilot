import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { FiX, FiZap, FiZapOff } from 'react-icons/fi';
import XMarkIcon from './icons/XMarkIcon';

interface UnifiedScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
    onScanError?: (errorMessage: string) => void;
    title?: string;
    continuous?: boolean;
    delayBetweenScans?: number; // ms
}

const UnifiedScannerModal: React.FC<UnifiedScannerModalProps> = ({
    isOpen,
    onClose,
    onScanSuccess,
    onScanError,
    title = "Scan Barcode",
    continuous = false,
    delayBetweenScans = 1500
}) => {
    const [error, setError] = useState<string | null>(null);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [hasTorch, setHasTorch] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isRunningRef = useRef<boolean>(false);
    const lastScanTimeRef = useRef<number>(0);
    const readerId = "unified-scanner-reader";

    // Initialize beep sound
    useEffect(() => {
        // Simple beep sound using Web Audio API or a small base64 wav
        // Using a synthesized beep for reliability
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();

        const playBeep = () => {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, context.currentTime); // A5

            gainNode.gain.setValueAtTime(0.1, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            oscillator.start();
            oscillator.stop(context.currentTime + 0.1);
        };

        (window as any)._playScannerBeep = playBeep;
    }, []);

    const provideFeedback = useCallback(() => {
        // Audio feedback
        if ((window as any)._playScannerBeep) {
            (window as any)._playScannerBeep();
        }

        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(100);
        }
    }, []);

    const handleTorchToggle = async () => {
        if (!scannerRef.current || !isRunningRef.current) return;

        try {
            const newState = !isTorchOn;
            await scannerRef.current.applyVideoConstraints({
                advanced: [{ torch: newState }] as any
            });
            setIsTorchOn(newState);
        } catch (err) {
            console.error("Failed to toggle torch:", err);
        }
    };

    const cleanup = useCallback(async () => {
        if (scannerRef.current && isRunningRef.current) {
            try {
                await scannerRef.current.stop();
                isRunningRef.current = false;
                setIsTorchOn(false);
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
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const initScanner = async () => {
            setIsInitializing(true);
            setError(null);

            const element = document.getElementById(readerId);
            if (!element) {
                setTimeout(initScanner, 100);
                return;
            }

            await cleanup();

            try {
                const html5QrCode = new Html5Qrcode(readerId);
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 25, // Higher FPS for smoother scanning
                    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const size = Math.floor(minEdge * 0.7);
                        return { width: size, height: size };
                    },
                    aspectRatio: 1.0,
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.QR_CODE,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.CODE_39,
                        Html5QrcodeSupportedFormats.UPC_A,
                        Html5QrcodeSupportedFormats.UPC_E,
                    ]
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        const now = Date.now();
                        if (now - lastScanTimeRef.current < delayBetweenScans) return;

                        lastScanTimeRef.current = now;
                        provideFeedback();
                        onScanSuccess(decodedText);

                        if (!continuous) {
                            cleanup().then(() => onClose());
                        }
                    },
                    () => {
                        // Regular frame error - ignore
                    }
                );

                isRunningRef.current = true;
                setIsInitializing(false);

                // Check for torch capability
                const capabilities = html5QrCode.getRunningTrackCapabilities();
                if ((capabilities as any).torch) {
                    setHasTorch(true);
                }
            } catch (err) {
                console.error("Error starting scanner:", err);
                setError("Failed to start camera. Please ensure permissions are granted.");
                setIsInitializing(false);
            }
        };

        const timer = setTimeout(initScanner, 300);

        return () => {
            clearTimeout(timer);
            cleanup();
        };
    }, [isOpen, onScanSuccess, onClose, continuous, delayBetweenScans, cleanup, provideFeedback]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-slide-up ring-1 ring-white/20">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{title}</h3>
                        {continuous && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Continuous Mode</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all active:scale-95"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="relative bg-black aspect-square overflow-hidden">
                    {isInitializing && !error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black">
                            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                            <p className="text-white/60 text-sm font-medium">Initializing camera...</p>
                        </div>
                    )}

                    {error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10 bg-gray-50">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                                <FiX className="w-8 h-8" />
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2">Camera Error</h4>
                            <p className="text-gray-500 text-sm leading-relaxed mb-6">{error}</p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-semibold text-sm shadow-lg active:scale-95 transition-all"
                            >
                                Dismiss
                            </button>
                        </div>
                    ) : (
                        <>
                            <div id={readerId} className="w-full h-full scanner-container"></div>

                            {/* Scanning Overlay UI */}
                            {!isInitializing && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    {/* Scan Line Animation */}
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan-line"></div>

                                    {/* Vignette effect */}
                                    <div className="absolute inset-0 bg-black/20"></div>

                                    {/* Torch Control Button */}
                                    {hasTorch && (
                                        <button
                                            onClick={handleTorchToggle}
                                            className={`absolute bottom-6 right-6 pointer-events-auto p-4 rounded-full backdrop-blur-xl transition-all active:scale-90 ${isTorchOn
                                                ? 'bg-yellow-400 text-white shadow-xl shadow-yellow-400/20'
                                                : 'bg-white/10 text-white border border-white/20'
                                                }`}
                                        >
                                            {isTorchOn ? <FiZapOff className="w-6 h-6" /> : <FiZap className="w-6 h-6" />}
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-center text-gray-600 text-sm font-medium">
                            {continuous
                                ? "Items will be added automatically as you scan."
                                : "Position code within the box to scan."
                            }
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scan-line {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .animate-scan-line {
                    animation: scan-line 3s linear infinite;
                }
                .scanner-container video {
                    object-fit: cover !important;
                }
                #unified-scanner-reader {
                    border: none !important;
                }
                #unified-scanner-reader__scan_region {
                    background: transparent !important;
                }
                #unified-scanner-reader__dashboard {
                    display: none !important;
                }
            `}</style>
        </div>
    );
};

export default UnifiedScannerModal;
