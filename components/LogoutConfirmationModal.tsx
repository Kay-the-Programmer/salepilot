import React from 'react';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import { Button } from './ui/Button';

interface LogoutConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center animate-fade-in" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="liquid-glass-card rounded-[2rem] w-full rounded-t-3xl sm: overflow-hidden flex flex-col animate-slide-up sm:max-w-lg m-4">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                                Confirm Logout
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to log out of your account?
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse gap-3">
                    <Button
                        type="button"
                        variant="danger"
                        className="flex-1 sm:flex-none w-full sm:w-auto"
                        onClick={onConfirm}
                    >
                        Logout
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 sm:flex-none w-full sm:w-auto mt-0"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LogoutConfirmationModal;
