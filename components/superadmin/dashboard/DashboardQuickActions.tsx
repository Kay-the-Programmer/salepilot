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
            color: 'text-blue-400 group-hover:text-blue-300'
        },
        {
            id: 'revenue',
            title: 'Revenue Reports',
            description: 'Detailed revenue analytics',
            icon: <ChartBarIcon className="w-5 h-5" />,
            action: () => navigate('/superadmin/revenue'),
            color: 'text-emerald-400 group-hover:text-emerald-300'
        },
        {
            id: 'trials',
            title: 'Trial Management',
            description: 'Manage trial stores',
            icon: <ClockIcon className="w-5 h-5" />,
            action: () => navigate('/superadmin/stores?filter=trial'),
            color: 'text-amber-400 group-hover:text-amber-300'
        },
        {
            id: 'settings',
            title: 'System Settings',
            description: 'Configure global settings',
            icon: <Cog6ToothIcon className="w-5 h-5" />,
            action: () => navigate('/superadmin/settings'),
            color: 'text-slate-400 group-hover:text-slate-300'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            {quickActions.map((action) => (
                <button
                    key={action.id}
                    onClick={action.action}
                    className="relative group w-full bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-600 rounded-2xl p-5 text-left transition-all duration-300 backdrop-blur-md overflow-hidden active:scale-95 transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-slate-800 group-hover:bg-slate-700 transition-colors border border-white/5 ${action.color}`}>
                                {action.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-0.5 group-hover:text-indigo-200 transition-colors">{action.title}</h3>
                                <p className="text-xs text-slate-500 font-mono tracking-wide">{action.description}</p>
                            </div>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors transform group-hover:translate-x-1" />
                    </div>
                </button>
            ))}
        </div>
    );
};

export default DashboardQuickActions;
