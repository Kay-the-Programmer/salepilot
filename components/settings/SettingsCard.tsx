import React from 'react';

interface SettingsCardProps {
    title: string;
    description: string;
    isEditing: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    children: React.ReactNode;
    badge?: string;
}

const SettingsCard: React.FC<SettingsCardProps> = ({
    title,
    description,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    children,
    badge
}) => {
    return (
        <div className="mb-8 last:mb-0">
            {/* Section Header */}
            <div className="px-4 sm:px-2 flex items-end justify-between mb-2 mt-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">{title}</h3>
                    {badge && !isEditing && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {badge}
                        </span>
                    )}
                </div>
                {!isEditing && (
                    <button
                        onClick={onEdit}
                        type="button"
                        className="text-[15px] font-medium text-blue-600 dark:text-blue-500 hover:text-blue-800 transition-colors mr-1"
                        aria-label={`Edit ${title}`}
                    >
                        Edit
                    </button>
                )}
            </div>

            {/* Editing Badge */}
            {isEditing && (
                <div className="flex items-center gap-2 px-4 sm:px-3 mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold animate-pulse bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5 animate-pulse"></div>
                        Editing
                    </span>
                </div>
            )}

            {/* Card Content Envelope */}
            <div className={`
                bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden
                mx-4 sm:mx-0
                ${isEditing ? 'border-blue-300 dark:border-blue-500/50 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/20' : 'border-slate-200/80 dark:border-white/10 shadow-sm'}
                transition-all duration-300
            `}>
                <div className="p-0">
                    {children}
                </div>
            </div>

            {/* Section Footer / Description */}
            <div className="px-4 sm:px-3 mt-2 mx-2">
                <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
            </div>

            {/* Edit Actions */}
            {isEditing && (
                <div className="mt-4 flex flex-col sm:flex-row justify-end gap-3 px-4 sm:px-2">
                    <button
                        onClick={onCancel}
                        type="button"
                        className="px-5 py-2.5 text-[15px] font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all active:scale-95"
                    >
                        Discard
                    </button>
                    <button
                        onClick={onSave}
                        type="button"
                        className="px-5 py-2.5 text-[15px] font-semibold text-white bg-blue-600 dark:bg-blue-500 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        Save Changes
                    </button>
                </div>
            )}
        </div>
    );
};

export default SettingsCard;
