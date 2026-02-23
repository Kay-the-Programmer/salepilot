import React from 'react';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import { Button } from './ui/Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
    variant?: 'modal' | 'floating';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonClass = 'bg-red-600 hover:bg-red-500',
    variant = 'modal'
}) => {
    if (!isOpen) return null;

    if (variant === 'floating') {
        return (
            <div className="fixed inset-0 z-[200] flex items-start justify-end p-4 pointer-events-none">
                <div className="absolute inset-0 glass-effect backdrop-blur-[2px] pointer-events-auto" onClick={onClose} />
                <div className="relative w-full max-w-sm glass-effect backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden animate-fade-in-up pointer-events-auto mt-14 sm:mt-2">
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20">
                                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-tight">
                                    {title}
                                </h3>
                                <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                                    {message}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex items-center gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={onClose}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            type="button"
                            variant={confirmButtonClass.includes('red') ? 'danger' : 'primary'}
                            className={`flex-1 ${confirmButtonClass}`}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose} />
            <div
                className="w-full liquid-glass rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-glass-appear sm:max-w-md border-none relative z-10 max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* iOS-style drag handle for mobile */}
                <div className="sm:hidden pt-2 pb-0 flex justify-center">
                    <div className="w-10 h-1 bg-gray-200 dark:bg-slate-800 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="px-8 pt-8 pb-4">
                    <div className="flex items-start gap-5">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[1.25rem] bg-red-100 dark:bg-red-500/20 shadow-inner">
                            <ExclamationTriangleIcon className="h-7 w-7 text-red-600 dark:text-red-400" aria-hidden="true" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white font-google" id="modal-title">
                                {title}
                            </h3>
                            <div className="mt-2">
                                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {message}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 flex items-center gap-4">
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 py-3 px-6 rounded-full font-bold active:scale-95 transition-all border border-slate-200 dark:border-white/10"
                        onClick={onClose}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={confirmButtonClass.includes('red') ? 'danger' : 'primary'}
                        className={`flex-1 py-3 px-6 rounded-full font-bold shadow-lg active:scale-95 transition-all ${confirmButtonClass.includes('red') ? 'shadow-red-500/20' : 'shadow-blue-500/20'}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
