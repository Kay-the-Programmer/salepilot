import React from 'react';
import UsersIcon from '../../icons/UsersIcon';

interface GrowthInsightCardProps {
    newCustomersInPeriod: number;
}

export const GrowthInsightCard: React.FC<GrowthInsightCardProps> = ({ newCustomersInPeriod }) => {
    return (
        <div className="bg-surface rounded-2xl p-6 border border-brand-border flex flex-col justify-center items-center text-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-sp-navy-soft flex items-center justify-center mb-5">
                <UsersIcon className="w-8 h-8 text-sp-navy" />
            </div>
            <h3 className="font-bold text-brand-text text-lg tracking-tight mb-2">Growth Insight</h3>
            <p className="text-sm text-brand-text-muted leading-relaxed">New customers this period</p>
            <span className="font-bold text-4xl text-sp-navy mt-3 tracking-tight tnum">
                {newCustomersInPeriod}
            </span>
        </div>
    );
};
