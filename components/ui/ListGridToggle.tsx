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
    const buttonSizeClasses = size === 'sm' ? 'p-1.5' : 'p-2';
    const iconSizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    return (
        <div className={`flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 ${className}`}>
            <button
                onClick={() => onViewModeChange('grid')}
                className={`${buttonSizeClasses} rounded-md transition-all duration-200 ${viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                title="Grid view"
                aria-label="Switch to grid view"
            >
                <div className="flex items-center justify-center">
                    <GridIcon className={iconSizeClasses} />
                </div>
            </button>
            <button
                onClick={() => onViewModeChange('list')}
                className={`${buttonSizeClasses} rounded-md transition-all duration-200 ${viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                title="List view"
                aria-label="Switch to list view"
            >
                <div className="flex items-center justify-center">
                    <ListIcon className={iconSizeClasses} />
                </div>
            </button>
        </div>
    );
};

export default ListGridToggle;
