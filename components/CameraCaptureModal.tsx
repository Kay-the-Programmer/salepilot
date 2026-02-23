
import React, { useState, useRef, useEffect, useCallback } from 'react';
import XMarkIcon from './icons/XMarkIcon';
import CameraIcon from './icons/CameraIcon';

interface CameraCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageDataUrl: string) => void;
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(mediaStream => {
                    streamRef.current = mediaStream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                })
                .catch(err => {
                    console.error("Error accessing camera:", err);
                    setError("Could not access the camera. Please ensure you have granted permission and are using a secure connection (HTTPS).");
                });
        } else {
            stopStream();
        }

        return () => {
            stopStream();
        };
    }, [isOpen, stopStream]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                onCapture(dataUrl);
            }
        }
    };

    const handleClose = () => {
        stopStream();
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center animate-fade-in" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="liquid-glass-card rounded-[2rem] w-full rounded-t-3xl sm: overflow-hidden flex flex-col animate-slide-up sm:max-w-2xl">
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-center border-b">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Capture Image
                    </h3>
                    <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-500">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 bg-black relative">
                    {error ? (
                        <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>
                    ) : (
                        <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-md" />
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-center items-center">
                    <button
                        type="button"
                        onClick={handleCapture}
                        disabled={!!error}
                        className="p-4 rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 active:scale-95 transition-all duration-300"
                        aria-label="Capture photo"
                    >
                        <CameraIcon className="w-8 h-8" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CameraCaptureModal;
