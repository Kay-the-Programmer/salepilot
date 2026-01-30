import React from 'react';
import { PencilIcon, ShieldCheckIcon } from '../icons';

interface SettingsCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
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
    icon,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    children,
    badge
}) => {
    return (
        <div className={`relative bg-white rounded-2xl border transition-all duration-500 ${isEditing
            ? 'border-blue-200 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/10'
            : 'border-slate-200 shadow-sm hover:shadow-md hover:shadow-slate-200/50 hover:-translate-y-0.5'
            }`}>
            {/* Card Header */}
            <div className="px-6 py-5">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                        <div className={`relative flex-shrink-0 rounded-xl p-3 transition-all duration-500 ${isEditing
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-slate-50 text-slate-500 border border-slate-100'
                            }`}>
                            {React.cloneElement(icon as React.ReactElement<{ className: string }>, { className: "w-5 h-5" })}
                            {isEditing && (
                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-2.5 mb-1">
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
                                {badge && !isEditing && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100">
                                        {badge}
                                    </span>
                                )}
                                {isEditing && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold animate-pulse bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border border-blue-200">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                                        Editing
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">{description}</p>
                        </div>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={onEdit}
                            type="button"
                            className="group relative inline-flex items-center gap-x-2 rounded-xl bg-gradient-to-b from-white to-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:ring-blue-200 hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all duration-300 hover:scale-[1.02] active:scale-95"
                            aria-label={`Edit ${title}`}
                        >
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-blue-500/10 transition-all duration-300"></div>
                            <PencilIcon className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors relative z-10" />
                            <span className="relative z-10">Edit</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Card Content */}
            <div className={`px-6 transition-all duration-500 ${isEditing
                ? 'pb-6 pt-0'
                : 'pb-6 pt-1'
                }`}>
                <div className={`transition-all duration-500 ${isEditing ? 'opacity-100 scale-100' : 'opacity-100 scale-100'}`}>
                    {children}
                </div>
            </div>

            {/* Edit Actions */}
            {isEditing && (
                <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-6 py-4 rounded-b-2xl">
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            onClick={onCancel}
                            type="button"
                            className="order-2 sm:order-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all duration-200 active:scale-95"
                        >
                            Discard
                        </button>
                        <button
                            onClick={onSave}
                            type="button"
                            className="order-1 sm:order-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm hover:shadow transition-all duration-200 active:scale-95 group"
                        >
                            <span className="flex items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Save Changes
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsCard;
