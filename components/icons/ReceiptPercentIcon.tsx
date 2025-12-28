
import React from 'react';

const ReceiptPercentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM16.5 18.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM11.25 15.75l1.5-1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5" />
  </svg>
);

export default ReceiptPercentIcon;
