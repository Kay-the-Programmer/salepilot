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
        <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
            {/* Header */}
            <div className={`flex-none px-6 py-5 md:px-8 md:py-6 transition-all duration-300 sticky top-0 z-20 bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl border-b ${scrolled ? 'border-slate-200/50 dark:border-white/10 shadow-lg shadow-black/5' : 'border-white/10 dark:border-white/5'}`}>
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
                        <div className="flex-shrink-0 p-3 bg-blue-600 dark:bg-blue-500 rounded-2xl shadow-xl shadow-blue-600/20 dark:shadow-blue-500/20">
                            <TagIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-[20px] md:text-[22px] font-black text-slate-900 dark:text-white truncate tracking-tighter leading-none mb-1">
                                {category.name}
                            </h1>
                            <div className="flex items-center gap-2 uppercase font-black tracking-[0.2em] text-[10px] text-slate-400 dark:text-slate-500">
                                <span className="text-blue-600 dark:text-blue-400">Class</span>
                                <span>Management Detail</span>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Actions */}
                    {canManage && (
                        <div className="hidden md:flex items-center gap-3">
                            <button
                                onClick={() => onEdit(category)}
                                className="px-6 py-2.5 bg-slate-900 dark:bg-white rounded-full shadow-lg shadow-black/5 dark:shadow-white/5 text-[13px] font-black tracking-wide flex items-center gap-2 text-white dark:text-slate-900 transition-all duration-300 hover:opacity-90 hover:scale-[1.02] active:scale-95"
                            >
                                <PencilIcon className="w-4 h-4" />
                                Edit
                            </button>
                            <button
                                onClick={() => onDelete(category)}
                                className="p-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full border border-red-200/50 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all duration-300 active:scale-90"
                                aria-label="Delete"
                            >
                                <TrashIcon className="w-5 h-5" />
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
                    <div className="grid grid-cols-2 gap-5 md:gap-6">
                        <div className="p-6 md:p-8 bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 p-3 opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:scale-110 group-hover:rotate-12">
                                <TagIcon className="w-24 h-24 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Total Attributes</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-[36px] font-black tracking-tighter text-slate-900 dark:text-white leading-none">{category.attributes.length}</p>
                                <span className="text-[12px] font-bold text-slate-400 dark:text-slate-600">Defined</span>
                            </div>
                        </div>
                        <div className="p-6 md:p-8 bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 p-3 opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:scale-110 group-hover:rotate-12">
                                <FolderIcon className="w-24 h-24 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Nested Children</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-[36px] font-black tracking-tighter text-slate-900 dark:text-white leading-none">{subcategories.length}</p>
                                <span className="text-[12px] font-bold text-slate-400 dark:text-slate-600">Sub-categories</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Attributes Section */}
                        <section className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/20 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-blue-500/10 dark:bg-blue-400/10 rounded-xl">
                                    <TagIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                    Custom Attributes
                                </h3>
                            </div>

                            {category.attributes.length > 0 ? (
                                <div className="flex flex-wrap gap-2.5">
                                    {category.attributes.map(attr => (
                                        <div
                                            key={attr.id}
                                            className="px-4 py-2 bg-slate-100/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/5 rounded-full text-[13px] font-bold text-slate-700 dark:text-slate-300 transition-all duration-300 cursor-default"
                                        >
                                            {attr.name}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-50/50 dark:bg-white/5 rounded-[2rem] border border-dashed border-slate-200 dark:border-white/10">
                                    <p className="text-[13px] font-bold text-slate-400 dark:text-slate-500">No custom attributes defined</p>
                                </div>
                            )}
                        </section>

                        {/* Subcategories Section */}
                        <section className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/20 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-blue-500/10 dark:bg-blue-400/10 rounded-xl">
                                    <FolderIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                    Sub-categories
                                </h3>
                            </div>

                            {subcategories.length > 0 ? (
                                <div className="space-y-3">
                                    {subcategories.map(sub => (
                                        <div key={sub.id} className="group flex items-center justify-between p-4 bg-slate-100/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/5 rounded-2xl transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 group-hover:scale-105 transition-transform">
                                                    <FolderIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <span className="text-[15px] font-bold text-slate-900 dark:text-white">{sub.name}</span>
                                            </div>
                                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 rounded-full text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest border border-blue-500/20">
                                                {sub.attributes.length} attributes
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-50/50 dark:bg-white/5 rounded-[2rem] border border-dashed border-slate-200 dark:border-white/10">
                                    <p className="text-[13px] font-bold text-slate-400 dark:text-slate-500">No sub-categories</p>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Action Bar */}
            {canManage && (
                <div className="md:hidden absolute bottom-6 left-6 right-6 z-30">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-full p-2.5 border border-white/20 dark:border-white/10 shadow-2xl flex items-center gap-3">
                        <button
                            onClick={() => onEdit(category)}
                            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-black tracking-widest uppercase text-[13px] active:scale-95 transition-all duration-300"
                        >
                            <PencilIcon className="w-5 h-5" />
                            Edit Class
                        </button>
                        <button
                            onClick={() => onDelete(category)}
                            className="flex-none p-4 bg-red-500 text-white rounded-full active:scale-95 transition-all duration-300 shadow-lg shadow-red-500/20"
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
