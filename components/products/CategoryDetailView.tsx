import React from 'react';
import { Category, User, StoreSettings } from '../../types';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import TagIcon from '../icons/TagIcon';
import FolderIcon from '../icons/FolderIcon';

interface CategoryDetailViewProps {
    category: Category;
    subcategories: Category[];
    storeSettings: StoreSettings;
    user: User;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
    onBack?: () => void;
}

const CategoryDetailView: React.FC<CategoryDetailViewProps> = ({
    category,
    subcategories,
    storeSettings,
    user,
    onEdit,
    onDelete,
    onBack
}) => {
    const canManage = user.role === 'admin' || user.role === 'inventory_manager';

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="flex-none p-6 border-b border-gray-100 dark:border-white/10 bg-white dark:bg-slate-900 sticky top-0 z-10">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                            <TagIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{category.name}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Category Details</p>
                        </div>
                    </div>

                    {canManage && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onEdit(category)}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium shadow-sm"
                            >
                                <PencilIcon className="w-4 h-4" />
                                Edit
                            </button>
                            <button
                                onClick={() => onDelete(category)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
                            >
                                <TrashIcon className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/10">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Attributes</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{category.attributes.length}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/10">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Sub-categories</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{subcategories.length}</p>
                    </div>
                </div>

                {/* Attributes Section */}
                <section>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <TagIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        Custom Attributes
                    </h3>
                    {category.attributes.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {category.attributes.map(attr => (
                                <div key={attr.id} className="p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-xl shadow-sm">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{attr.name}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                            <p className="text-gray-500 dark:text-gray-400 text-sm italic">No custom attributes defined</p>
                        </div>
                    )}
                </section>

                {/* Subcategories Section */}
                <section>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FolderIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        Sub-categories
                    </h3>
                    {subcategories.length > 0 ? (
                        <div className="space-y-2">
                            {subcategories.map(sub => (
                                <div key={sub.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-xl hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors group cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-gray-50 dark:bg-slate-700 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                            <FolderIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                                        </div>
                                        <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">{sub.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-700 px-2 py-1 rounded-md">
                                        {sub.attributes.length} attributes
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                            <p className="text-gray-500 dark:text-gray-400 text-sm italic">No sub-categories</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default CategoryDetailView;
