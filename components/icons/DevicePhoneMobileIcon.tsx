import React from 'react';

const DevicePhoneMobileIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H5.25A2.25 2.25 0 0 0 3 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 20.25V3.75A2.25 2.25 0 0 0 18.75 1.5H13.5m-3 0h3m-3 18h3" />
    </svg>
);

export default DevicePhoneMobileIcon;
