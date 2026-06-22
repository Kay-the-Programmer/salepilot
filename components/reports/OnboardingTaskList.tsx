
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
            description: 'Add what you sell in Inventory → Products.',
            path: '/inventory',
            icon: <ArchiveBoxIcon className="w-5 h-5" />
        },
        {
            id: 'suppliers',
            label: 'Add your first supplier',
            completed: stats.totalSuppliers > 0,
            description: 'Track who you source from on the Suppliers page.',
            path: '/suppliers',
            icon: <UsersIcon className="w-5 h-5" />
        },
    ];

    const allCompleted = tasks.every(t => t.completed);

    if (allCompleted) return null;

    return (
        <div className="bg-surface border border-brand-border rounded-2xl p-6 lg:p-8 mb-8 shadow-sm animate-fade-in-up">
            <h3 className="text-xl font-bold text-brand-text tracking-tight">Welcome to SalePilot</h3>
            <p className="text-sm text-brand-text-muted mt-1 mb-6">A couple of quick steps to get your store running.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((task) => (
                    <button
                        key={task.id}
                        disabled={task.completed}
                        onClick={() => navigate(task.path)}
                        className={`flex flex-col items-start text-left p-5 rounded-xl border transition-all duration-200
                            ${task.completed
                                ? 'bg-success-muted/40 border-primary/10 cursor-default'
                                : 'bg-background border-brand-border hover:border-primary/40 hover:shadow-sm hover:-translate-y-0.5'}`}
                    >
                        <div className="flex justify-between items-center w-full mb-4">
                            <div className={`p-2.5 rounded-xl ${
                                task.completed
                                    ? 'bg-white/60 dark:bg-white/5 text-brand-text-muted'
                                    : 'bg-success-muted text-primary'
                            }`}>
                                {task.icon}
                            </div>
                            {task.completed ? (
                                <CheckCircleIcon className="w-6 h-6 text-primary" />
                            ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-warm-300 dark:border-white/20" />
                            )}
                        </div>
                        <h4 className={`text-base font-bold tracking-tight ${
                            task.completed ? 'text-brand-text-muted line-through' : 'text-brand-text'
                        }`}>
                            {task.label}
                        </h4>
                        <p className="text-sm text-brand-text-muted mt-0.5">{task.description}</p>

                        {!task.completed && (
                            <span className="mt-4 inline-flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wide">
                                Get started
                                <ArrowRightIcon className="w-3.5 h-3.5" />
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
