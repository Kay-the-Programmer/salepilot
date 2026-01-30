import React from 'react';
import UsersIcon from '../../icons/UsersIcon';

interface GrowthInsightCardProps {
    newCustomersInPeriod: number;
}

export const GrowthInsightCard: React.FC<GrowthInsightCardProps> = ({ newCustomersInPeriod }) => {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
            <div className="p-4 bg-indigo-50 rounded-full mb-4">
                <UsersIcon className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Growth Insight</h3>
            <p className="text-sm text-slate-500 mt-2">
                You acquired <span className="font-bold text-indigo-600">{newCustomersInPeriod}</span> new customers this period.
            </p>
        </div>
    );
};
