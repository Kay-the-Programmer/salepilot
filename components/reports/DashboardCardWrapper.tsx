import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface DashboardCardWrapperProps {
    id: string;
    children: React.ReactNode;
    className?: string;
    isOverlay?: boolean;
    isEditMode?: boolean;
}

export const DashboardCardWrapper: React.FC<DashboardCardWrapperProps> = ({
    id,
    children,
    className = "",
    isOverlay = false,
    isEditMode = true, // Default to true for backward compatibility or if not provided
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        disabled: !isEditMode && !isOverlay
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    const activeClass = isDragging ? 'scale-105 rotate-1 shadow-2xl z-50 ring-2 ring-blue-500/50' : '';
    const overlayClass = isOverlay ? 'scale-105 rotate-1 shadow-2xl z-[100] cursor-grabbing' : '';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group h-full transition-all duration-300 ${activeClass} ${overlayClass} ${className}`}
        >
            {/* Direct Drag Handle - Visible only in Edit Mode */}
            {isEditMode && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-3 md:top-4 right-3 md:right-4 z-[60] p-2.5 md:p-2 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-white/10 cursor-grab active:cursor-grabbing text-slate-400 hover:text-blue-600 transition-all hover:scale-110 active:scale-95"
                >
                    <GripVertical className="w-6 h-6 md:w-5 md:h-5" />
                </div>
            )}

            <div className={`h-full ${isDragging && !isOverlay ? 'opacity-20' : 'opacity-100'}`}>
                {children}
            </div>

            {/* Drop Indicator / Placeholder glow when dragging over */}
            {!isDragging && (
                <div className="absolute inset-0 -z-10 bg-blue-500/5 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
            )}
        </div>
    );
};
