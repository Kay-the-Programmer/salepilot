import React from 'react';

interface DetailItemProps {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    highlight?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, icon, highlight = false }) => (
    <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 sm:px-5 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-white/5 last:border-b-0 min-h-[44px]">
        <div className="flex items-center gap-3 mb-1 sm:mb-0">
            {icon && (
                <div className="flex-shrink-0">
                    <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center">
                        {icon}
                    </div>
                </div>
            )}
            <div className={`text-[17px] tracking-tight ${highlight ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-900 dark:text-white'}`}>
                {label}
            </div>
        </div>

        <div className="flex items-center sm:justify-end sm:max-w-[60%] w-full sm:w-auto">
            <div className="text-[17px] text-slate-500 dark:text-slate-400 sm:text-right w-full">
                {value}
            </div>
        </div>
    </div>
);

export default DetailItem;
