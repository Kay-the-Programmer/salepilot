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
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
            <ArchiveBoxIcon className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="font-bold text-slate-900 text-lg">Inventory Health</h3>
            <p className="text-sm text-slate-500 mt-2 px-4">
                Your inventory has a potential profit margin of <span className="font-bold text-green-600">{((potentialProfit / (totalRetailValue || 1)) * 100).toFixed(1)}%</span>.
            </p>
        </div>
    );
};
