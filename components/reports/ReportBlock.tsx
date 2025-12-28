
import React from 'react';

const ReportBlock: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white shadow rounded-lg ${className}`}>
        <h3 className="px-4 py-4 sm:px-6 text-base font-semibold text-gray-800 border-b border-gray-200">{title}</h3>
        <div className="p-4 sm:p-6 overflow-x-auto">
            {children}
        </div>
    </div>
);

export default ReportBlock;
