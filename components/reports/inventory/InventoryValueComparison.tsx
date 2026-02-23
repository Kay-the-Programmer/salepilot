import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
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
    const data = [
        { name: 'Retail Value', value: totalRetailValue, color: '#3b82f6' }, // blue-500
        { name: 'Cost Value', value: totalCostValue, color: '#eab308' }, // yellow-500
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-wider text-xs">{label}</p>
                    <p className="text-sm font-black" style={{ color: payload[0].payload.color }}>
                        {formatCurrency(payload[0].value, storeSettings)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="lg:col-span-2 dark:bg-slate-800 glass-effect rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-white/10 flex flex-col h-full">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-6 uppercase tracking-wider">Inventory Value Comparison</h3>

            {/* Chart Area */}
            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} // slate-500
                            dy={10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar
                            dataKey="value"
                            radius={[6, 6, 0, 0]}
                            barSize={60}
                            animationDuration={1500}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Labels Area matching the existing layout */}
            <div className="mt-8 flex justify-around px-4">
                <div className="flex flex-col items-center">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Retail Value</div>
                    <div className="text-sm text-slate-900 dark:text-white font-black mt-1 text-center">{formatCurrency(totalRetailValue, storeSettings)}</div>
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Cost Value</div>
                    <div className="text-sm text-slate-900 dark:text-white font-black mt-1 text-center">{formatCurrency(totalCostValue, storeSettings)}</div>
                </div>
            </div>
        </div>
    );
};
