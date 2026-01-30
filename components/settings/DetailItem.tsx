import React from 'react';

interface DetailItemProps {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    highlight?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, icon, highlight = false }) => (
    <div className="py-3 border-b border-slate-100 last:border-b-0">
        <div className="flex items-start gap-4">
            {icon && (
                <div className="flex-shrink-0 mt-0.5">
                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                        {icon}
                    </div>
                </div>
            )}
            <div className="flex-grow min-w-0">
                <div className="text-sm font-medium text-slate-500 mb-1">{label}</div>
                <div className={`${highlight ? 'font-bold' : 'font-semibold'} text-slate-900 ${typeof value === 'string' ? 'text-base' : ''}`}>
                    {value}
                </div>
            </div>
        </div>
    </div>
);

export default DetailItem;
