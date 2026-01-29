import React from 'react';

interface MobileTableRowProps {
    label: string;
    value: string;
    rank: number;
    subLabel?: string;
    onClick?: () => void;
}

// Enhanced TableRow for mobile
export const MobileTableRow: React.FC<MobileTableRowProps> = ({ label, value, rank, subLabel, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center p-3 border-b border-gray-100 last:border-b-0 ${onClick ? 'active:bg-gray-50 cursor-pointer' : ''}`}
    >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
            {rank}
        </div>
        <div className="ml-3 flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{label}</div>
            {subLabel && (
                <div className="text-xs text-gray-500">{subLabel}</div>
            )}
        </div>
        <div className="ml-2 text-sm font-semibold text-gray-900">{value}</div>
    </div>
);
