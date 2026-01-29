import React from 'react';
import { StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface MobileChartProps {
    data: { date: string; value1: number; value2: number }[];
    labels: [string, string];
    colors: [string, string];
    storeSettings: StoreSettings;
    height?: number;
}

// Simplified chart component for mobile
export const MobileChart: React.FC<MobileChartProps> = ({ data, labels, colors, storeSettings, height = 160 }) => {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-gray-400">
                <div className="text-center">
                    <div className="text-sm">No data available</div>
                </div>
            </div>
        );
    }

    const maxValue = Math.max(...data.flatMap(d => [d.value1, d.value2]), 0) * 1.1 || 100;

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors[0] }}></div>
                        <span className="text-xs font-medium text-gray-600">{labels[0]}</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors[1] }}></div>
                        <span className="text-xs font-medium text-gray-600">{labels[1]}</span>
                    </div>
                </div>
                <div className="text-xs text-gray-500">
                    {data.length} days
                </div>
            </div>

            <div className="relative ml-16 mr-8" style={{ height: `${height}px` }}>
                <div className="absolute inset-0 flex items-end">
                    {data.map((point, index) => {
                        const left = `${(index / (data.length - 1 || 1)) * 100}%`;
                        const barWidth = `${80 / data.length}%`;
                        const height1 = maxValue ? `${(point.value1 / maxValue) * 85}%` : '0%';
                        const height2 = maxValue ? `${(point.value2 / maxValue) * 85}%` : '0%';

                        return (
                            <div key={index} className="absolute bottom-0 flex flex-col items-center" style={{ left, width: barWidth, transform: 'translateX(-50%)' }}>
                                <div className="relative w-full flex flex-col items-center">
                                    <div
                                        className="w-3/4 rounded-t-sm opacity-80"
                                        style={{
                                            height: height1,
                                            backgroundColor: colors[0],
                                            minHeight: '2px'
                                        }}
                                    />
                                    <div
                                        className="w-1/2 rounded-t-sm mt-1"
                                        style={{
                                            height: height2,
                                            backgroundColor: colors[1],
                                            minHeight: '2px'
                                        }}
                                    />
                                </div>
                                {index % Math.ceil(data.length / 5) === 0 && (
                                    <div className="absolute -bottom-6 text-[10px] text-gray-500 whitespace-nowrap">
                                        {new Date(point.date).getDate()}/{new Date(point.date).getMonth() + 1}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Y-axis markers */}
                {[0, 0.25, 0.5, 0.75, 1].map((tick, idx) => (
                    <div
                        key={idx}
                        className="absolute left-0 right-0 border-t border-gray-200 border-dashed"
                        style={{ bottom: `${tick * 85}%` }}
                    >
                        <div className="absolute -left-2 -top-2 transform -translate-x-full pr-2 text-xs text-gray-400">
                            {formatCurrency(maxValue * (1 - tick), storeSettings)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
