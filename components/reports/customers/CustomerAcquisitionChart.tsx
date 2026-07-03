import React from 'react';
import UsersIcon from '../../icons/UsersIcon';

export const CustomerAcquisitionChart: React.FC = () => {
    return (
        <div className="bg-surface rounded-2xl p-6 border border-brand-border h-full">
            <h3 className="font-bold text-brand-text text-lg tracking-tight mb-5">Customer Acquisition</h3>
            <div className="h-56 flex items-center justify-center bg-surface-variant/40 rounded-xl border border-dashed border-brand-border">
                <div className="text-center p-6">
                    <div className="w-14 h-14 rounded-2xl bg-surface border border-brand-border flex items-center justify-center mx-auto mb-3">
                        <UsersIcon className="w-7 h-7 text-brand-text-muted" />
                    </div>
                    <p className="text-brand-text font-bold text-sm">Customer trend visualization</p>
                    <p className="text-brand-text-muted text-xs mt-1.5 max-w-[220px] mx-auto leading-relaxed">More historical data is needed to generate this chart.</p>
                </div>
            </div>
        </div>
    );
};
