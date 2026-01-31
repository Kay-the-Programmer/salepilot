import React from 'react';
import { formatCurrency } from '../../../utils/currency';
import { StoreSettings } from '../../../types';

interface InventoryValueComparisonProps {
    totalRetailValue: number;
    totalCostValue: number;
    storeSettings: StoreSettings;
}

export const InventoryValueComparison: React.FC<InventoryValueComparisonProps> = ({
    totalRetailValue,
    totalCostValue,
    storeSettings
}) => {
    return (
        <div className="lg:col-span-2 dark:bg-slate-800 glass-effect rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-white/10">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-6 uppercase tracking-wider">Inventory Value Comparison</h3>
            <div className="h-56 flex items-end justify-around px-8 gap-8">
                <div className="flex flex-col items-center w-1/3 group">
                    <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-all duration-300" style={{ height: '100%' }}></div>
                    <div className="mt-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Retail Value</div>
                    <div className="text-sm text-slate-900 dark:text-white font-black mt-1">{formatCurrency(totalRetailValue, storeSettings)}</div>
                </div>
                <div className="flex flex-col items-center w-1/3 group">
                    <div className="w-full bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-xl shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition-all duration-300" style={{ height: `${(totalCostValue / (totalRetailValue || 1)) * 100}%` }}></div>
                    <div className="mt-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cost Value</div>
                    <div className="text-sm text-slate-900 dark:text-white font-black mt-1">{formatCurrency(totalCostValue, storeSettings)}</div>
                </div>
            </div>
        </div>
    );
};
