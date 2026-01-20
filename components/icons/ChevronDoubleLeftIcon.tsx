import React from 'react';

const ChevronDoubleLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
  <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className ?? "w-6 h-6"}
      {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 0l-7.5 7.5 7.5 7.5" />
  </svg>
);

export default ChevronDoubleLeftIcon;
