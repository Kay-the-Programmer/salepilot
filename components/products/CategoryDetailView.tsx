import React, { useState } from 'react';
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
    storeSettings: _storeSettings,
    user,
    onEdit,
    onDelete,
    onBack
}) => {
    const canManage = user.role === 'admin' || user.role === 'inventory_manager';
    const [scrolled, setScrolled] = useState(false);

    // Track scroll for header styling
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrolled(e.currentTarget.scrollTop > 10);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900 relative overflow-hidden">
            {/* Header */}
            <div className={`flex-none px-4 py-4 md:px-6 md:py-5 transition-all duration-200 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b ${scrolled ? 'border-gray-200 dark:border-white/10 shadow-sm' : 'border-transparent'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors active:scale-95 transition-all duration-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <div className="flex-shrink-0 p-2.5 bg-blue-600 dark:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 dark:shadow-blue-500/20">
                            <TagIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate leading-tight">
                                {category.name}
                            </h1>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
                                Category Details
                            </p>
                        </div>
                    </div>

                    {/* Desktop Actions */}
                    {canManage && (
                        <div className="hidden md:flex items-center gap-2">
                            <button
                                onClick={() => onEdit(category)}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-white/20 transition-all font-medium shadow-sm active:scale-95"
                            >
                                <PencilIcon className="w-4 h-4" />
                                Edit
                            </button>
                            <button
                                onClick={() => onDelete(category)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-transparent hover:border-red-100 dark:hover:border-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-all font-medium active:scale-95"
                            >
                                <TrashIcon className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div
                className="flex-1 overflow-y-auto scroll-smooth pb-24 md:pb-6"
                onScroll={handleScroll}
            >
                <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="p-4 md:p-5 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-2xl md:rounded-3xl shadow-lg shadow-blue-500/20 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 transform translate-x-1/3 -translate-y-1/3 scale-150 group-hover:scale-125 transition-transform duration-500">
                                <TagIcon className="w-24 h-24" />
                            </div>
                            <p className="text-blue-100 text-xs md:text-sm font-medium mb-1">Attributes</p>
                            <p className="text-3xl md:text-4xl font-bold tracking-tight">{category.attributes.length}</p>
                        </div>
                        <div className="liquid-glass-card rounded-[2rem] p-4 md:p-5 dark:bg-slate-800 md: border border-gray-100 dark:border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-[0.03] dark:opacity-[0.05] transform translate-x-1/3 -translate-y-1/3 scale-150">
                                <FolderIcon className="w-24 h-24" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium mb-1">Sub-categories</p>
                            <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{subcategories.length}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Attributes Section */}
                        <section className="liquid-glass-card rounded-[2rem] dark:bg-slate-800 md: p-5 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-2 mb-4">
                                <TagIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Custom Attributes
                                </h3>
                            </div>

                            {category.attributes.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {category.attributes.map(attr => (
                                        <div
                                            key={attr.id}
                                            className="px-3 py-1.5 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200"
                                        >
                                            {attr.name}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                                    <p className="text-gray-400 dark:text-gray-500 text-sm">No custom attributes defined</p>
                                </div>
                            )}
                        </section>

                        {/* Subcategories Section */}
                        <section className="liquid-glass-card rounded-[2rem] dark:bg-slate-800 md: p-5 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-2 mb-4">
                                <FolderIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Sub-categories
                                </h3>
                            </div>

                            {subcategories.length > 0 ? (
                                <div className="space-y-2">
                                    {subcategories.map(sub => (
                                        <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-white/5 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="liquid-glass-card rounded-[2rem] p-2 dark:bg-slate-800">
                                                    <FolderIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                                </div>
                                                <span className="font-medium text-gray-700 dark:text-gray-200">{sub.name}</span>
                                            </div>
                                            <span className="px-2 py-1 bg-white dark:bg-slate-800 rounded text-xs text-gray-500 dark:text-gray-400 font-medium border border-gray-100 dark:border-white/5">
                                                {sub.attributes.length} attrs
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                                    <p className="text-gray-400 dark:text-gray-500 text-sm">No sub-categories</p>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Action Bar */}
            {canManage && (
                <div className="md:hidden absolute bottom-4 left-4 right-4 z-30">
                    <div className="liquid-glass-card rounded-[2rem] p-2 /90 dark:bg-slate-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 flex items-center gap-2">
                        <button
                            onClick={() => onEdit(category)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold active:scale-95 transition-transform"
                        >
                            <PencilIcon className="w-5 h-5" />
                            Edit
                        </button>
                        <button
                            onClick={() => onDelete(category)}
                            className="flex-none p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl active:scale-95 transition-transform"
                            aria-label="Delete Category"
                        >
                            <TrashIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryDetailView;
