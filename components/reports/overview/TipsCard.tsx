import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SparklesIcon from '../../icons/SparklesIcon';
import ArchiveBoxIcon from '../../icons/ArchiveBoxIcon';
import BanknotesIcon from '../../icons/BanknotesIcon';
import TruckIcon from '../../icons/TruckIcon';
import UsersIcon from '../../icons/UsersIcon';
import ShoppingCartIcon from '../../icons/ShoppingCartIcon';
import CpuChipIcon from '../../icons/CpuChipIcon';
import BuildingStorefrontIcon from '../../icons/BuildingStorefrontIcon';
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

interface TipsCardProps {
    hasProducts?: boolean;
    hasExpenses?: boolean;
    hasSuppliers?: boolean;
    hasCustomers?: boolean;
    hasSales?: boolean;
}

export const TipsCard: React.FC<TipsCardProps> = ({
    hasProducts,
    hasExpenses,
    hasSuppliers,
    hasCustomers,
    hasSales
}) => {
    const navigate = useNavigate();
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    const tips: Tip[] = React.useMemo(() => [
        {
            id: 1,
            title: "Welcome to SalePilot!",
            description: "We're excited to help you manage your store more efficiently.",
            icon: <SparklesIcon className="w-5 h-5" />,
            actionLabel: "View Guide",
            path: "/user-guide",
            color: "blue",
            show: true
        },
        {
            id: 2,
            title: "Add Your First Product",
            description: "Start building your inventory to begin making sales.",
            icon: <ArchiveBoxIcon className="w-5 h-5" />,
            actionLabel: "Add Product",
            path: "/inventory",
            color: "indigo",
            show: !hasProducts
        },
        {
            id: 3,
            title: "Add Your First Supplier",
            description: "Keep track of where you source your items.",
            icon: <TruckIcon className="w-5 h-5" />,
            actionLabel: "Add Supplier",
            path: "/suppliers",
            color: "emerald",
            show: !hasSuppliers
        },
        {
            id: 4,
            title: "Track Your Expenses",
            description: "Keep your finances in check by recording your operating costs.",
            icon: <BanknotesIcon className="w-5 h-5" />,
            actionLabel: "Add Expense",
            path: "/accounting#expenses",
            color: "rose",
            show: !hasExpenses
        },
        {
            id: 5,
            title: "Register Your Customers",
            description: "Build client relationships and track loyalty.",
            icon: <UsersIcon className="w-5 h-5" />,
            actionLabel: "Add Customer",
            path: "/customers",
            color: "amber",
            show: !hasCustomers
        },
        {
            id: 6,
            title: "Try POS Terminal",
            description: "Ready to make a sale? Use our intuitive POS interface.",
            icon: <ShoppingCartIcon className="w-5 h-5" />,
            actionLabel: "Go to POS",
            path: "/sales",
            color: "violet",
            show: !hasSales
        },
        {
            id: 7,
            title: "AI Business Assistant",
            description: "Get smart insights and help from your AI assistant.",
            icon: <CpuChipIcon className="w-5 h-5" />,
            actionLabel: "Chat Now",
            path: "/quick-view",
            color: "indigo",
            show: true
        },
        {
            id: 8,
            title: "Explore Marketplace",
            description: "Discover other stores and connect with suppliers.",
            icon: <BuildingStorefrontIcon className="w-5 h-5" />,
            actionLabel: "Visit Marketplace",
            path: "/directory",
            color: "fuchsia",
            show: true
        }
    ].filter(tip => (tip as any).show) as Tip[], [hasProducts, hasExpenses, hasSuppliers, hasCustomers, hasSales]);

    useEffect(() => {
        if (tips.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentTipIndex((prev) => (prev + 1) % tips.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [tips.length]);

    const currentTip = tips[currentTipIndex] || tips[0];

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'blue': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20';
            case 'indigo': return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20';
            case 'emerald': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
            case 'rose': return 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20';
            case 'amber': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
            case 'violet': return 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-500/20';
            case 'fuchsia': return 'bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-100 dark:border-fuchsia-500/20';
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

            {/* Background decorative elements */}
            <div className={`absolute -bottom-24 -right-24 w-64 h-64 blur-[100px] rounded-full opacity-20 transition-all duration-1000 ${currentTip.color === 'blue' ? 'bg-blue-500' :
                currentTip.color === 'indigo' ? 'bg-indigo-500' :
                    currentTip.color === 'emerald' ? 'bg-emerald-500' :
                        currentTip.color === 'rose' ? 'bg-rose-500' :
                            currentTip.color === 'amber' ? 'bg-amber-500' :
                                currentTip.color === 'violet' ? 'bg-violet-500' :
                                    'bg-fuchsia-500'
                }`}></div>

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
