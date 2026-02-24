import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';

interface SalesAreaChartProps {
    data: { date: string; totalRevenue: number }[];
    storeSettings: StoreSettings;
    color?: string;
}

export default function SalesAreaChart({
    data, storeSettings, color = '#3b82f6'
}: SalesAreaChartProps) {
    if (!data || data.length === 0) return null;

    // Process and sort data
    const chartData = useMemo(() => {
        return [...data]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(d => ({
                date: d.date,
                revenue: d.totalRevenue,
                formattedDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }));
    }, [data]);

    return (
        <div className="w-full h-full min-h-[160px] animate-fade-in">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorSalesTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="formattedDate"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                        dy={10}
                        interval="preserveStartEnd"
                        minTickGap={20}
                        hide={chartData.length > 20}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                        tickFormatter={(value) => formatCurrency(value, storeSettings)}
                        hide={true}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.85)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)'
                        }}
                        itemStyle={{ fontWeight: '900', fontSize: '15px', color: '#0f172a' }}
                        labelStyle={{ fontSize: '10px', fontWeight: '800', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        formatter={(value: any) => [formatCurrency(value, storeSettings), 'SALES']}
                        cursor={{ stroke: color, strokeWidth: 2, strokeDasharray: '5 5' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={color}
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorSalesTrend)"
                        animationDuration={1500}
                        strokeLinecap="round"
                        activeDot={{ r: 6, strokeWidth: 0, fill: color }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
