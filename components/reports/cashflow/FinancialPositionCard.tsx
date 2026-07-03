import React from 'react';
import ScaleIcon from '../../icons/ScaleIcon';

interface FinancialPositionCardProps {
    netCashflow: number;
}

export const FinancialPositionCard: React.FC<FinancialPositionCardProps> = ({ netCashflow }) => {
    const isPositive = netCashflow >= 0;

    return (
        <div className="bg-surface rounded-2xl p-6 border border-brand-border h-full">
            <h3 className="font-bold text-lg tracking-tight text-brand-text mb-1">Financial Position</h3>
            <p className="text-sm text-brand-text-muted mb-5">Current cashflow performance</p>

            <div className="flex items-center gap-4 bg-surface-variant/50 p-4 rounded-xl border border-brand-border">
                <div className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center ${isPositive ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                    <ScaleIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-brand-text leading-tight flex items-center gap-1.5 flex-wrap">
                        Net cashflow is
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isPositive ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                            {isPositive ? 'Positive' : 'Negative'}
                        </span>
                    </p>
                    <p className="mt-1 text-xs text-brand-text-muted">
                        {isPositive ? 'Great job maintaining a surplus.' : 'Consider reviewing upcoming expenses.'}
                    </p>
                </div>
            </div>
        </div>
    );
};
