
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingStorefrontIcon, ChartBarIcon, ClockIcon, ChevronRightIcon, Cog6ToothIcon } from '../../icons';
import { QuickAction } from '../../../types';

const DashboardQuickActions: React.FC = () => {
    const navigate = useNavigate();

    // Quick actions
    const quickActions: QuickAction[] = [
        {
            id: 'stores',
            title: 'Manage Stores',
            description: 'View and manage all stores',
            icon: <BuildingStorefrontIcon className="w-5 h-5" />,
            action: () => navigate('/superadmin/stores'),
            color: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
        },
        {
            id: 'revenue',
            title: 'Revenue Reports',
            description: 'Detailed revenue analytics',
            icon: <ChartBarIcon className="w-5 h-5" />,
            action: () => navigate('/superadmin/revenue'),
            color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
        },
        {
            id: 'trials',
            title: 'Trial Management',
            description: 'Manage trial stores',
            icon: <ClockIcon className="w-5 h-5" />,
            action: () => navigate('/superadmin/stores?filter=trial'),
            color: 'bg-amber-50 text-amber-600 hover:bg-amber-100'
        },
        {
            id: 'settings',
            title: 'System Settings',
            description: 'Configure global settings',
            icon: <Cog6ToothIcon className="w-5 h-5" />,
            action: () => navigate('/superadmin/settings'),
            color: 'bg-gray-50 text-gray-600 hover:bg-gray-100'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
                <button
                    key={action.id}
                    onClick={action.action}
                    className={`${action.color} rounded-xl p-5 text-left transition-all duration-300 hover:shadow-md border border-transparent hover:border-current/10`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-white/50">
                            {action.icon}
                        </div>
                        <ChevronRightIcon className="w-5 h-5 opacity-60" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm opacity-75">{action.description}</p>
                </button>
            ))}
        </div>
    );
};

export default DashboardQuickActions;
