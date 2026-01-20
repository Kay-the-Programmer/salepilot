import React from 'react';

const BarcodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={className ?? "w-6 h-6"}
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 6.75h.75v2.25h-.75v-2.25zM6.75 16.5h.75v2.25h-.75v-2.25zM16.5 6.75h.75v2.25h-.75v-2.25zM13.5 13.5h.75v6h-.75v-6zM13.5 19.5h8.25M19.5 13.5h.75v6h-.75v-6zM16.5 13.5h.75v6h-.75v-6z"
            />
        </svg>
    );
};

export default BarcodeIcon;
