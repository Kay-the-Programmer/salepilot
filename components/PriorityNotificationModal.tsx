import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import SystemNotificationModal from './SystemNotificationModal';

const PriorityNotificationModal: React.FC = () => {
    const { notifications, markAsRead } = useNotifications();
    const [currentPriority, setCurrentPriority] = useState<any>(null);

    useEffect(() => {
        const priority = notifications.find(n =>
            !n.isRead && (n.type === 'system_priority' || n.type === 'admin_broadcast' || n.type === 'priority')
        );
        setCurrentPriority(priority || null);
    }, [notifications]);

    const handleAcknowledge = async () => {
        if (currentPriority) {
            await markAsRead(currentPriority.id);
            setCurrentPriority(null);
        }
    };

    if (!currentPriority) return null;

    return (
        <SystemNotificationModal
            isOpen={true}
            title={currentPriority.title}
            message={currentPriority.message}
            date={currentPriority.createdAt}
            onAcknowledge={handleAcknowledge}
        />
    );
};

export default PriorityNotificationModal;
