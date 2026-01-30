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
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg mb-6">Inventory Value Comparison</h3>
            <div className="h-48 flex items-end justify-around px-10">
                <div className="flex flex-col items-center w-1/3">
                    <div className="w-full bg-blue-500 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity" style={{ height: '100%' }}></div>
                    <div className="mt-2 text-sm font-medium text-slate-600">Retail Value</div>
                    <div className="text-xs text-slate-500 font-bold">{formatCurrency(totalRetailValue, storeSettings)}</div>
                </div>
                <div className="flex flex-col items-center w-1/3">
                    <div className="w-full bg-yellow-400 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${(totalCostValue / totalRetailValue) * 100}%` }}></div>
                    <div className="mt-2 text-sm font-medium text-slate-600">Cost Value</div>
                    <div className="text-xs text-slate-500 font-bold">{formatCurrency(totalCostValue, storeSettings)}</div>
                </div>
            </div>
        </div>
    );
};
