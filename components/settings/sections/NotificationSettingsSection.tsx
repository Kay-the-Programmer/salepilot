import React, { useState, useEffect } from 'react';
import { notificationService } from '../../../services/notificationService';
import { BellAlertIcon } from '../../icons';
import SettingsCard from '../SettingsCard';
import DetailItem from '../DetailItem';

interface NotificationSettingsSectionProps {
    isEditing: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
}

const NotificationSettingsSection: React.FC<NotificationSettingsSectionProps> = ({
    isEditing,
    onEdit,
    onSave,
    onCancel
}) => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            const status = await notificationService.getSubscriptionStatus();
            setIsSubscribed(status);
            setIsLoading(false);
        };
        checkStatus();
    }, []);

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            if (isSubscribed) {
                await notificationService.unsubscribeUser();
                setIsSubscribed(false);
            } else {
                const token = await notificationService.subscribeUser();
                if (token) setIsSubscribed(true);
            }
        } catch (error) {
            console.error('Toggle push notification failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsCard
            title="Notification Preferences"
            description="Manage how you receive alerts and updates from SalePilot."
            isEditing={isEditing}
            onEdit={onEdit}
            onSave={onSave}
            onCancel={onCancel}
            badge="Push"
        >
            <div className="flex flex-col">
                <DetailItem
                    label="Push Notifications"
                    icon={<BellAlertIcon className="w-5 h-5" />}
                    value={
                        <div className="flex items-center justify-end">
                            <button
                                onClick={handleToggle}
                                disabled={isLoading}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSubscribed ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                                    } ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                                aria-pressed={isSubscribed}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSubscribed ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    }
                />
            </div>
        </SettingsCard>
    );
};

export default NotificationSettingsSection;
