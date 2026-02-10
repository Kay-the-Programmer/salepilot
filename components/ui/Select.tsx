import React from 'react';
import { ChevronDownIcon } from '../icons';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    hasError?: boolean;
    helperText?: string;
    icon?: React.ReactNode;
    containerClassName?: string;
}

export function Select({
    label,
    hasError = false,
    helperText,
    icon,
    className = '',
    containerClassName = '',
    children,
    disabled,
    ...props
}: SelectProps) {
    const baseClasses = `w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/20 focus:border-transparent dark:text-slate-100 transition-all appearance-none ${icon ? 'pl-10' : ''} ${hasError ? 'border-red-300 dark:border-red-500/50' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`;

    return (
        <div className={`mb-4 ${containerClassName}`}>
            {label && (
                <label htmlFor={props.id || props.name} className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-2">
                    {label} {props.required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none">
                        {icon}
                    </div>
                )}
                <select
                    className={baseClasses}
                    disabled={disabled}
                    {...props}
                >
                    {children}
                </select>
                {/* Custom Chevron for appearance-none */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500 dark:text-slate-400">
                    <ChevronDownIcon className="w-5 h-5" />
                </div>
            </div>
            {helperText && (
                <p className={`mt-1 text-sm ${hasError ? 'text-red-500' : 'text-gray-500 dark:text-slate-500'}`}>
                    {helperText}
                </p>
            )}
        </div>
    );
}

export default Select;
