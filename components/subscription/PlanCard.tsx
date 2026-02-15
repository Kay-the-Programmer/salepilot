import React, { memo } from 'react';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import ShieldCheckIcon from '../icons/ShieldCheckIcon';
import { BackendPlan } from '../../types/subscription';

interface PlanCardProps {
    plan: BackendPlan;
    isAnnual: boolean;
    isFeatured: boolean;
    isActive: boolean;
    isLoading: boolean;
    isSelected: boolean;
    onSelect: (planId: string) => void;
}

const PlanCard: React.FC<PlanCardProps> = memo(({
    plan,
    isAnnual,
    isFeatured,
    isActive,
    isLoading,
    isSelected,
    onSelect
}) => {
    const displayPrice = isAnnual ? Math.round(plan.price * 12 * 0.8) : plan.price;
    const displayInterval = isAnnual ? 'year' : plan.interval;

    return (
        <div
            className={`
                relative flex flex-col p-8 rounded-2xl transition-all duration-300
                ${isFeatured
                    ? 'bg-slate-900 text-white ring-2 ring-slate-900 shadow-xl scale-105 dark:bg-slate-100 dark:text-slate-900 dark:ring-slate-100'
                    : 'bg-white text-slate-900 border border-slate-200 hover:border-slate-300 hover:shadow-lg dark:bg-slate-900 dark:text-white dark:border-slate-800'
                }
            `}
        >
            {isFeatured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-sm">
                        Most Popular
                    </span>
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-lg font-bold tracking-tight mb-2 opacity-90">{plan.name}</h3>
                <p className={`text-sm ${isFeatured ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>
                    {plan.description}
                </p>
            </div>

            <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tight">
                    {plan.currency} {displayPrice.toLocaleString()}
                </span>
                <span className={`text-xs font-medium uppercase ${isFeatured ? 'text-slate-400 dark:text-slate-500' : 'text-slate-400'}`}>
                    /{displayInterval}
                </span>
            </div>

            <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircleIcon className={`w-5 h-5 flex-shrink-0 ${isFeatured ? 'text-indigo-400 dark:text-indigo-600' : 'text-indigo-600 dark:text-indigo-400'}`} />
                        <span className="opacity-90">{feature}</span>
                    </li>
                ))}
            </ul>

            <button
                onClick={() => onSelect(plan.id)}
                disabled={isLoading || isActive}
                className={`
                    w-full py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isFeatured
                        ? 'bg-white text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800'
                        : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                    }
                `}
            >
                {isLoading && isSelected ? 'Processing...' : isActive ? 'Active Plan' : 'Select Plan'}
            </button>
        </div>
    );
});

PlanCard.displayName = 'PlanCard';

export default PlanCard;
