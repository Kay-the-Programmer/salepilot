import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Bar, Line, ComposedChart, PieChart, Pie, Cell
} from 'recharts';
import { StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface ChartProps {
    data: any[];
    storeSettings: StoreSettings;
    color?: string; // Main color for the chart
}

export const StatSparkline: React.FC<ChartProps & { height?: number }> = ({ data, color = '#10b981', height = 60 }) => {
    return (
        <div style={{ width: '100%', height: height }}>
            <ResponsiveContainer>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#gradient-${color})`}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export const RevenueChart: React.FC<ChartProps & { title?: string, barKey?: string, lineKey?: string }> = ({ data, storeSettings, barKey = 'revenue', lineKey = 'profit' }) => {
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

export const SalesChannelChart: React.FC<{ online: number; inStore: number; total: number }> = ({ online, inStore, total }) => {
    const data = [
        { name: 'Online', value: online },
        { name: 'In-Store', value: inStore },
    ];
    const COLORS = ['#3b82f6', '#fb923c']; // Blue for Online, Orange for In-Store

    return (
        <div className="relative w-full h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
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
