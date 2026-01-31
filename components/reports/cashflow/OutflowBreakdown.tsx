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
        <div className="glass-effect dark:bg-slate-800/50 rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-white/10">
            <h3 className="font-extrabold text-slate-500 dark:text-slate-400 text-[10px] mb-6 uppercase tracking-[0.2em]">Where is the money going?</h3>
            <div className="space-y-6">
                {(outflowBreakdown || []).slice(0, 5).map((item: any, i: number) => (
                    <div key={i} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.category}</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(item.amount, storeSettings)}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden shadow-inner">
                            <div
                                className="bg-gradient-to-r from-red-500 to-red-400 h-full rounded-full shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                style={{ width: `${Math.min(100, (item.amount / (totalOutflow || 1)) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
                {(!outflowBreakdown || outflowBreakdown.length === 0) && (
                    <div className="text-center py-10 opacity-40">
                        <ScaleIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">No outflow data</p>
                    </div>
                )}
            </div>
        </div>
    );
};
