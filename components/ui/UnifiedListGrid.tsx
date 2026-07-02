import React from 'react';
import LoadingSpinner from '../LoadingSpinner';

interface UnifiedListGridProps<T> {
    /** Array of items to display */
    items: T[];
    /** Current view mode */
    viewMode: 'grid' | 'list';
    /** Loading state */
    isLoading?: boolean;
    /** Error message */
    error?: string | null;
    /** Message to show when items array is empty */
    emptyMessage?: string;
    /** Optional bold title above the empty message */
    emptyTitle?: string;
    /** Optional CTA rendered under the empty message — guides first-time users to the next step */
    emptyAction?: {
        label: string;
        onClick: () => void;
    };
    /** Custom component to render when empty */
    emptyStateComponent?: React.ReactNode;
    /** ID of currently selected item */
    selectedId?: string | null;
    /** Function to extract unique ID from item */
    getItemId: (item: T) => string;
    /** Render function for grid view items */
    renderGridItem: (item: T, index: number, isSelected: boolean) => React.ReactNode;
    /** Render function for list view items */
    renderListItem: (item: T, index: number, isSelected: boolean) => React.ReactNode;
    /** Callback when an item is clicked */
    onItemClick?: (item: T) => void;
    /** Custom class for grid container */
    gridClassName?: string;
    /** Custom class for list container */
    listClassName?: string;
    /** Custom class for outer wrapper */
    className?: string;
    /** Animation delay between items in ms (default: 50) */
    animationDelay?: number;
    /** Whether to animate items (default: true) */
    animate?: boolean;
    /** Number of columns for grid - uses auto-fill by default */
    gridColumns?: {
        minWidth?: string;
        maxColumns?: number;
    };
}

/**
 * UnifiedListGrid - A shared component for rendering items in list or grid view
 * with consistent animations and styling patterns.
 * 
 * Uses a staggered fade-in-up animation and the design approach from
 * ProductList/InventoryPage.
 */
function UnifiedListGrid<T>({
    items,
    viewMode,
    isLoading = false,
    error = null,
    emptyMessage = 'No items to display.',
    emptyTitle,
    emptyAction,
    emptyStateComponent,
    selectedId,
    getItemId,
    renderGridItem,
    renderListItem,
    onItemClick,
    gridClassName = '',
    listClassName = '',
    className = '',
    animationDelay = 50,
    animate = true,
    gridColumns = { minWidth: '180px' },
}: UnifiedListGridProps<T>) {
    // Loading state
    if (isLoading) {
        return (
            <LoadingSpinner
                fullScreen={false}
                text="Loading..."
                className="py-12"
            />
        );
    }

    // Error state
    if (error) {
        return (
            <div className="text-center p-10 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30 m-4">
                <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <p className="text-red-600 dark:text-red-400 font-medium">Error loading data</p>
                <p className="text-red-500 dark:text-red-500/80 text-sm mt-1">{error}</p>
            </div>
        );
    }

    // Empty state — brand-toned, with an optional first-run CTA (Velocity: navy
    // primary for standard flow actions, tonal surfaces instead of gray).
    if (items.length === 0) {
        if (emptyStateComponent) {
            return <>{emptyStateComponent}</>;
        }
        return (
            <div className="text-center px-6 py-12 animate-fade-in-up">
                <div className="mx-auto w-16 h-16 bg-primary/[0.06] dark:bg-primary/15 rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                {emptyTitle && <p className="text-base font-bold text-brand-text tracking-tight">{emptyTitle}</p>}
                <p className={`text-sm text-brand-text-muted ${emptyTitle ? 'mt-1' : ''} max-w-sm mx-auto leading-relaxed`}>{emptyMessage}</p>
                {emptyAction && (
                    <button
                        type="button"
                        onClick={emptyAction.onClick}
                        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-primary text-white text-sm font-bold rounded-lg shadow-sm hover:bg-primary-container transition-all active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        {emptyAction.label}
                    </button>
                )}
            </div>
        );
    }

    // Grid template columns style
    const gridStyle: React.CSSProperties = {
        gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${gridColumns.minWidth}), 1fr))`,
    };

    if (gridColumns.maxColumns) {
        gridStyle.gridTemplateColumns = `repeat(${gridColumns.maxColumns}, minmax(0, 1fr))`;
    }

    // Animation styles
    const getAnimationStyle = (index: number): React.CSSProperties => {
        if (!animate) return {};
        return {
            animationDelay: `${index * animationDelay}ms`,
        };
    };

    return (
        <div className={`p-2 ${className}`}>
            {viewMode === 'grid' ? (
                <div
                    className={`grid gap-2 sm:gap-4 ${gridClassName}`}
                    style={gridStyle}
                >
                    {items.map((item, index) => {
                        const id = getItemId(item);
                        const isSelected = selectedId === id;
                        return (
                            <div
                                key={id}
                                onClick={() => onItemClick?.(item)}
                                className={`${animate ? 'animate-fade-in-up' : ''} cursor-pointer`}
                                style={getAnimationStyle(index)}
                            >
                                {renderGridItem(item, index, isSelected)}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={`space-y-2 ${listClassName}`}>
                    {items.map((item, index) => {
                        const id = getItemId(item);
                        const isSelected = selectedId === id;
                        return (
                            <div
                                key={id}
                                onClick={() => onItemClick?.(item)}
                                className={`${animate ? 'animate-fade-in-up' : ''} cursor-pointer`}
                                style={getAnimationStyle(index)}
                            >
                                {renderListItem(item, index, isSelected)}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default UnifiedListGrid;
