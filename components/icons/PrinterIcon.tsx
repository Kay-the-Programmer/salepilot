import React from 'react';

const PrinterIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 18M6 15V9C6 7.34315 7.34315 6 9 6H15C16.6569 6 18 7.34315 18 9V15M6 15C5.44772 15 5 15.4477 5 16V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V16C19 15.4477 18.5523 15 18 15M6 15H18M15 9V3H9V9" />
    </svg>
);

export default PrinterIcon;
