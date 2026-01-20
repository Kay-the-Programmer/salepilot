import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import { FiX, FiZap, FiZapOff, FiRefreshCw } from 'react-icons/fi';
import XMarkIcon from './icons/XMarkIcon';

interface UnifiedScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
    onScanError?: (errorMessage: string) => void;
    title?: string;
    continuous?: boolean;
    delayBetweenScans?: number; // ms
    variant?: 'modal' | 'embedded';
    paused?: boolean;
}

const UnifiedScannerModal: React.FC<UnifiedScannerModalProps> = ({
    isOpen,
    onClose,
    onScanSuccess,
    onScanError,
    title = "Scan Barcode",
    continuous = false,
    delayBetweenScans = 1500,
    variant = 'modal',
    paused = false
}) => {
    const [error, setError] = useState<string | null>(null);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [hasTorch, setHasTorch] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isFlashing, setIsFlashing] = useState(false);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const lastScanTimeRef = useRef<number>(0);
    const scanningRef = useRef<boolean>(false);
    const pausedRef = useRef<boolean>(paused);

    useEffect(() => {
        pausedRef.current = paused;
    }, [paused]);

    // Initialize beep sound
    useEffect(() => {
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

    // Check for multiple cameras
    useEffect(() => {
        if (!isOpen) return;

        navigator.mediaDevices.enumerateDevices().then(devices => {
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setHasMultipleCameras(videoDevices.length > 1);
        }).catch(err => {
            console.error("Error checking cameras:", err);
            setHasMultipleCameras(false);
        });
    }, [isOpen]);

    const provideFeedback = useCallback(() => {
        // Audio feedback
        if ((window as any)._playScannerBeep) {
            (window as any)._playScannerBeep();
        }

        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(100);
        }

        // Visual haptic fallback (especially for iOS)
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 150);
    }, []);

    const handleTorchToggle = async () => {
        if (!streamRef.current) return;

        try {
            const track = streamRef.current.getVideoTracks()[0];
            const capabilities = track.getCapabilities() as any;

            if (capabilities.torch) {
                const newState = !isTorchOn;
                await track.applyConstraints({
                    advanced: [{ torch: newState }] as any
                });
                setIsTorchOn(newState);
            }
        } catch (err) {
            console.error("Failed to toggle torch:", err);
        }
    };

    const handleCameraSwitch = () => {
        if (isInitializing) return;
        setFacingMode(prev => prev === "environment" ? "user" : "environment");
    };

    const cleanup = useCallback(async () => {
        scanningRef.current = false;

        // Stop the stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Reset the code reader


        setIsTorchOn(false);
        setHasTorch(false);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        const initScanner = async () => {
            if (!isMounted) return;

            setIsInitializing(true);
            setError(null);
            setHasTorch(false);

            await cleanup();
            if (!isMounted) return;

            try {
                // Create ZXing reader with barcode format hints
                const hints = new Map();
                hints.set(DecodeHintType.POSSIBLE_FORMATS, [
                    BarcodeFormat.UPC_A,
                    BarcodeFormat.UPC_E,
                    BarcodeFormat.EAN_13,
                    BarcodeFormat.EAN_8,
                    BarcodeFormat.CODE_128,
                    BarcodeFormat.CODE_39,
                    BarcodeFormat.QR_CODE
                ]);

                const codeReader = new BrowserMultiFormatReader(hints);
                codeReaderRef.current = codeReader;

                // Get video devices
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');

                if (videoDevices.length === 0) {
                    throw new Error('No camera found');
                }

                // Select camera based on facing mode
                let selectedDeviceId = videoDevices[0].deviceId;

                if (facingMode === 'environment') {
                    // Try to find back camera
                    const backCamera = videoDevices.find(device =>
                        /back|rear|environment/i.test(device.label)
                    );
                    if (backCamera) {
                        selectedDeviceId = backCamera.deviceId;
                    } else if (videoDevices.length > 1) {
                        // Usually the second camera is the back camera on mobile
                        selectedDeviceId = videoDevices[1].deviceId;
                    }
                } else {
                    // Try to find front camera
                    const frontCamera = videoDevices.find(device =>
                        /front|user|selfie|face/i.test(device.label)
                    );
                    if (frontCamera) {
                        selectedDeviceId = frontCamera.deviceId;
                    }
                }

                // Get video element
                if (!videoRef.current) {
                    throw new Error('Video element not ready');
                }

                // Start decoding with constraints optimized for mobile
                const constraints: MediaStreamConstraints = {
                    video: {
                        deviceId: selectedDeviceId,
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: facingMode
                    }
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                streamRef.current = stream;

                if (!isMounted) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                // Attach stream to video
                videoRef.current.srcObject = stream;
                // Only play if not already playing to avoid error
                if (videoRef.current.paused) {
                    await videoRef.current.play();
                }

                // Check for torch capability
                const track = stream.getVideoTracks()[0];
                const capabilities = track.getCapabilities() as any;
                if (capabilities.torch) {
                    setHasTorch(true);
                }

                // Try to enable continuous autofocus
                try {
                    if (capabilities.focusMode?.includes('continuous')) {
                        await track.applyConstraints({
                            advanced: [{ focusMode: 'continuous' }] as any
                        });
                    }
                } catch (err) {
                    console.log('Continuous focus not available');
                }

                if (!isMounted) return;
                setIsInitializing(false);
                scanningRef.current = true;

                // Start continuous decoding
                const decode = async () => {
                    if (!scanningRef.current || !videoRef.current || !codeReaderRef.current) {
                        return;
                    }

                    if (pausedRef.current) {
                        setTimeout(decode, 500);
                        return;
                    }

                    try {
                        if (!streamRef.current) return;

                        // Use decodeFromStream to support our manual stream management (with torch/constraints)
                        // @ts-ignore - decodeOnceFromStream is available in newer versions but might be missing in types
                        const result = await codeReaderRef.current.decodeOnceFromStream(
                            streamRef.current,
                            videoRef.current
                        );

                        if (!scanningRef.current || !isMounted) return;

                        if (pausedRef.current) {
                            setTimeout(decode, 500);
                            return;
                        }

                        const now = Date.now();
                        if (now - lastScanTimeRef.current < delayBetweenScans) {
                            // Too soon, schedule next decode
                            setTimeout(decode, 300);
                            return;
                        }

                        lastScanTimeRef.current = now;
                        provideFeedback();
                        onScanSuccess(result.getText());

                        if (continuous && scanningRef.current) {
                            // Continue scanning
                            setTimeout(decode, delayBetweenScans);
                        } else {
                            // Single scan mode - close after success
                            cleanup().then(() => {
                                if (isMounted) onClose();
                            });
                        }
                    } catch (err: any) {
                        if (!scanningRef.current || !isMounted) return;

                        // These are normal "no barcode found" errors, continue scanning
                        if (err?.name === 'NotFoundException' || err?.message?.includes('No barcode')) {
                            setTimeout(decode, 300);
                            return;
                        }

                        // Real error
                        console.error('Decode error:', err);
                        if (onScanError) {
                            onScanError(err.message);
                        }

                        // Continue trying
                        setTimeout(decode, 300);
                    }
                };

                // Start decoding loop
                decode();

            } catch (err: any) {
                if (!isMounted) return;
                console.error("Error starting scanner:", err);

                // Provide specific error messages
                let errorMsg = "Failed to start camera.";
                const errString = err?.toString() || '';

                if (errString.includes('NotAllowedError') || errString.includes('Permission')) {
                    errorMsg = "Camera permission denied. Please allow camera access in your browser settings.";
                } else if (errString.includes('NotFoundError') || errString.includes('Camera not found')) {
                    errorMsg = "No camera found on this device.";
                } else if (errString.includes('NotReadableError') || errString.includes('in use')) {
                    errorMsg = "Camera is in use by another app. Please close other apps using the camera.";
                } else {
                    errorMsg = "Failed to start camera. Please ensure permissions are granted and try again.";
                }

                setError(errorMsg);
                setIsInitializing(false);
            }
        };

        const timer = setTimeout(initScanner, 300);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            cleanup();
        };
    }, [isOpen, onScanSuccess, onClose, continuous, delayBetweenScans, cleanup, provideFeedback, facingMode, onScanError]);

    if (!isOpen) return null;

    if (!isOpen) return null;

    if (variant === 'embedded') {
        return (
            <div className="w-full h-full flex flex-col bg-white overflow-hidden rounded-xl border border-slate-200 shadow-inner relative">
                {/* Scanner Area */}
                <div className="relative bg-black flex-1 w-full overflow-hidden">
                    {isInitializing && !error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black">
                            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mb-3"></div>
                            <p className="text-white/60 text-xs font-medium">Initializing...</p>
                        </div>
                    )}

                    {error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 bg-slate-50">
                            <div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
                                <FiX className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1">Camera Error</h4>
                            <p className="text-slate-500 text-xs leading-relaxed mb-3 break-words max-w-full px-2">{error}</p>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold text-xs shadow-sm active:scale-95 transition-all"
                            >
                                Dismiss
                            </button>
                        </div>
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                playsInline
                                muted
                            />

                            {!isInitializing && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan-line"></div>
                                    <div className={`absolute inset-0 bg-white transition-opacity duration-150 ${isFlashing ? 'opacity-40' : 'opacity-0'}`}></div>

                                    {/* Simplified Box for embedded view */}
                                    <div className="absolute border-2 border-blue-500/80 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)]" style={{
                                        width: '80%',
                                        height: '60%',
                                    }}>
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl-lg"></div>
                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr-lg"></div>
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl-lg"></div>
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white rounded-br-lg"></div>
                                    </div>

                                    {/* Interactive Controls */}
                                    {hasMultipleCameras && (
                                        <button
                                            onClick={handleCameraSwitch}
                                            disabled={isInitializing}
                                            className="absolute bottom-3 left-3 pointer-events-auto p-2 rounded-full backdrop-blur-md bg-black/30 text-white border border-white/20 hover:bg-black/50 transition-all active:scale-90 disabled:opacity-50"
                                            title="Switch Camera"
                                        >
                                            <FiRefreshCw className={`w-4 h-4 ${isInitializing ? 'animate-spin' : ''}`} />
                                        </button>
                                    )}

                                    {hasTorch && (
                                        <button
                                            onClick={handleTorchToggle}
                                            className={`absolute bottom-3 right-3 pointer-events-auto p-2 rounded-full backdrop-blur-md transition-all active:scale-90 ${isTorchOn
                                                ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-400/20'
                                                : 'bg-black/30 text-white border border-white/20 hover:bg-black/50'
                                                }`}
                                            title="Toggle Flashlight"
                                        >
                                            {isTorchOn ? <FiZapOff className="w-4 h-4" /> : <FiZap className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
                <style>{`
                    @keyframes scan-line {
                        0% { top: 0; }
                        100% { top: 100%; }
                    }
                    .animate-scan-line {
                        animation: scan-line 2s linear infinite;
                    }
                `}</style>
            </div>
        );
    }

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
                            {/* Video Element */}
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                playsInline
                                muted
                            />

                            {/* Scanning Overlay UI */}
                            {!isInitializing && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    {/* Scan Line Animation */}
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan-line"></div>

                                    {/* Visual Haptic Flash */}
                                    <div className={`absolute inset-0 bg-white transition-opacity duration-150 ${isFlashing ? 'opacity-40' : 'opacity-0'}`}></div>

                                    {/* Scanning Box */}
                                    <div className="absolute border-4 border-blue-500 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.5)]" style={{
                                        width: '90%',
                                        height: '40%',
                                        maxWidth: '500px',
                                        maxHeight: '250px'
                                    }}>
                                        {/* Corner indicators */}
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                                    </div>

                                    {/* Vignette effect */}
                                    <div className="absolute inset-0 bg-black/20"></div>

                                    {/* Camera Switch Button */}
                                    {hasMultipleCameras && (
                                        <button
                                            onClick={handleCameraSwitch}
                                            disabled={isInitializing}
                                            className="absolute bottom-6 left-6 pointer-events-auto p-4 rounded-full backdrop-blur-xl bg-white/10 text-white border border-white/20 transition-all active:scale-90 disabled:opacity-50"
                                        >
                                            <FiRefreshCw className={`w-6 h-6 transition-transform duration-500 ${isInitializing ? 'animate-spin' : ''}`} />
                                        </button>
                                    )}

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
            `}</style>
        </div>
    );
};

export default UnifiedScannerModal;
