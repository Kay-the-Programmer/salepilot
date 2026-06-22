import React from 'react';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import Modal from './ui/Modal';

interface LogoutConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
    return (
        <Modal open={isOpen} onClose={onClose} size="sm" className="p-6" zIndexClass="z-[400]">
            <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-danger-muted">
                    <ExclamationTriangleIcon className="h-6 w-6 text-danger" aria-hidden="true" />
                </div>
                <div>
                    <h3 className="text-lg font-extrabold tracking-tight text-brand-text">Confirm logout</h3>
                    <p className="mt-1 text-sm text-brand-text-muted">
                        Are you sure you want to log out of your account?
                    </p>
                </div>
            </div>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-surface-variant text-brand-text font-semibold hover:bg-brand-border transition-all active:scale-95"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    className="px-4 py-2.5 rounded-xl bg-danger text-white font-bold hover:opacity-90 transition-all active:scale-95"
                >
                    Logout
                </button>
            </div>
        </Modal>
    );
};

export default LogoutConfirmationModal;
