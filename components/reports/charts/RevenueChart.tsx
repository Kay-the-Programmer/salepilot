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
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
    data,
    storeSettings,
    barKey = 'revenue',
    lineKey = 'profit'
}) => {
    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickFormatter={(value) => formatCurrency(value, storeSettings)}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [formatCurrency(value, storeSettings), 'Amount']}
                    />
                    <Bar
                        dataKey={barKey}
                        barSize={12}
                        fill="#fb923c"
                        radius={[4, 4, 0, 0]}
                    />
                    <Line
                        type="monotone"
                        dataKey={lineKey}
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={false}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
