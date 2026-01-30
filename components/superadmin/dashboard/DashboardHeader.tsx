
import React from 'react';
import { UsersIcon } from '../../icons';

const DashboardHeader: React.FC = () => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <UsersIcon className="w-8 h-8 text-indigo-600" />
                    Dashboard Overview
                </h1>
                <p className="text-gray-600 mt-1">Welcome back, Super Admin. Here's what's happening with your platform.</p>
            </div>
            <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>
        </div>
    );
};

export default DashboardHeader;
