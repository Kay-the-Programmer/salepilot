import React from 'react';

interface DetailItemProps {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, icon, className = '' }) => (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 py-2 ${className}`}>
        <div className="flex items-center gap-2 min-w-0">
            {icon && (
                <div className="text-slate-400 dark:text-slate-500 flex-shrink-0">
                    {React.isValidElement(icon) ?
                        React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' }) : icon}
                </div>
            )}
            <span className="text-sm text-slate-600 dark:text-slate-400 truncate">{label}</span>
        </div>
        <div className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 text-right sm:text-left truncate pl-6 sm:pl-0">
            {value}
        </div>
    </div>
);

export default DetailItem;
