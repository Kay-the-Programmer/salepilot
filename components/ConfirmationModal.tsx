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
                <div className="absolute inset-0 bg-slate-900/5 pointer-events-auto" onClick={onClose} />
                <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up pointer-events-auto mt-14 sm:mt-2">
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50">
                                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" aria-hidden="true" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-slate-900 leading-tight">
                                    {title}
                                </h3>
                                <div className="mt-1 text-sm text-slate-500">
                                    {message}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50/50 px-6 py-4 flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1 rounded-xl py-2 text-sm font-bold"
                            onClick={onClose}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            type="button"
                            variant={confirmButtonClass.includes('red') ? 'danger' : 'primary'}
                            className={`flex-1 rounded-xl py-2 text-sm font-bold shadow-sm ${confirmButtonClass}`}
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
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-end sm:items-center justify-center animate-fade-in" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-white w-full rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up sm:max-w-lg m-0 sm:m-4">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                                {title}
                            </h3>
                            <div className="mt-2">
                                <div className="text-sm text-gray-500">
                                    {message}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse gap-3">
                    <Button
                        type="button"
                        variant={confirmButtonClass.includes('red') ? 'danger' : 'primary'}
                        className={`flex-1 sm:flex-none w-full sm:w-auto ${confirmButtonClass}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 sm:flex-none w-full sm:w-auto mt-0"
                        onClick={onClose}
                    >
                        {cancelText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
