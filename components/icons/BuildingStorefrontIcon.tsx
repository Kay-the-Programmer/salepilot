
import React from 'react';

const BuildingStorefrontIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A.75.75 0 0 1 14.25 12h.75c.414 0 .75.336.75.75v7.5c0 .414-.336.75-.75.75h-.75a.75.75 0 0 1-.75-.75Zm-4.5 0v-7.5A.75.75 0 0 1 9.75 12h.75c.414 0 .75.336.75.75v7.5c0 .414-.336.75-.75.75h-.75A.75.75 0 0 1 9 21Zm-4.5 0v-7.5A.75.75 0 0 1 5.25 12h.75c.414 0 .75.336.75.75v7.5c0 .414-.336.75-.75.75h-.75a.75.75 0 0 1-.75-.75Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5v7.5c0 .414.336.75.75.75h16.5a.75.75 0 0 0 .75-.75v-7.5c0-.414-.336-.75-.75-.75h-16.5a.75.75 0 0 0-.75.75Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 6v7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export default BuildingStorefrontIcon;
