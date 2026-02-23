import React, { useState } from 'react';
import { Category } from '../types';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import FolderIcon from './icons/FolderIcon';
import FolderOpenIcon from './icons/FolderOpenIcon';
import ConfirmationModal from './ConfirmationModal';

interface CategoryListProps {
    categories: Category[];
    searchTerm: string;
    onEdit: (category: Category) => void;
    onDelete: (categoryId: string) => void;
    isLoading: boolean;
    error: string | null;
    selectedCategoryId?: string | null;
    onSelectCategory?: (categoryId: string) => void;
}

interface CategoryWithLevel extends Category {
    level: number;
}

const CategoryList: React.FC<CategoryListProps> = React.memo(({
    categories,
    searchTerm,
    onEdit,
    onDelete,
    isLoading,
    error,
    selectedCategoryId,
    onSelectCategory
}) => {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    const toggleExpand = (categoryId: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const getCategoryTree = (parentId: string | null, level: number = 0): CategoryWithLevel[] => {
        const children = categories.filter(c => c.parentId === parentId);
        let result: CategoryWithLevel[] = [];

        children.forEach(category => {
            result.push({ ...category, level });
            if (expandedCategories.has(category.id)) {
                result = result.concat(getCategoryTree(category.id, level + 1));
            }
        });

        return result;
    };

    const getFilteredCategories = (): CategoryWithLevel[] => {
        if (!searchTerm) {
            return getCategoryTree(null);
        }

        const searchLower = searchTerm.toLowerCase();
        const filtered = categories.filter(c =>
            c.name.toLowerCase().includes(searchLower)
        );

        // Include all ancestors of filtered categories
        const allIds = new Set<string>();
        filtered.forEach(category => {
            allIds.add(category.id);
            let current = category;
            while (current.parentId) {
                const parent = categories.find(c => c.id === current.parentId);
                if (parent) {
                    allIds.add(parent.id);
                    current = parent;
                } else {
                    break;
                }
            }
        });

        // For search results, we typically want a flat list or at least context.
        // Similar to the original implementation, we return filtered items. 
        // Note: flattening level to 0 removes hierarchy context visually in search, which might be easier to read.
        return categories
            .filter(c => allIds.has(c.id))
            .map(c => ({ ...c, level: 0 }));
    };

    const getSubCategoryCount = (categoryId: string): number => {
        return categories.filter(c => c.parentId === categoryId).length;
    };

    const getAttributeCount = (category: Category): number => {
        return category.attributes.length;
    };

    if (isLoading) {
        return (
            <div className="px-4 py-12 sm:px-6">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
                    <p className="mt-3 text-[15px] font-bold tracking-wide text-slate-700 dark:text-slate-300">Loading categories...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-4 py-12 sm:px-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center p-3 rounded-[16px] bg-rose-100 dark:bg-rose-900/20 w-fit">
                        <svg className="h-6 w-6 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="mt-4 text-[15px] font-bold text-slate-900 dark:text-slate-100 tracking-wide">Error loading categories</p>
                    <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">{error}</p>
                </div>
            </div>
        );
    }

    const displayedCategories = getFilteredCategories();

    if (displayedCategories.length === 0) {
        return (
            <div className="px-4 py-12 sm:px-6">
                <div className="text-center bg-white dark:bg-slate-900/60 p-8 rounded-[24px] shadow-sm border border-slate-200/50 dark:border-white/5">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-[20px] bg-slate-50 dark:bg-slate-800 rotate-3 transition-transform hover:rotate-6">
                        <FolderIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="mt-5 text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">No categories found</h3>
                    <p className="mt-2 text-[14px] font-medium text-slate-500 dark:text-slate-400">
                        {searchTerm
                            ? `No categories match "${searchTerm}"`
                            : "Get started by creating your first category"}
                    </p>
                </div>
            </div>
        );
    }

    const renderCategoryRow = (category: CategoryWithLevel) => {
        const hasChildren = getSubCategoryCount(category.id) > 0;
        const isExpanded = expandedCategories.has(category.id);
        const isSelected = selectedCategoryId === category.id;
        const attributeCount = getAttributeCount(category);
        const subCatCount = getSubCategoryCount(category.id);

        return (
            <div
                key={category.id}
                className={`group border-b border-slate-100 dark:border-white/5 last:border-0 transition-all duration-300 ease-out cursor-pointer active:scale-[0.99] ${isSelected ? 'bg-blue-600/5 dark:bg-blue-500/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                    }`}
                onClick={() => onSelectCategory?.(category.id)}
            >
                {/* Mobile View: Flexible Stack */}
                <div className="sm:hidden px-4 py-3 flex items-start gap-3">
                    {/* Indentation Spacer for Mobile Tree */}
                    {category.level > 0 && (
                        <div
                            className="flex-shrink-0"
                            style={{ width: `${(category.level * 16)}px` }}
                        />
                    )}

                    {/* Icon & Toggle */}
                    <div className="flex-shrink-0 mt-0.5">
                        {hasChildren ? (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(category.id);
                                }}
                                className="p-1 -ml-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded active:bg-blue-100 dark:active:bg-blue-900/20"
                            >
                                {isExpanded ? (
                                    <FolderOpenIcon className={`w-5 h-5 ${isExpanded ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                ) : (
                                    <FolderIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                )}
                            </button>
                        ) : (
                            <div className="p-1">
                                <FolderIcon className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className={`text-[15px] font-bold tracking-tight truncate ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-slate-900 dark:text-white'}`}>
                                {category.name}
                            </h3>
                            {/* Mobile Actions */}
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(category);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-[12px] transition-all duration-300 active:scale-95"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCategoryToDelete(category);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-[12px] transition-all duration-300 active:scale-95"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                            <span>{attributeCount} attributes</span>
                            {hasChildren && (
                                <span>{subCatCount} sub-categories</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Desktop View: Grid Layout */}
                <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 items-center">
                    {/* Column 1: Name (spans 6) */}
                    <div className="col-span-6 flex items-center min-w-0">
                        {/* Tree Guide Lines/Indentation */}
                        <div className="flex-shrink-0 flex" style={{ width: `${category.level * 2}rem` }}>
                            {/* Optional: Add vertical guide lines here if desired, otherwise simple space */}
                        </div>

                        {/* Expand Toggle or Spacer */}
                        <div className="flex-shrink-0 w-8 flex justify-center mr-2">
                            {hasChildren ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(category.id);
                                    }}
                                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 rounded transition-colors"
                                >
                                    {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                                </button>
                            ) : null}
                        </div>

                        {/* Icon */}
                        <div className="flex-shrink-0 mr-3">
                            <div className={`p-1.5 rounded-[12px] ${isExpanded ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 border border-transparent group-hover:border-slate-200 dark:group-hover:border-white/10 transition-colors'}`}>
                                {hasChildren && isExpanded ? (
                                    <FolderOpenIcon className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                                ) : (
                                    <FolderIcon className={`w-4.5 h-4.5 ${hasChildren ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
                                )}
                            </div>
                        </div>

                        {/* Name */}
                        <span className={`text-[15px] font-bold tracking-tight truncate ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                            {category.name}
                        </span>
                    </div>

                    {/* Column 2: Attributes (spans 3) */}
                    <div className="col-span-3">
                        {attributeCount > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] bg-slate-50 dark:bg-slate-800/80 text-[12px] font-bold tracking-wide text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 shadow-sm">
                                {attributeCount} {attributeCount === 1 ? 'attribute' : 'attributes'}
                            </span>
                        ) : (
                            <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">-</span>
                        )}
                    </div>

                    {/* Column 3: Sub-categories (spans 2) */}
                    <div className="col-span-2">
                        {hasChildren ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] bg-blue-50 dark:bg-blue-900/20 shadow-sm border border-blue-100 dark:border-blue-500/20 text-[12px] font-bold tracking-wide text-blue-700 dark:text-blue-300">
                                {subCatCount} items
                            </span>
                        ) : (
                            <span className="text-[13px] font-medium text-slate-400 dark:text-slate-500">-</span>
                        )}
                    </div>

                    {/* Column 4: Actions (spans 1) */}
                    <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(category);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-[10px] transition-colors active:scale-95 transition-all duration-300"
                            title="Edit"
                        >
                            <PencilIcon className="w-4.5 h-4.5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setCategoryToDelete(category);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-[10px] transition-colors active:scale-95 transition-all duration-300"
                            title="Delete"
                        >
                            <TrashIcon className="w-4.5 h-4.5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8">
            {/* Header stats */}
            <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-3xl rounded-[24px] shadow-sm border border-slate-200/50 dark:border-white/5 p-6 transition-all duration-300 hover:shadow-md relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <FolderIcon className="w-24 h-24 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-1">Total Categories</p>
                    <p className="text-[32px] font-bold tracking-tight text-slate-900 dark:text-white leading-none">{categories.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-3xl rounded-[24px] shadow-sm border border-slate-200/50 dark:border-white/5 p-6 transition-all duration-300 hover:shadow-md group">
                    <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-1">Top-Level</p>
                    <p className="text-[32px] font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                        {categories.filter(c => !c.parentId).length}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-3xl rounded-[24px] shadow-sm border border-slate-200/50 dark:border-white/5 p-6 transition-all duration-300 hover:shadow-md group">
                    <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-1">With Attributes</p>
                    <p className="text-[32px] font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                        {categories.filter(c => c.attributes.length > 0).length}
                    </p>
                </div>
            </div>

            {/* Category list container */}
            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-3xl rounded-[24px] shadow-sm border border-slate-200/50 dark:border-white/5 overflow-hidden animate-glass-appear stagger-2">
                {/* Desktop header */}
                <div className="hidden sm:grid grid-cols-12 gap-4 bg-slate-50/50 dark:bg-slate-800/20 px-8 py-4 border-b border-slate-100 dark:border-white/5 text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest backdrop-blur-xl">
                    <div className="col-span-6">Category Name</div>
                    <div className="col-span-3">Attributes</div>
                    <div className="col-span-2">Sub-categories</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                {/* List items */}
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {displayedCategories.map(category => renderCategoryRow(category))}
                </div>

                {/* Empty State / Footer usage */}
                <div className="bg-slate-50/50 dark:bg-slate-800/20 px-6 py-4 border-t border-slate-100 dark:border-white/5 text-[13px] font-bold tracking-wide text-slate-500 dark:text-slate-400 flex justify-between">
                    <span>{displayedCategories.length} categories shown</span>
                </div>
            </div>


            <ConfirmationModal
                isOpen={!!categoryToDelete}
                onClose={() => setCategoryToDelete(null)}
                onConfirm={() => {
                    if (categoryToDelete) {
                        onDelete(categoryToDelete.id);
                        setCategoryToDelete(null);
                    }
                }}
                title="Delete Category"
                message={
                    categoryToDelete && (
                        <span>
                            Are you sure you want to delete <span className="font-semibold text-gray-900">{categoryToDelete.name}</span>?
                            {getSubCategoryCount(categoryToDelete.id) > 0 && (
                                <span className="block mt-2 p-2 bg-red-50 text-red-700 rounded text-sm border border-red-100">
                                    <span className="font-bold">Warning:</span> This category has {getSubCategoryCount(categoryToDelete.id)} sub-categories that will also be affected.
                                </span>
                            )}
                            <span className="block mt-2 text-sm text-gray-500">This action cannot be undone.</span>
                        </span>
                    )
                }
                confirmText="Delete Category"
                confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            />
        </div>
    );
});

export default CategoryList;