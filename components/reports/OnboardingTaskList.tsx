
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import ShoppingCartIcon from '../icons/ShoppingCartIcon';
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
        {
            id: 'customers',
            label: 'Add your first customer',
            completed: stats.totalCustomers > 0,
            description: 'Build your customer base for better relationship management.',
            path: '/customers',
            icon: <UsersIcon className="w-5 h-5" />
        },
    ];

    const allCompleted = tasks.every(t => t.completed);

    if (allCompleted) {
        return (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 shadow-xl mb-8 text-white animate-fade-in relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-black opacity-5 blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl">
                            🎉
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">Congratulations!</h3>
                            <p className="text-emerald-50 opacity-90">Your store setup is complete and ready for business.</p>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6">
                        <p className="text-lg font-medium leading-relaxed">
                            The system is intelligent and fully configured. You are now ready to make your first sale!
                            Head over to the POS terminal to start processing orders.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/sales')}
                        className="group flex items-center gap-3 bg-white text-emerald-600 px-6 py-4 rounded-xl font-bold hover:bg-emerald-50 transition-all shadow-lg active:scale-95"
                    >
                        <ShoppingCartIcon className="w-6 h-6" />
                        <span>Open POS Terminal</span>
                        <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6 animate-fade-in">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Welcome to SalePilot! 🚀</h3>
            <p className="text-slate-500 mb-6 font-medium">Follow these simple steps to get your store up and running.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tasks.map((task) => (
                    <button
                        key={task.id}
                        disabled={task.completed}
                        onClick={() => navigate(task.path)}
                        className={`flex flex-col items-start text-left p-5 rounded-2xl border transition-all duration-300 group
                            ${task.completed
                                ? 'bg-slate-50 border-slate-100 opacity-60'
                                : 'bg-white border-slate-200 hover:border-indigo-500 hover:shadow-md hover:translate-y-[-2px]'}`}
                    >
                        <div className="flex justify-between items-start w-full mb-4">
                            <div className={`p-3 rounded-xl ${task.completed ? 'bg-slate-200 text-slate-500' : 'bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors'}`}>
                                {task.icon}
                            </div>
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${task.completed ? 'text-emerald-500' : 'text-slate-300'}`}>
                                {task.completed ? (
                                    <CheckCircleIcon className="w-6 h-6" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-current" />
                                )}
                            </div>
                        </div>
                        <h4 className={`font-bold mb-1 ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.label}</h4>
                        {!task.completed && (
                            <div className="mt-2 flex items-center gap-1 text-indigo-600 text-xs font-bold uppercase tracking-wider">
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
