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
        <div className="bg-surface rounded-2xl p-6 border border-brand-border h-full">
            <h3 className="font-bold text-brand-text text-lg tracking-tight mb-1">Outflow Breakdown</h3>
            <p className="text-sm text-brand-text-muted mb-5">Where the money is going</p>
            <div className="space-y-4">
                {(outflowBreakdown || []).slice(0, 5).map((item: any, i: number) => (
                    <div key={i} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-brand-text">{item.category}</span>
                            <span className="text-sm font-bold text-brand-text tnum">{formatCurrency(item.amount, storeSettings)}</span>
                        </div>
                        <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-sp-orange h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (item.amount / (totalOutflow || 1)) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
                {(!outflowBreakdown || outflowBreakdown.length === 0) && (
                    <div className="text-center py-10">
                        <ScaleIcon className="w-10 h-10 mx-auto mb-3 text-brand-text-muted/50" />
                        <p className="text-xs font-bold uppercase tracking-widest text-brand-text-muted">No outflow data</p>
                    </div>
                )}
            </div>
        </div>
    );
};
