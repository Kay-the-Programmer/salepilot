import React from 'react';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
    confirmButtonVariant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
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
    confirmButtonClass,
    confirmButtonVariant,
    variant = 'modal'
}) => {
    // Determine button variant. Priority: prop > check class > default 'danger' (to match original behavior where default class was red)
    const btnVariant = confirmButtonVariant || (confirmButtonClass && !confirmButtonClass.includes('red') ? 'primary' : 'danger');

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
                            variant={btnVariant}
                            className={`flex-1 ${confirmButtonClass || ''}`}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const footerContent = (
        <div className="flex items-center gap-3 w-full">
            <Button
                type="button"
                variant="secondary"
                className="flex-1 dark:bg-slate-800/50"
                onClick={onClose}
            >
                {cancelText}
            </Button>
            <Button
                type="button"
                variant={btnVariant}
                className={`flex-1 ${confirmButtonClass || ''}`}
                onClick={onConfirm}
            >
                {confirmText}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="md"
            footer={footerContent}
            // We do not pass title to Modal because we use a custom header structure with icon in children
        >
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100" id="modal-title">
                        {title}
                    </h3>
                    <div className="mt-1">
                        <div className="text-sm text-gray-500 dark:text-slate-400">
                            {message}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
