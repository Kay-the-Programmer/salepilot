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
    const onScanSuccessRef = useRef(onScanSuccess);
    const onScanErrorRef = useRef(onScanError);
    const onCloseRef = useRef(onClose);
    const continuousRef = useRef(continuous);
    const delayBetweenScansRef = useRef(delayBetweenScans);

    useEffect(() => {
        pausedRef.current = paused;
    }, [paused]);

    useEffect(() => {
        onScanSuccessRef.current = onScanSuccess;
    }, [onScanSuccess]);

    useEffect(() => {
        onScanErrorRef.current = onScanError;
    }, [onScanError]);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        continuousRef.current = continuous;
        delayBetweenScansRef.current = delayBetweenScans;
    }, [continuous, delayBetweenScans]);

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
                    BarcodeFormat.CODE_93,
                    BarcodeFormat.CODABAR,
                    BarcodeFormat.ITF,
                    BarcodeFormat.QR_CODE
                ]);
                // hints.set(DecodeHintType.TRY_HARDER, true); // Removed for performance on low-end hardware

                const codeReader = new BrowserMultiFormatReader(hints);
                codeReaderRef.current = codeReader;

                // Get video element
                if (!videoRef.current) {
                    throw new Error('Video element not ready');
                }

                // Start decoding with constraints optimized for fast mobile initialization and decoding
                // Skipping exact deviceId enumeration makes `getUserMedia` resolve significantly faster.
                // Requesting standard VGA (640x480) instead of 720p drastically speeds up hardware initialization
                // and frame processing on low-end mobile devices, improving scanner frame rate.
                const constraints: MediaStreamConstraints = {
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        frameRate: { ideal: 10, max: 15 },
                        facingMode: facingMode
                    }
                };

                // Add timeout for camera initialization
                const streamPromise = navigator.mediaDevices.getUserMedia(constraints);
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Camera initialization timed out')), 8000)
                );

                const stream = await Promise.race([streamPromise, timeoutPromise]);
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
                        if (now - lastScanTimeRef.current < delayBetweenScansRef.current) {
                            // Too soon, schedule next decode
                            setTimeout(decode, 300);
                            return;
                        }

                        lastScanTimeRef.current = now;
                        provideFeedback();
                        if (onScanSuccessRef.current) {
                            onScanSuccessRef.current(result.getText());
                        }

                        if (continuousRef.current && scanningRef.current) {
                            // Continue scanning
                            setTimeout(decode, delayBetweenScansRef.current);
                        } else {
                            // Single scan mode - close after success
                            cleanup().then(() => {
                                if (isMounted) onCloseRef.current();
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
                        console.error('Decode error:', err);
                        if (onScanErrorRef.current) {
                            onScanErrorRef.current(err.message);
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
                } else if (errString.includes('timed out')) {
                    errorMsg = "Camera took too long to start. Please restart the app or device.";
                } else {
                    errorMsg = "Failed to start camera. Please ensure permissions are granted and try again.";
                }

                setError(errorMsg);
                setIsInitializing(false);
            }
        };

        // Use minimal timeout to allow UI to render first without artificial delay
        const timer = setTimeout(initScanner, 10);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            cleanup();
        };
    }, [isOpen, cleanup, provideFeedback, facingMode]);



    // If not open, don't render anything
    if (!isOpen) return null;

    if (variant === 'embedded') {
        return (
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] shadow-sm w-full h-full flex flex-col overflow-hidden border border-slate-200/50 dark:border-white/10 relative">
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
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/50 shadow-[0_0_15px_rgba(0,43,107,0.8)] animate-scan-line"></div>
                                    <div className={`absolute inset-0 bg-white transition-opacity duration-150 ${isFlashing ? 'opacity-40' : 'opacity-0'}`}></div>

                                    {/* Simplified Box for embedded view */}
                                    <div className="absolute border-2 border-primary/80 rounded-xl shadow-[0_0_20px_rgba(0,43,107,0.3)]" style={{
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
                                            className="absolute bottom-3 left-3 pointer-events-auto p-2 rounded-full backdrop-blur-md bg-black/30 text-white border border-white/20 hover:bg-black/50 transition-all active:scale-90 disabled:opacity-50 active:scale-95 transition-all duration-300"
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
        <div
            className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-xs bg-surface border border-brand-border rounded-2xl overflow-hidden shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between pl-4 pr-2 h-12 border-b border-brand-border">
                    <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-bold text-brand-text truncate">{title}</h3>
                        {continuous && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success uppercase tracking-wider flex-shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />Live
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="w-9 h-9 flex items-center justify-center rounded-full text-brand-text-muted hover:bg-surface-variant active:scale-90 transition"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Scanner area */}
                <div className="relative bg-black aspect-square overflow-hidden">
                    {isInitializing && !error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black">
                            <div className="w-9 h-9 border-4 border-white/20 border-t-white rounded-full animate-spin mb-3"></div>
                            <p className="text-white/60 text-xs font-medium">Starting camera…</p>
                        </div>
                    )}

                    {error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-surface">
                            <div className="w-12 h-12 bg-danger-muted text-danger rounded-full flex items-center justify-center mb-3">
                                <FiX className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-brand-text text-sm mb-1">Camera error</h4>
                            <p className="text-brand-text-muted text-xs leading-relaxed mb-4">{error}</p>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-xs active:scale-95 transition"
                            >
                                Dismiss
                            </button>
                        </div>
                    ) : (
                        <>
                            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

                            {!isInitializing && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    {/* Scan line */}
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/60 shadow-[0_0_15px_rgba(0,43,107,0.8)] animate-scan-line"></div>

                                    {/* Capture flash */}
                                    <div className={`absolute inset-0 bg-white transition-opacity duration-150 ${isFlashing ? 'opacity-40' : 'opacity-0'}`}></div>

                                    {/* Scan box */}
                                    <div className="absolute border-2 border-primary rounded-xl shadow-[0_0_20px_rgba(0,43,107,0.4)]" style={{ width: '82%', height: '46%' }}>
                                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                                    </div>

                                    {/* Vignette */}
                                    <div className="absolute inset-0 bg-black/20"></div>

                                    {hasMultipleCameras && (
                                        <button
                                            type="button"
                                            onClick={handleCameraSwitch}
                                            disabled={isInitializing}
                                            aria-label="Switch camera"
                                            className="absolute bottom-3 left-3 pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white border border-white/20 active:scale-90 transition disabled:opacity-50"
                                        >
                                            <FiRefreshCw className={`w-5 h-5 ${isInitializing ? 'animate-spin' : ''}`} />
                                        </button>
                                    )}

                                    {hasTorch && (
                                        <button
                                            type="button"
                                            onClick={handleTorchToggle}
                                            aria-label="Toggle flashlight"
                                            className={`absolute bottom-3 right-3 pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition ${isTorchOn ? 'bg-secondary text-white' : 'bg-black/40 text-white border border-white/20'}`}
                                        >
                                            {isTorchOn ? <FiZapOff className="w-5 h-5" /> : <FiZap className="w-5 h-5" />}
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer hint */}
                <div className="px-4 py-2.5 bg-surface border-t border-brand-border">
                    <p className="text-center text-brand-text-muted text-xs font-medium">
                        {continuous ? 'Items are added automatically as you scan.' : 'Position the code within the frame.'}
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes scan-line { 0% { top: 0; } 100% { top: 100%; } }
                .animate-scan-line { animation: scan-line 3s linear infinite; }
            `}</style>
        </div>
    );
};

export default UnifiedScannerModal;
