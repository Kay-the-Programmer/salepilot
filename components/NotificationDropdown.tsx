import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { BellAlertIcon } from './icons';
import { Announcement } from '../types';

interface NotificationDropdownProps {
    notifications: Announcement[];
    onMarkAsRead: (id: string) => void;
    onViewAll: () => void;
}

export default function NotificationDropdown({ notifications, onMarkAsRead, onViewAll }: NotificationDropdownProps) {
    const navigate = useNavigate();
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const recentNotifications = notifications.slice(0, 5); // Show top 5

    const handleNotificationClick = (notification: Announcement) => {
        if (!notification.isRead) {
            onMarkAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    return (
        <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                <span className="sr-only">View notifications</span>
                <BellAlertIcon className="h-6 w-6" aria-hidden="true" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                )}
            </Menu.Button>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right divide-y divide-gray-100 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">Notifications</p>
                        {unreadCount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                                {unreadCount} New
                            </span>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {recentNotifications.length === 0 ? (
                            <div className="p-6 text-center">
                                <p className="text-sm text-gray-500">No notifications yet.</p>
                            </div>
                        ) : (
                            <div>
                                {recentNotifications.map((notification) => (
                                    <Menu.Item key={notification.id}>
                                        {({ active }) => (
                                            <div
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`
                                                    ${active ? 'bg-gray-50' : ''}
                                                    ${!notification.isRead ? 'bg-indigo-50/50' : ''}
                                                    block px-4 py-3 cursor-pointer transition-colors border-l-4
                                                    ${!notification.isRead ? 'border-indigo-500' : 'border-transparent'}
                                                `}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                        {new Date(notification.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-2">{notification.message}</p>
                                            </div>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
                        <button
                            onClick={onViewAll}
                            className="block w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-500 py-1"
                        >
                            View all notifications
                        </button>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}
