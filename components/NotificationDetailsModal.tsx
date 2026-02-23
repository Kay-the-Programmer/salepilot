import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Announcement } from '../types';
import { useNavigate } from 'react-router-dom';

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
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="liquid-glass-card rounded-[2rem] w-full max-w-md transform overflow-hidden dark:bg-slate-800 p-6 text-left align-middle transition-all border border-gray-100 dark:border-slate-700">
                                <div className="flex justify-between items-start mb-4">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-bold leading-6 text-gray-900 dark:text-white"
                                    >
                                        {notification.title}
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="mt-2">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-sm text-gray-500 dark:text-slate-400">
                                            {new Date(notification.createdAt).toLocaleString(undefined, {
                                                dateStyle: 'full',
                                                timeStyle: 'short'
                                            })}
                                        </span>
                                        {notification.type && (
                                            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full uppercase tracking-wider">
                                                {notification.type}
                                            </span>
                                        )}
                                    </div>

                                    <div className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-slate-300">
                                        <p className="whitespace-pre-wrap leading-relaxed">
                                            {notification.message}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-xl border border-transparent bg-gray-100 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors active:scale-95 transition-all duration-300"
                                        onClick={onClose}
                                    >
                                        Close
                                    </button>
                                    {notification.link && (
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-xl border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-lg shadow-indigo-500/20 active:scale-95 transition-all duration-300"
                                            onClick={handleAction}
                                        >
                                            Take Action
                                        </button>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default NotificationDetailsModal;
