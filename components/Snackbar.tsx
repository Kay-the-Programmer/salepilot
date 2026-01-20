
import React, { useEffect } from 'react';
import { SnackbarType } from '../App';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import XMarkIcon from './icons/XMarkIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';


interface SnackbarProps {
    message: string;
    type: SnackbarType;
    onClose: () => void;
}

const SyncIcon = () => (
    <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const Snackbar: React.FC<SnackbarProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Auto-close after 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    const typeClasses = {
        success: 'bg-green-100 border-green-400 text-green-700',
        error: 'bg-red-100 border-red-400 text-red-700',
        info: 'bg-blue-100 border-blue-400 text-blue-700',
        warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
        sync: 'bg-gray-100 border-gray-400 text-gray-700',
    };

    const Icon = {
        success: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
        error: <XCircleIcon className="h-5 w-5 text-red-500" />,
        info: <InformationCircleIcon className="h-5 w-5 text-blue-500" />,
        warning: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />,
        sync: <SyncIcon />,
    }[type];

    return (
        <div
            className={`fixed bottom-20 md:bottom-4 left-4 z-[200] max-w-sm rounded-md border-l-4 shadow-lg p-4 ${typeClasses[type]} animate-slide-in-left transition-all duration-300 ease-out transform`}
            role="alert"
        >
            <div className="flex">
                <div className="flex-shrink-0">{Icon}</div>
                <div className="ml-3">
                    <p className="text-sm font-medium">{message}</p>
                </div>
                <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${type === 'success' ? 'bg-green-100 text-green-500 hover:bg-green-200 focus:ring-green-600 focus:ring-offset-green-100' :
                                type === 'error' ? 'bg-red-100 text-red-500 hover:bg-red-200 focus:ring-red-600 focus:ring-offset-red-100' :
                                    type === 'warning' ? 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200 focus:ring-yellow-600 focus:ring-offset-yellow-100' :
                                        type === 'sync' ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 focus:ring-gray-600 focus:ring-offset-gray-100' :
                                            'bg-blue-100 text-blue-500 hover:bg-blue-200 focus:ring-blue-600 focus:ring-offset-blue-100'
                                }`}
                            aria-label="Dismiss"
                        >
                            <span className="sr-only">Dismiss</span>
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Snackbar;
