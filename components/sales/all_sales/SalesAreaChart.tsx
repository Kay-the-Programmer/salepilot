import React, { useMemo, useState } from 'react';
import { StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';

interface SalesAreaChartProps {
    data: { date: string; totalRevenue: number }[];
    storeSettings: StoreSettings;
    color?: string;
}

export default function SalesAreaChart({
    data, storeSettings, color = 'blue'
}: SalesAreaChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (!data || data.length === 0) return null;

    const height = 180;
    const width = 1000;
    const padding = { top: 20, bottom: 20 };

    // Sort and memoize data
    const sortedData = useMemo(() =>
        [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        , [data]);

    // Memoize chart geometry so hover state changes don't recompute paths or points.
    // Expected impact: avoids O(n) path/point recalculation on every hover move.
    const { points, pathD, lineD } = useMemo(() => {
        const maxVal = Math.max(...sortedData.map(d => d.totalRevenue)) || 1;
        const computedPoints = sortedData.map((d, i) => {
            const x = (i / (sortedData.length - 1 || 1)) * width;
            const normalizedY = (d.totalRevenue / maxVal);
            const y = height - (normalizedY * (height - padding.top - padding.bottom)) - padding.bottom;
            return { x, y, ...d };
        });

        const computedPathD = `M0,${height} ` + computedPoints.map(p => `L${p.x},${p.y}`).join(' ') + ` L${width},${height} Z`;
        const computedLineD = computedPoints.length === 1
            ? `M0,${computedPoints[0].y} L${width},${computedPoints[0].y}`
            : `M${computedPoints[0].x},${computedPoints[0].y} ` + computedPoints.slice(1).map(p => `L${p.x},${p.y}`).join(' ');

        return { points: computedPoints, pathD: computedPathD, lineD: computedLineD };
    }, [sortedData, height, padding.bottom, padding.top, width]);

    return (
        <div className="relative w-full h-full" onMouseLeave={() => setHoveredIndex(null)}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                className="w-full h-full text-blue-500 overflow-visible"
            >
                <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                        <stop offset="90%" stopColor="currentColor" stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                <path d={pathD} fill="url(#chartGradient)" />
                <path
                    d={lineD}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Interactive Overlay Columns */}
                {points.map((p, i) => (
                    <rect
                        key={i}
                        x={i === 0 ? 0 : points[i - 1].x + (p.x - points[i - 1].x) / 2}
                        y={0}
                        width={width / points.length}
                        height={height}
                        fill="transparent"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onClick={() => setHoveredIndex(i)}
                        onTouchStart={() => setHoveredIndex(i)}
                    />
                ))}

                {/* Visible Dots & Tooltip Indicator */}
                {points.map((p, i) => (
                    <g key={i}>
                        {(points.length < 15 || hoveredIndex === i) && (
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={hoveredIndex === i ? 6 : 3}
                                fill="white"
                                stroke="currentColor"
                                strokeWidth={hoveredIndex === i ? 3 : 2}
                                vectorEffect="non-scaling-stroke"
                            />
                        )}
                    </g>
                ))}
            </svg>

            {/* Tooltip */}
            {hoveredIndex !== null && points[hoveredIndex] && (
                <div
                    className="absolute bg-gray-900 text-white text-xs rounded-lg py-1 px-2 pointer-events-none shadow-xl transform -translate-x-1/2 -translate-y-full z-10"
                    style={{
                        left: `${(points[hoveredIndex].x / width) * 100}%`,
                        top: `${(points[hoveredIndex].y / height) * 100}%`,
                        marginTop: '-12px'
                    }}
                >
                    <div className="font-bold whitespace-nowrap">{formatCurrency(points[hoveredIndex].totalRevenue, storeSettings)}</div>
                    <div className="text-[10px] text-gray-300 whitespace-nowrap text-center">
                        {new Date(points[hoveredIndex].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                </div>
            )}
        </div>
    );
};
