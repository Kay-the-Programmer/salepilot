import React from 'react';
import { ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Line, ResponsiveContainer } from 'recharts';
import { StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';

interface RevenueChartProps {
    data: any[];
    storeSettings: StoreSettings;
    title?: string;
    barKey?: string;
    lineKey?: string;
    barColor?: string;
    lineColor?: string;
    height?: string | number;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
    data,
    storeSettings,
    barKey = 'revenue',
    lineKey = 'profit',
    barColor = '#FF7F27', // orange bars (revenue)
    lineColor = '#002B6B', // navy line (profit)
    height = 300
}) => {
    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                        tickFormatter={(value) => formatCurrency(value, storeSettings)}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.08)',
                            backgroundColor: '#ffffff',
                            padding: '10px 12px'
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                        formatter={(value: any, name: string | undefined) => {
                            const label = name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Amount';
                            return [formatCurrency(value, storeSettings), label];
                        }}
                    />
                    <Bar
                        dataKey={barKey}
                        barSize={16}
                        fill={barColor}
                        radius={[6, 6, 0, 0]}
                    />
                    <Line
                        type="monotone"
                        dataKey={lineKey}
                        stroke={lineColor}
                        strokeWidth={4}
                        dot={{ r: 4, fill: lineColor, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
