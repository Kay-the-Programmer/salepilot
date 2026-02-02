import React, { useEffect } from 'react';
import { XMarkIcon } from '../icons';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    subHeader?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    closeOnOutsideClick?: boolean;
    className?: string;
    noPadding?: boolean;
}

const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    full: 'sm:max-w-full sm:m-4'
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    closeOnOutsideClick = true,
    className = ''
}) => {
    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 flex items-end sm:items-center justify-center animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={closeOnOutsideClick ? onClose : undefined}
        >
            <div
                // We use 'glass-effect' as a class if it's defined in CSS, or we can use the attribute if the project uses it.
                // Based on ProductFormModal, it uses `glass-effect=""` attribute.
                // I'll add the attribute and also keeping standard classes as fallback/enhancement.
                {...{ "glass-effect": "" }}
                className={`w-full rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up bg-white dark:bg-slate-900/95 border border-white/20 dark:border-slate-700/50 ${sizeClasses[size]} ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* iOS-style drag handle for mobile - visual cue only for now */}
                <div className="sm:hidden pt-2 pb-0 flex justify-center flex-shrink-0">
                    <div className="w-10 h-1 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                </div>

                {/* Header */}
                {(title || onClose) && (
                    <div className="flex-shrink-0 border-b border-gray-100 dark:border-slate-800 bg-inherit z-10">
                        <div className="px-6 py-4 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                {title && (
                                typeof title === 'string' ? (
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 truncate" id="modal-title">
                                        {title}
                                    </h3>
                                ) : (
                                    <div className="text-lg font-bold text-gray-900 dark:text-slate-100" id="modal-title">
                                        {title}
                                    </div>
                                )
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="ml-4 p-2 -mr-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                aria-label="Close"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        {subHeader}
                    </div>
                )}

                {/* Body */}
                <div className={`flex-1 overflow-y-auto ${noPadding ? '' : 'p-6'}`}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
