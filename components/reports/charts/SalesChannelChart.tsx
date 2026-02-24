import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesChannelChartProps {
    online: number;
    inStore: number;
    total: number;
}

export const SalesChannelChart: React.FC<SalesChannelChartProps> = ({ online, inStore, total }) => {
    const data = [
        { name: 'Online', value: online },
        { name: 'In-Store', value: inStore },
    ];
    const COLORS = ['#3b82f6', '#fb923c'];

    return (
        <div className="relative w-full h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: any) => [value.toFixed(2), 'Revenue']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-medium text-gray-500">Online</span>
                <span className="text-2xl font-bold text-gray-900">{((online / (total || 1)) * 100).toFixed(1)}%</span>
            </div>
        </div>
    );
};
