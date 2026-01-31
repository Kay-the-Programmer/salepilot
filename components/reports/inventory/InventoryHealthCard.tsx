import React from 'react';
import ArchiveBoxIcon from '../../icons/ArchiveBoxIcon';

interface InventoryHealthCardProps {
    potentialProfit: number;
    totalRetailValue: number;
}

export const InventoryHealthCard: React.FC<InventoryHealthCardProps> = ({
    potentialProfit,
    totalRetailValue
}) => {
    return (
        <div className="glass-effect dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-white/10 flex flex-col justify-center items-center text-center">
            <div className="p-5 bg-blue-50 dark:bg-blue-500/10 rounded-2xl mb-6">
                <ArchiveBoxIcon className="w-12 h-12 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xl mb-3">Inventory Health</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Your inventory has a potential profit margin of <br />
                <span className="font-black text-2xl text-green-600 dark:text-green-400 mt-2 block tracking-tight">
                    {((potentialProfit / (totalRetailValue || 1)) * 100).toFixed(1)}%
                </span>
            </p>
        </div>
    );
};
