
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import UsersIcon from '../icons/UsersIcon';
import ArchiveBoxIcon from '../icons/ArchiveBoxIcon';
import ArrowRightIcon from '../icons/ArrowRightIcon';

interface OnboardingTaskListProps {
    stats: {
        totalUnits: number;
        totalSuppliers: number;
        totalCustomers: number;
    };
}

export const OnboardingTaskList: React.FC<OnboardingTaskListProps> = ({ stats }) => {
    const navigate = useNavigate();

    const tasks = [
        {
            id: 'products',
            label: 'Add your first product',
            completed: stats.totalUnits > 0,
            description: 'Start by adding products you want to sell.',
            path: '/inventory',
            icon: <ArchiveBoxIcon className="w-5 h-5" />
        },
        {
            id: 'suppliers',
            label: 'Add your first supplier',
            completed: stats.totalSuppliers > 0,
            description: 'Keep track of where you source your items.',
            path: '/suppliers',
            icon: <UsersIcon className="w-5 h-5" />
        },
    ];

    const allCompleted = tasks.every(t => t.completed);

    if (allCompleted) return null;

    return (
        <div className="liquid-glass-card rounded-[2rem] dark:bg-slate-800 p-6 border border-slate-100 dark:border-white/10 mb-6 animate-fade-in">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Welcome to SalePilot! 🚀</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">Follow these simple steps to get your store up and running.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm sm:text-base">
                {tasks.map((task) => (
                    <button
                        key={task.id}
                        disabled={task.completed}
                        onClick={() => navigate(task.path)}
                        className={`flex flex-col items-start text-left p-5 rounded-2xl border transition-all duration-300 group
                            ${task.completed
                                ? 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 opacity-60'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md hover:translate-y-[-2px]'}`}
                    >
                        <div className="flex justify-between items-start w-full mb-4">
                            <div className={`p-3 rounded-xl ${task.completed ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white group-hover:border-transparent transition-colors'}`}>
                                {task.icon}
                            </div>
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${task.completed ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                {task.completed ? (
                                    <CheckCircleIcon className="w-6 h-6" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-current" />
                                )}
                            </div>
                        </div>
                        <h4 className={`font-bold mb-1 ${task.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>{task.label}</h4>
                        {!task.completed && (
                            <div className="mt-2 flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                                <span>Get Started</span>
                                <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
