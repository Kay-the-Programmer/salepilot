
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
        <div className="glass-effect rounded-[2rem] p-6 lg:p-10 border border-white/40 dark:border-slate-800/40 mb-8 shadow-xl animate-fade-in-up group overflow-hidden relative">
            {/* Background decorative element */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full"></div>

            <div className="relative z-10">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-outfit tracking-tight">Welcome to SalePilot! 🚀</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Follow these simple steps to get your store up and running.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tasks.map((task) => (
                        <button
                            key={task.id}
                            disabled={task.completed}
                            onClick={() => navigate(task.path)}
                            className={`flex flex-col items-start text-left p-6 rounded-[2rem] border transition-all duration-500 group/item relative overflow-hidden
                                ${task.completed
                                    ? 'bg-slate-50/50 dark:bg-white/5 border-slate-100 dark:border-white/5 opacity-60'
                                    : 'bg-white/60 dark:bg-slate-800/60 border-white dark:border-slate-700/30 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1'}`}
                        >
                            <div className="flex justify-between items-start w-full mb-6 py-2">
                                <div className={`p-4 rounded-2xl shadow-sm ${task.completed ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-500/20 group-hover/item:bg-indigo-600 dark:group-hover/item:bg-indigo-500 group-hover/item:text-white group-hover/item:border-transparent transition-all duration-300'}`}>
                                    {task.icon}
                                </div>
                                <div className={`flex-shrink-0 flex items-center justify-center ${task.completed ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-700'}`}>
                                    {task.completed ? (
                                        <div className="bg-emerald-500/10 p-2 rounded-full">
                                            <CheckCircleIcon className="w-7 h-7" />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full border-2 border-current opacity-40" />
                                    )}
                                </div>
                            </div>
                            <h4 className={`text-lg font-bold mb-1 font-outfit ${task.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>{task.label}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-1">{task.description}</p>

                            {!task.completed && (
                                <div className="mt-auto flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-[0.15em]">
                                    <span>Get Started</span>
                                    <ArrowRightIcon className="w-3 h-3 group-hover/item:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
