
import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

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
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={() => { /* Prevent closing by clicking outside */ }}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
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
                            <Dialog.Panel className="liquid-glass-card rounded-[2rem] w-full max-w-md transform overflow-hidden p-6 text-left align-middle transition-all border-t-4 border-indigo-600">
                                <div className="flex items-start gap-4">
                                    <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 flex-shrink-0">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                                            {title}
                                        </Dialog.Title>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                                System Announcement
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                                                {message}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-colors w-full sm:w-auto active:scale-95 transition-all duration-300"
                                        onClick={onAcknowledge}
                                    >
                                        Acknowledge & Dismiss
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default SystemNotificationModal;
