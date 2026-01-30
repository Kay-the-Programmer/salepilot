import React from 'react';
import ScaleIcon from '../../icons/ScaleIcon';

interface FinancialPositionCardProps {
    netCashflow: number;
}

export const FinancialPositionCard: React.FC<FinancialPositionCardProps> = ({ netCashflow }) => {
    return (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <h3 className="font-bold text-lg mb-1">Financial Position</h3>
            <p className="text-blue-100 text-xs mb-4">Current performance insight</p>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${netCashflow >= 0 ? 'bg-green-400/20' : 'bg-red-400/20'}`}>
                    <ScaleIcon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium leading-tight">
                    Your net cashflow is <span className="font-bold underlineDecoration decoration-2">{netCashflow >= 0 ? 'positive' : 'negative'}</span>.
                    {netCashflow >= 0 ? ' Great job maintaining surplus!' : ' Consider reviewing upcoming expenses.'}
                </p>
            </div>
        </div>
    );
};
