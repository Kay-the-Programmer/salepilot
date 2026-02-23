import React from 'react';
import UsersIcon from '../../icons/UsersIcon';

export const CustomerAcquisitionChart: React.FC = () => {
    return (
        <div className="lg:col-span-2 dark:bg-slate-800 glass-effect rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-white/10">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-6 uppercase tracking-wider">Customer Acquisition</h3>
            <div className="h-56 flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                <div className="text-center p-6">
                    <div className="liquid-glass-card rounded-[2rem] p-4 dark:bg-slate-800 inline-block mb-4">
                        <UsersIcon className="w-10 h-10 text-slate-300 dark:text-slate-500" />
                    </div>
                    <p className="text-slate-900 dark:text-white font-bold text-sm">Customer trend data visualization</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 max-w-[200px] mx-auto leading-relaxed">Detailed historical data is required to generate this chart.</p>
                </div>
            </div>
        </div>
    );
};
