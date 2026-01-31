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
    <div className={`relative overflow-hidden rounded-2xl glass-effect shadow-lg border border-slate-200/50 dark:border-white/10 
        ${compact ? 'p-3' : 'p-4 sm:p-5'} 
        transition-all duration-200 hover:shadow-xl active:scale-[0.99]`}>
        {tooltip && (
            <div className="absolute top-3 right-3 z-10 group/tooltip">
                <InformationCircleIcon className="w-3.5 h-3.5 text-slate-300 dark:text-slate-500 hover:text-blue-500 transition-colors cursor-help" />
                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none shadow-xl z-50 border border-slate-700">
                    {tooltip}
                </div>
            </div>
        )}
        <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full ${color} opacity-10 dark:opacity-20`}></div>
        <div className="flex items-start">
            <div className={`flex-shrink-0 rounded-xl p-2.5 sm:p-3 ${color} bg-opacity-15 dark:bg-opacity-25`}>
                {icon}
            </div>
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <div className={`${noWrap ? 'whitespace-nowrap' : ''} text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1`}>
                    {title}
                </div>
                <div className={`text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight ${noWrap ? 'whitespace-nowrap' : ''}`}>
                    {value}
                </div>
            </div>
        </div>
    </div>
);
