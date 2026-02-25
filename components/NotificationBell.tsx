import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { BellAlertIcon } from './icons';

interface NotificationBellProps {
    onNavigate: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
    const { unreadCount } = useNotifications();

    return (
        <button
            onClick={onNavigate}
            className="p-2 -mr-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
            aria-label="Notifications"
        >
            <BellAlertIcon className="w-6 h-6" />
            {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            )}
        </button>
    );
};

export default NotificationBell;
