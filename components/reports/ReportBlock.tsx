
import React from 'react';

const ReportBlock: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[24px] shadow-[0_2px_8px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-200/50 dark:border-white/5 animate-glass-appear ${className}`}>
        <h3 className="px-6 py-5 sm:px-8 text-[13px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200/50 dark:border-white/5">{title}</h3>
        <div className="p-6 sm:p-8 overflow-x-auto">
            {children}
        </div>
    </div>
);

export default ReportBlock;
