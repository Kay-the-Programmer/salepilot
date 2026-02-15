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
                relative flex flex-col p-5 md:p-8 rounded-3xl transition-all duration-300 group
                ${isFeatured
                    ? 'glass-panel border-indigo-500/30 dark:border-indigo-400/30 shadow-xl shadow-indigo-500/10 md:scale-105 z-10'
                    : 'glass-card hover:border-slate-300 dark:hover:border-slate-600'
                }
            `}
        >
            {isFeatured && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[11px] uppercase tracking-wider font-bold px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/30 ring-2 ring-white dark:ring-slate-900 animate-float-slow">
                        Most Popular
                    </span>
                </div>
            )}

            <div className="mb-6">
                <h3 className={`text-xl font-bold tracking-tight mb-2 ${isFeatured ? 'text-indigo-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                    {plan.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed min-h-[40px]">
                    {plan.description}
                </p>
            </div>

            <div className="mb-8 flex items-baseline gap-1">
                <span className={`text-4xl md:text-5xl font-black tracking-tighter ${isFeatured ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                    {plan.currency} {displayPrice.toLocaleString()}
                </span>
                <span className="text-sm font-medium text-slate-400 dark:text-slate-500 uppercase">
                    /{displayInterval}
                </span>
            </div>

            <ul className="flex-1 space-y-4 mb-10">
                {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm group/item">
                        <CheckCircleIcon
                            className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover/item:scale-110 group-hover/item:text-emerald-500
                                ${isFeatured ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}
                            `}
                        />
                        <span className="text-slate-600 dark:text-slate-300 font-medium">{feature}</span>
                    </li>
                ))}
            </ul>

            <button
                onClick={() => onSelect(plan.id)}
                disabled={isLoading || isActive}
                className={`
                    w-full py-4 px-6 rounded-2xl text-sm font-bold transition-all duration-300
                    active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none
                    ${isActive
                        ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 cursor-default'
                        : isFeatured
                            ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                            : 'bg-white text-slate-900 border border-slate-200 hover:border-slate-300 hover:shadow-md dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700'
                    }
                `}
            >
                {isLoading && isSelected ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                    </span>
                ) : isActive ? (
                    <span className="flex items-center justify-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4" />
                        Current Plan
                    </span>
                ) : (
                    'Get Started'
                )}
            </button>
        </div>
    );
});

PlanCard.displayName = 'PlanCard';

export default PlanCard;
