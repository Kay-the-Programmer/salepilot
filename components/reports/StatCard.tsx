import React from 'react';
import InformationCircleIcon from '../icons/InformationCircleIcon';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    noWrap?: boolean;
    compact?: boolean;
    tooltip?: string;
    sparklineColor?: string; // Kept for interface compatibility, though not used in the UI part provided
    storeSettings?: any; // Kept for interface compatibility
}

// Enhanced StatCard with better mobile styling
export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, noWrap = false, compact = false, tooltip }) => (
    <div className={`relative overflow-hidden rounded-2xl glass-effect shadow-lg border border-gray-100/50 
        ${compact ? 'p-3' : 'p-4 sm:p-5'} 
        transition-all duration-200 hover:shadow-xl active:scale-[0.99]`}>
        {tooltip && (
            <div className="absolute top-3 right-3 z-10 group/tooltip">
                <InformationCircleIcon className="w-3.5 h-3.5 text-gray-300 hover:text-blue-500 transition-colors cursor-help" />
                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                    {tooltip}
                </div>
            </div>
        )}
        <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full ${color} opacity-10`}></div>
        <div className="flex items-start">
            <div className={`flex-shrink-0 rounded-xl p-2.5 sm:p-3 ${color} bg-opacity-15`}>
                {icon}
            </div>
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <div className={`${noWrap ? 'whitespace-nowrap' : ''} text-xs sm:text-sm font-medium text-gray-500 mb-1`}>
                    {title}
                </div>
                <div className={`text-lg sm:text-xl font-bold text-gray-900 leading-tight ${noWrap ? 'whitespace-nowrap' : ''}`}>
                    {value}
                </div>
            </div>
        </div>
    </div>
);
