import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SparklesIcon from '../../icons/SparklesIcon';
import ArchiveBoxIcon from '../../icons/ArchiveBoxIcon';
import BanknotesIcon from '../../icons/BanknotesIcon';
import ArrowRightIcon from '../../icons/ArrowRightIcon';

interface Tip {
    id: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    actionLabel: string;
    path: string;
    color: string;
}

export const TipsCard: React.FC = () => {
    const navigate = useNavigate();
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    const tips: Tip[] = [
        {
            id: 1,
            title: "Welcome to SalePilot!",
            description: "We're excited to help you manage your store more efficiently.",
            icon: <SparklesIcon className="w-5 h-5" />,
            actionLabel: "View Guide",
            path: "/user-guide",
            color: "blue"
        },
        {
            id: 2,
            title: "Add Your First Product",
            description: "Start building your inventory to begin making sales.",
            icon: <ArchiveBoxIcon className="w-5 h-5" />,
            actionLabel: "Add Product",
            path: "/inventory",
            color: "indigo"
        },
        {
            id: 3,
            title: "Track Your Expenses",
            description: "Keep your finances in check by recording your operating costs.",
            icon: <BanknotesIcon className="w-5 h-5" />,
            actionLabel: "Add Expense",
            path: "/accounting#expenses",
            color: "emerald"
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTipIndex((prev) => (prev + 1) % tips.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [tips.length]);

    const currentTip = tips[currentTipIndex];

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'blue': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20';
            case 'indigo': return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20';
            case 'emerald': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
            default: return 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-white/5';
        }
    };

    return (
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[24px] p-7 flex flex-col justify-between relative group transition-all duration-300 shadow-[0_2px_8px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_24px_rgb(0,0,0,0.08)] overflow-hidden h-[360px]">
            <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-2.5 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center bg-opacity-20 dark:bg-opacity-30 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        <SparklesIcon className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs tracking-wide uppercase">Tips & Guidance</span>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <div key={currentTipIndex} className="animate-fade-in-right">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border shadow-sm ${getColorClasses(currentTip.color)}`}>
                            {currentTip.icon}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight font-outfit">
                            {currentTip.title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-[90%]">
                            {currentTip.description}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => navigate(currentTip.path)}
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-extrabold uppercase tracking-[0.15em] group/btn w-fit"
                >
                    <span>{currentTip.actionLabel}</span>
                    <ArrowRightIcon className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Pagination Dots */}
            <div className="absolute bottom-7 right-7 flex gap-1.5 z-10">
                {tips.map((_, idx) => (
                    <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentTipIndex ? 'w-6 bg-blue-600 dark:bg-blue-400' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`}
                    />
                ))}
            </div>

            {/* Background decorative elements */}
            <div className={`absolute -bottom-24 -right-24 w-64 h-64 blur-[100px] rounded-full opacity-20 transition-all duration-1000 ${currentTip.color === 'blue' ? 'bg-blue-500' : currentTip.color === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>

            <style>{`
                @keyframes fade-in-right {
                    0% { opacity: 0; transform: translateX(10px); }
                    100% { opacity: 1; transform: translateX(0); }
                }
                .animate-fade-in-right {
                    animation: fade-in-right 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
