import React, { useState, useRef, useEffect } from 'react';
import ChevronDownIcon from '../icons/ChevronDownIcon';

export type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface TimeRangeFilterProps {
    value: TimeFilter;
    onChange: (value: TimeFilter) => void;
    className?: string;
}

export const filterLabels: Record<TimeFilter, string> = {
    'daily': 'Today',
    'weekly': 'Last 7 Days',
    'monthly': 'This Month',
    'yearly': 'This Year'
};

export const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({ value, onChange, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors border border-slate-200"
            >
                {filterLabels[value]}
                <ChevronDownIcon className="w-3 h-3" />
            </button>
            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-fade-in-up">
                    {(Object.keys(filterLabels) as TimeFilter[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => {
                                onChange(f);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors
                                ${value === f ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'}
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
