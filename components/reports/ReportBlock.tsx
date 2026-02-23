
import React from 'react';

const ReportBlock: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`liquid-glass-card rounded-[2rem] animate-glass-appear ${className}`}>
        <h3 className="px-6 py-5 sm:px-8 text-[13px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200/50 dark:border-white/5">{title}</h3>
        <div className="p-6 sm:p-8 overflow-x-auto">
            {children}
        </div>
    </div>
);

export default ReportBlock;
