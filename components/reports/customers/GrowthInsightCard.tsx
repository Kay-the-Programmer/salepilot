import React from 'react';
import UsersIcon from '../../icons/UsersIcon';

interface GrowthInsightCardProps {
    newCustomersInPeriod: number;
}

export const GrowthInsightCard: React.FC<GrowthInsightCardProps> = ({ newCustomersInPeriod }) => {
    return (
        <div className="glass-effect dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-white/10 flex flex-col justify-center items-center text-center">
            <div className="p-5 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl mb-6">
                <UsersIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xl mb-3">Growth Insight</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                You acquired <br />
                <span className="font-black text-3xl text-indigo-600 dark:text-indigo-400 mt-2 block tracking-tight">
                    {newCustomersInPeriod}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-500/50 dark:text-indigo-400/30 mt-1 block">New Customers</span>
            </p>
        </div>
    );
};
