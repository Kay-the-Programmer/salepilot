
import React from 'react';

const ScaleIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={className ?? "w-6 h-6"}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52v1.666c0 .414-.162.79-.437 1.064l-4.25 4.25a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 0 1-.437-1.064V4.971c1.01.143 2.01.317 3 .52M3.75 4.971v1.666c0 .414.162.79.437 1.064l4.25 4.25a.75.75 0 0 0 1.06 0l4.25-4.25a.75.75 0 0 0 .437-1.064V4.971c-1.01-.203-2.01-.377-3-.521M3.75 4.971c-1.01-.203-2.01-.377-3-.521" />
    </svg>
);

export default ScaleIcon;
