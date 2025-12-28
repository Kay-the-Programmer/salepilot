
import React from 'react';

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-2.253M15 19.128v-3.872M15 19.128A9.37 9.37 0 0 1 12.125 21a9.37 9.37 0 0 1-2.875-.872M9 21a9.375 9.375 0 0 1-2.437-5.372M9 21a9.38 9.38 0 0 1-2.625-.372M9 21v-3.872m0 0a9.375 9.375 0 0 1 3.469-6.564M12 12V2.25A2.25 2.25 0 0 0 9.75 0h-3.375c-.621 0-1.125.504-1.125 1.125v1.5A2.25 2.25 0 0 0 6.375 4.5v6.75m6.75-3.75v3.75m0-3.75a3.375 3.375 0 0 1 3.375-3.375h1.5a1.125 1.125 0 0 1 1.125 1.125v1.5a3.375 3.375 0 0 1-3.375 3.375M12 12h-1.5a3.375 3.375 0 0 0-3.375 3.375v1.5a1.125 1.125 0 0 0 1.5 1.5h1.5a3.375 3.375 0 0 0 3.375-3.375M12 12v-1.5a3.375 3.375 0 0 1 3.375-3.375M12 12v-1.5" />
  </svg>
);

export default UsersIcon;
