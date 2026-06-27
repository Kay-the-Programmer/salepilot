import React from 'react';
import { Announcement } from '../types';
import { useNavigate } from 'react-router-dom';
import Modal from './ui/Modal';

interface NotificationDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    notification: Announcement | null;
    onMarkAsRead: (id: string) => void;
}

const NotificationDetailsModal: React.FC<NotificationDetailsModalProps> = ({
    isOpen,
    onClose,
    notification,
    onMarkAsRead
}) => {
    const navigate = useNavigate();

    if (!notification) return null;

    const handleAction = () => {
        if (!notification.isRead) {
            onMarkAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
            onClose();
        }
    };

    return (
        <Modal open={isOpen} onClose={onClose} size="md" title={notification.title} zIndexClass="z-[200]">
            <div className="p-6">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-sm text-brand-text-muted">
                        {new Date(notification.createdAt).toLocaleString(undefined, {
                            dateStyle: 'full',
                            timeStyle: 'short'
                        })}
                    </span>
                    {notification.type && (
                        <span className="px-2 py-0.5 bg-sp-green-soft text-sp-green-dark text-xs font-bold rounded-full uppercase tracking-wider">
                            {notification.type}
                        </span>
                    )}
                </div>

                <p className="whitespace-pre-wrap leading-relaxed text-sm text-brand-text-muted">
                    {notification.message}
                </p>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-surface-variant text-brand-text font-semibold hover:bg-brand-border transition-all active:scale-95"
                        onClick={onClose}
                    >
                        Close
                    </button>
                    {notification.link && (
                        <button
                            type="button"
                            className="px-4 py-2 rounded-xl bg-sp-amber text-white font-bold hover:bg-sp-green-dark transition-all active:scale-95"
                            onClick={handleAction}
                        >
                            Take Action
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default NotificationDetailsModal;
