import React from 'react';
import Modal from './ui/Modal';

interface SystemNotificationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    date: string;
    onAcknowledge: () => void;
}

const SystemNotificationModal: React.FC<SystemNotificationModalProps> = ({
    isOpen,
    title,
    message,
    date,
    onAcknowledge,
}) => {
    return (
        <Modal
            open={isOpen}
            onClose={() => { /* Must be acknowledged — no dismiss on backdrop/Esc */ }}
            closeOnBackdrop={false}
            closeOnEsc={false}
            size="md"
            className="p-6 border-t-4 border-t-sp-green"
            zIndexClass="z-[300]"
        >
            <div className="flex items-start gap-4">
                <div className="bg-sp-green-soft p-3 rounded-xl text-sp-green-dark shrink-0">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-extrabold tracking-tight text-brand-text">
                        {title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-sp-green-soft text-sp-green-dark">
                            System Announcement
                        </span>
                        <span className="text-xs text-brand-text-muted">
                            {new Date(date).toLocaleDateString()}
                        </span>
                    </div>
                    <p className="mt-4 text-sm text-brand-text-muted whitespace-pre-wrap leading-relaxed">
                        {message}
                    </p>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    type="button"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sp-amber text-white text-sm font-bold hover:bg-sp-green-dark transition-all active:scale-95"
                    onClick={onAcknowledge}
                >
                    Acknowledge & Dismiss
                </button>
            </div>
        </Modal>
    );
};

export default SystemNotificationModal;
