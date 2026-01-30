import React from 'react';
import ChartBarIcon from '../../icons/ChartBarIcon';
import RefreshIcon from '../../icons/RefreshIcon';

interface MobileViewMenuProps {
    isOpen: boolean;
    onClose: () => void;
    mobileView: 'summary' | 'history';
    setMobileView: (view: 'summary' | 'history') => void;
}

export default function MobileViewMenu({ isOpen, onClose, mobileView, setMobileView }: MobileViewMenuProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 animate-fade-in" />
            {/* Position below header roughly */}
            <div
                className="absolute top-[60px] right-4 left-auto w-48 bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up border border-gray-100 p-2"
                onClick={e => e.stopPropagation()}
            >
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => {
                            setMobileView('summary');
                            onClose();
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${mobileView === 'summary'
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <ChartBarIcon className="w-6 h-6 mb-1" />
                        <span className="text-xs font-semibold">Summary</span>
                    </button>
                    <button
                        onClick={() => {
                            setMobileView('history');
                            onClose();
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${mobileView === 'history'
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <RefreshIcon className="w-6 h-6 mb-1" />
                        <span className="text-xs font-semibold">History</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
