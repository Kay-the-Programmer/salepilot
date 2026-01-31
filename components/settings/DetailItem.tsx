import React from 'react';

interface DetailItemProps {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    highlight?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, icon, highlight = false }) => (
    <div className="py-4 border-b border-slate-100/50 dark:border-white/5 last:border-b-0 group">
        <div className="flex items-start gap-4">
            {icon && (
                <div className="flex-shrink-0 mt-0.5">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-100 dark:border-slate-700/50 group-hover:border-indigo-200 dark:group-hover:border-indigo-500/30 transition-colors">
                        {icon}
                    </div>
                </div>
            )}
            <div className="flex-grow min-w-0">
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">{label}</div>
                <div className={`${highlight ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-200'} ${typeof value === 'string' ? 'text-base' : ''} leading-relaxed`}>
                    {value}
                </div>
            </div>
        </div>
    </div>
);

export default DetailItem;
