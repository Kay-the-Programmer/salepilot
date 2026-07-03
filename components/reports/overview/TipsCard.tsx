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
            path: "/inv/items",
            color: "indigo",
            show: !hasProducts
        },
        {
            id: 3,
            title: "Add Your First Supplier",
            description: "Keep track of where you source your items.",
            icon: <TruckIcon className="w-5 h-5" />,
            actionLabel: "Add Supplier",
            path: "/procure/suppliers",
            color: "emerald",
            show: !hasSuppliers
        },
        {
            id: 4,
            title: "Track Your Expenses",
            description: "Keep your finances in check by recording your operating costs.",
            icon: <BanknotesIcon className="w-5 h-5" />,
            actionLabel: "Add Expense",
            path: "/books#expenses",
            color: "rose",
            show: !hasExpenses
        },
        {
            id: 5,
            title: "Register Your Customers",
            description: "Build client relationships and track loyalty.",
            icon: <UsersIcon className="w-5 h-5" />,
            actionLabel: "Add Customer",
            path: "/crm/customers",
            color: "amber",
            show: !hasCustomers
        },
        {
            id: 6,
            title: "Try POS Terminal",
            description: "Ready to make a sale? Use our intuitive POS interface.",
            icon: <ShoppingCartIcon className="w-5 h-5" />,
            actionLabel: "Go to POS",
            path: "/pos",
            color: "violet",
            show: !hasSales
        },
        {
            id: 7,
            title: "AI Business Assistant",
            description: "Get smart insights and help from your AI assistant.",
            icon: <CpuChipIcon className="w-5 h-5" />,
            actionLabel: "Chat Now",
            path: "/assistant",
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

    return (
        <div className="dashboard-card group h-full">
            <div className="relative z-10 h-full flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-muted mb-4">Tips & Guidance</span>

                <div className="flex-1 flex flex-col justify-center">
                    <div key={currentTipIndex} className="animate-fade-in-right">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-sp-navy-soft text-sp-navy">
                            {currentTip.icon}
                        </div>
                        <h3 className="text-lg font-bold text-brand-text mb-2 tracking-tight">
                            {currentTip.title}
                        </h3>
                        <p className="text-brand-text-muted text-sm leading-relaxed mb-6">
                            {currentTip.description}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => navigate(currentTip.path)}
                    className="flex items-center gap-2 text-sp-navy text-xs font-bold uppercase tracking-widest group/btn w-fit"
                >
                    <span>{currentTip.actionLabel}</span>
                    <ArrowRightIcon className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                </button>

                {/* Progress dots */}
                {tips.length > 1 && (
                    <div className="flex items-center gap-1.5 mt-4">
                        {tips.map((_, i) => (
                            <span key={i} className={`h-1 rounded-full transition-all ${i === currentTipIndex ? 'w-5 bg-sp-navy' : 'w-1 bg-surface-variant'}`} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
