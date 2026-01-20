
import React from 'react';

const TagIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={className ?? "w-6 h-6"}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.593l6.002-4.502a2.001 2.001 0 0 0 .593-2.607L12.75 3.659a2.25 2.25 0 0 0-1.591-.659h-1.591Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
);

export default TagIcon;
