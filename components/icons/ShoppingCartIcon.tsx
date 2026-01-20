import React from 'react';

const ShoppingCartIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={className ?? "w-6 h-6"}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c.51 0 .962-.343 1.087-.835l1.823-6.831A1.125 1.125 0 0 0 18.217 6H5.25L4.11 3.835A1.125 1.125 0 0 0 3.023 3H2.25M7.5 14.25 5.106 5.162M16.5 14.25a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

export default ShoppingCartIcon;
