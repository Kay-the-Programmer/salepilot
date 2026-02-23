import React from 'react';

interface DetailItemProps {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, icon, className = '' }) => (
    <div className={`py-3 border-b border-slate-100 dark:border-white/5 last:border-0 ${className}`}>
        <div className="flex items-center gap-2 mb-1.5 opacity-70">
            {icon && (
                <div className="flex-shrink-0">
                    {React.isValidElement(icon) ?
                        React.cloneElement(icon as React.ReactElement<any>, { className: 'w-3.5 h-3.5' }) : icon}
                </div>
            )}
            <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
        </div>
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 break-words md:pl-[1.375rem]">
            {value}
        </div>
    </div>
);

export default DetailItem;
