import React from 'react';
import ChartBarIcon from '../../icons/ChartBarIcon';

interface MobileViewMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileViewMenu({ isOpen, onClose }: MobileViewMenuProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 animate-fade-in" />
            {/* Position below header roughly */}
            <div
                className="absolute top-[60px] right-4 left-auto w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up border border-gray-100 dark:border-white/10 p-2"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col gap-1">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-gray-700 dark:text-gray-300 font-medium"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                            <ChartBarIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <span>View Reports</span>
                    </button>
                    {/* Add more menu items here if needed */}
                </div>
            </div>
        </div>
    );
};
