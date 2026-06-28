import React, { useState, useRef, useEffect, useCallback } from 'react';
import XMarkIcon from './icons/XMarkIcon';
import CameraIcon from './icons/CameraIcon';

interface CameraCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageDataUrl: string) => void;
}

/**
 * Minimal Velocity-styled camera capture overlay. A small centred card (not a
 * full-screen sheet) over a light scrim. Performance-minded: the camera stream
 * is only acquired while open, torn down on close/unmount, audio is never
 * requested, and a modest resolution keeps init + memory light.
 */
const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    }, []);

    // Acquire the camera only while open; tear it down on close/unmount.
    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        setError(null);
        navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
        })
            .then(stream => {
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch(() => { if (!cancelled) setError('Could not access the camera. Check permissions and use a secure (HTTPS) connection.'); });
        return () => { cancelled = true; stopStream(); };
    }, [isOpen, stopStream]);

    const handleClose = useCallback(() => { stopStream(); onClose(); }, [stopStream, onClose]);

    // Close on Escape.
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, handleClose]);

    const handleCapture = useCallback(() => {
        const video = videoRef.current, canvas = canvasRef.current;
        if (!video || !canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        onCapture(canvas.toDataURL('image/jpeg', 0.85));
    }, [onCapture]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="Capture photo"
            onClick={handleClose}
        >
            <div
                className="relative w-full max-w-xs bg-surface border border-brand-border rounded-2xl overflow-hidden shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pl-4 pr-2 h-12 border-b border-brand-border">
                    <h3 className="text-sm font-bold text-brand-text">Capture photo</h3>
                    <button
                        type="button"
                        onClick={handleClose}
                        aria-label="Close"
                        className="w-9 h-9 flex items-center justify-center rounded-full text-brand-text-muted hover:bg-surface-variant active:scale-90 transition"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-black flex items-center justify-center min-h-[200px]">
                    {error ? (
                        <p className="text-danger text-sm text-center px-5 py-10">{error}</p>
                    ) : (
                        <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[52vh] object-contain" />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="flex justify-center py-3 bg-surface">
                    <button
                        type="button"
                        onClick={handleCapture}
                        disabled={!!error}
                        aria-label="Capture"
                        className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary-dark active:scale-95 transition disabled:opacity-40 disabled:active:scale-100"
                    >
                        <CameraIcon className="w-7 h-7" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(CameraCaptureModal);
