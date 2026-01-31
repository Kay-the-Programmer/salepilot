import React from 'react';
import { GridIcon, ListIcon } from '../icons';

interface ListGridToggleProps {
    /** Current view mode */
    viewMode: 'grid' | 'list';
    /** Callback when view mode changes */
    onViewModeChange: (mode: 'grid' | 'list') => void;
    /** Additional CSS classes */
    className?: string;
    /** Size variant */
    size?: 'sm' | 'md';
}

/**
 * ListGridToggle - A standardized toggle button for switching between list and grid views.
 * Provides consistent UI across all pages using UnifiedListGrid.
 */
const ListGridToggle: React.FC<ListGridToggleProps> = ({
    viewMode,
    onViewModeChange,
    className = '',
    size = 'md',
}) => {
    const isGrid = viewMode === 'grid';
    const buttonSizeClasses = size === 'sm' ? 'p-2' : 'p-2.5';
    const iconSizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        onViewModeChange(isGrid ? 'list' : 'grid');
    };

    return (
        <button
            onClick={handleToggle}
            className={`flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50/30 dark:hover:bg-blue-500/10 transition-all shadow-sm group ${buttonSizeClasses} ${className}`}
            title={isGrid ? "Switch to List View" : "Switch to Grid View"}
            aria-label={isGrid ? "Switch to List View" : "Switch to Grid View"}
        >
            <div className="flex items-center justify-center">
                {isGrid ? (
                    <ListIcon className={`${iconSizeClasses} group-hover:scale-110 transition-transform`} />
                ) : (
                    <GridIcon className={`${iconSizeClasses} group-hover:scale-110 transition-transform`} />
                )}
            </div>
        </button>
    );
};

export default ListGridToggle;
