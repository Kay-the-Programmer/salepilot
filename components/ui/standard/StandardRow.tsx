import React from 'react';

export interface StandardRowProps {
    title: string;
    subtitle?: string;
    /** Leading content (icon, image, initials) */
    leading?: React.ReactNode;
    /** Status badge or similar */
    status?: React.ReactNode;
    /** Primary right-aligned meta info (Price, Date, etc.) */
    primaryMeta?: React.ReactNode;
    /** Secondary right-aligned meta info (e.g. small label) */
    secondaryMeta?: React.ReactNode;
    /** Additional details to show in the middle or bottom */
    details?: React.ReactNode[];
    /** Actions buttons */
    actions?: React.ReactNode;
    isSelected?: boolean;
    onClick?: () => void;
    className?: string;
}

const StandardRow: React.FC<StandardRowProps> = ({
    title,
    subtitle,
    leading,
    status,
    primaryMeta,
    secondaryMeta,
    details = [],
    actions,
    isSelected,
    onClick,
    className = ''
}) => {
    return (
        <div
            className={`rounded-xl border shadow-sm p-4 flex items-center justify-between transition-all duration-200 cursor-pointer ${isSelected
                ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 ring-1 ring-blue-500/20'
                : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-white/10 hover:border-blue-200 dark:hover:border-blue-500/50 hover:shadow-md'
                } ${className}`}
            onClick={(e) => {
                if (!e.defaultPrevented && onClick) {
                    onClick();
                }
            }}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Leading (Icon/Image) */}
                {leading && (
                    <div className="flex-shrink-0">
                        {leading}
                    </div>
                )}

                {/* Main Content */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-semibold cursor-pointer truncate ${isSelected ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                            {title}
                        </h3>
                        {status && (
                            <div className="flex-shrink-0">
                                {status}
                            </div>
                        )}
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-4 mt-0.5 items-center">
                        {subtitle && <span className="font-medium text-gray-700 dark:text-gray-300">{subtitle}</span>}
                        {details.map((detail, idx) => (
                            <React.Fragment key={idx}>
                                {detail}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Meta & Actions */}
            <div className="flex items-center gap-4 ml-4 shrink-0">
                {(primaryMeta || secondaryMeta) && (
                    <div className="text-right">
                        {primaryMeta && (
                            <div className={`font-bold ${isSelected ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                                {primaryMeta}
                            </div>
                        )}
                        {secondaryMeta && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {secondaryMeta}
                            </div>
                        )}
                    </div>
                )}

                {actions && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StandardRow;
