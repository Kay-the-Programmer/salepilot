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
    const margin = (potentialProfit / (totalRetailValue || 1)) * 100;
    return (
        <div className="bg-surface rounded-2xl p-6 border border-brand-border flex flex-col justify-center items-center text-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-sp-navy-soft flex items-center justify-center mb-5">
                <ArchiveBoxIcon className="w-8 h-8 text-sp-navy" />
            </div>
            <h3 className="font-bold text-brand-text text-lg tracking-tight mb-2">Inventory Health</h3>
            <p className="text-sm text-brand-text-muted leading-relaxed">
                Potential profit margin across your stock
            </p>
            <span className="font-bold text-4xl text-success mt-3 tracking-tight tnum">
                {margin.toFixed(1)}%
            </span>
        </div>
    );
};
