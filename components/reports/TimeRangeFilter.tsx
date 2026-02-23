import React, { useState, useRef, useEffect } from 'react';
import ChevronDownIcon from '../icons/ChevronDownIcon';

export type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface TimeRangeFilterProps {
    value: TimeFilter;
    onChange: (value: TimeFilter) => void;
    onOpenChange?: (isOpen: boolean) => void;
    className?: string;
}

export const filterLabels: Record<TimeFilter, string> = {
    'daily': 'Today',
    'weekly': 'Last 7 Days',
    'monthly': 'This Month',
    'yearly': 'This Year'
};

export const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({ value, onChange, onOpenChange, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        onOpenChange?.(isOpen);
    }, [isOpen, onOpenChange]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 px-2 py-1 rounded-lg transition-colors border border-slate-200 dark:border-white/10 active:scale-95 transition-all duration-300"
            >
                {filterLabels[value]}
                <ChevronDownIcon className="w-3 h-3" />
            </button>
            {isOpen && (
                <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] absolute right-0 top-full mt-2 w-36 border border-slate-200/50 dark:border-white/10 py-1.5 z-50 animate-fade-in-up">
                    {(Object.keys(filterLabels) as TimeFilter[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => {
                                onChange(f);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors
                                ${value === f ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/20' : 'text-slate-600 dark:text-gray-300'}
                            `}
                        >
                            {filterLabels[f]}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
