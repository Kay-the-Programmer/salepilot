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
    // Retail = navy (primary), Cost = neutral outline so the gap reads as margin.
    const data = [
        { name: 'Retail Value', value: totalRetailValue, color: '#002B6B' },
        { name: 'Cost Value', value: totalCostValue, color: '#94a3b8' },
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-surface p-3 rounded-lg shadow-lg border border-brand-border">
                    <p className="font-bold text-brand-text mb-1 uppercase tracking-wider text-[10px]">{label}</p>
                    <p className="text-sm font-bold tnum" style={{ color: payload[0].payload.color }}>
                        {formatCurrency(payload[0].value, storeSettings)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-surface rounded-2xl p-6 border border-brand-border flex flex-col h-full">
            <h3 className="font-bold text-brand-text text-lg tracking-tight mb-6">Inventory Value Comparison</h3>

            {/* Chart Area */}
            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#747782', fontSize: 12, fontWeight: 600 }}
                            dy={10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar
                            dataKey="value"
                            radius={[6, 6, 0, 0]}
                            barSize={60}
                            animationDuration={1200}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Value labels */}
            <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-variant/50 border border-brand-border p-3 text-center">
                    <div className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Retail Value</div>
                    <div className="text-base text-brand-text font-bold mt-1 tnum">{formatCurrency(totalRetailValue, storeSettings)}</div>
                </div>
                <div className="rounded-xl bg-surface-variant/50 border border-brand-border p-3 text-center">
                    <div className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Cost Value</div>
                    <div className="text-base text-brand-text font-bold mt-1 tnum">{formatCurrency(totalCostValue, storeSettings)}</div>
                </div>
            </div>
        </div>
    );
};
