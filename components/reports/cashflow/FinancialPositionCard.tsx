import React from 'react';
import ScaleIcon from '../../icons/ScaleIcon';

interface FinancialPositionCardProps {
    netCashflow: number;
}

export const FinancialPositionCard: React.FC<FinancialPositionCardProps> = ({ netCashflow }) => {
    const isPositive = netCashflow >= 0;

    return (
        <div className={`relative overflow-hidden rounded-2xl p-6 glass-effect shadow-lg border-l-4 transition-all duration-300 active:scale-[0.99]
            ${isPositive ? 'border-l-blue-500/50 shadow-blue-500/5' : 'border-l-rose-500/50 shadow-rose-500/5'}`}>

            {/* Background Decorative Elements */}
            <div className={`absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full blur-3xl opacity-20
                ${isPositive ? 'bg-blue-400' : 'bg-rose-400'}`}></div>
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-slate-400/10 rounded-full blur-2xl"></div>

            <div className="relative z-10">
                <h3 className="font-extrabold text-xl mb-1 tracking-tight text-slate-900 dark:text-white">Financial Position</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Current performance insight</p>

                <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/50 dark:border-white/10">
                    <div className={`p-3 rounded-xl ${isPositive ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                        <ScaleIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                            Your net cashflow is <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${isPositive ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}`}>
                                {isPositive ? 'POSITIVE' : 'NEGATIVE'}
                            </span>
                        </p>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {isPositive ? 'Great job maintaining surplus!' : 'Consider reviewing upcoming expenses.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
