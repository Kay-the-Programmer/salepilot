import React from 'react';
import LocationPicker, { LocationData } from './LocationPicker';
import { HiXMark } from 'react-icons/hi2';

interface LocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (location: LocationData) => void;
    initialLat?: number;
    initialLng?: number;
    initialAddress?: string;
    title?: string;
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    initialLat,
    initialLng,
    initialAddress,
    title = "Select Location"
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-end justify-center md:items-center safe-area-bottom transition-all duration-300 font-google"
            onClick={onClose}
        >
            <div
                className="bg-white/95 dark:bg-slate-900/95 w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 md:zoom-in-95 duration-300 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">Use the map to pin your exact location</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
                    >
                        <HiXMark className="w-6 h-6" />
                    </button>
                </div>

                {/* Map Body */}
                <div className="flex-1 min-h-[400px]">
                    <LocationPicker
                        initialLat={initialLat}
                        initialLng={initialLng}
                        initialAddress={initialAddress}
                        onLocationSelect={onSelect}
                        className="h-full rounded-none border-none shadow-none"
                    />
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-8 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onClose}
                        className="px-12 py-3.5 bg-blue-600 dark:bg-blue-500 text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:bg-blue-700 dark:hover:bg-blue-600 transition-all active:scale-95"
                    >
                        Confirm Selection
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes zoom-in-95 {
                    0% { transform: scale(0.95); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .md\\:zoom-in-95 {
                    animation: zoom-in-95 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>
        </div>
    );
};

export default LocationPickerModal;
