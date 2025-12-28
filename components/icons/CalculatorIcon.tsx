
import React from 'react';

const CalculatorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18.75m3-3h-3m3 0l-3 3m0 0l-3-3m3 3V15.75m-6-3.375a1.125 1.125 0 0 1 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 21H7.5a2.25 2.25 0 0 1-2.25-2.25V5.25A2.25 2.25 0 0 1 7.5 3h9a2.25 2.25 0 0 1 2.25 2.25V18" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h3v3h-3v-3Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12h3v3h-3v-3Z" />
  </svg>
);

export default CalculatorIcon;
