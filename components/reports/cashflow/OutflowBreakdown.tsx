import React from 'react';
import { formatCurrency } from '../../../utils/currency';
import { StoreSettings } from '../../../types';
import ScaleIcon from '../../icons/ScaleIcon';

interface OutflowBreakdownProps {
    outflowBreakdown: any[];
    totalOutflow: number;
    storeSettings: StoreSettings;
}

export const OutflowBreakdown: React.FC<OutflowBreakdownProps> = ({
    outflowBreakdown,
    totalOutflow,
    storeSettings
}) => {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider text-slate-400">Where is the money going?</h3>
            <div className="space-y-4">
                {(outflowBreakdown || []).slice(0, 5).map((item: any, i: number) => (
                    <div key={i} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">{item.category}</span>
                            <span className="text-sm font-bold text-slate-900">{formatCurrency(item.amount, storeSettings)}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                                className="bg-red-500 h-full rounded-full"
                                style={{ width: `${Math.min(100, (item.amount / (totalOutflow || 1)) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
                {(!outflowBreakdown || outflowBreakdown.length === 0) && (
                    <div className="text-center py-6 text-slate-400">
                        <ScaleIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-xs">No outflow data recorded</p>
                    </div>
                )}
            </div>
        </div>
    );
};
