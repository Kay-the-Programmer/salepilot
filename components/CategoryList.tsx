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

const CategoryList: React.FC<CategoryListProps> = ({
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
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-3 text-lg font-medium text-gray-700">Loading categories...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-4 py-12 sm:px-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="mt-3 text-lg font-medium text-gray-900">Error loading categories</p>
                    <p className="mt-1 text-sm text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    const displayedCategories = getFilteredCategories();

    if (displayedCategories.length === 0) {
        return (
            <div className="px-4 py-12 sm:px-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                        <FolderIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="mt-3 text-lg font-medium text-gray-900">No categories found</p>
                    <p className="mt-1 text-sm text-gray-500">
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
                className={`group border-b border-gray-100 last:border-0 transition-colors ${isSelected ? 'bg-blue-50/50' : 'bg-white hover:bg-gray-50'
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
                                className="p-1 -ml-1 text-gray-400 hover:text-blue-600 rounded active:bg-blue-100"
                            >
                                {isExpanded ? (
                                    <FolderOpenIcon className={`w-5 h-5 ${isExpanded ? 'text-blue-600' : ''}`} />
                                ) : (
                                    <FolderIcon className="w-5 h-5 text-gray-500" />
                                )}
                            </button>
                        ) : (
                            <div className="p-1">
                                <FolderIcon className="w-5 h-5 text-gray-400" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className={`text-base font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                {category.name}
                            </h3>
                            {/* Mobile Actions */}
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(category);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCategoryToDelete(category);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
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
                                    className="p-1 text-gray-400 hover:text-gray-800 rounded transition-colors"
                                >
                                    {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                                </button>
                            ) : null}
                        </div>

                        {/* Icon */}
                        <div className="flex-shrink-0 mr-3">
                            <div className={`p-1.5 rounded-md ${isExpanded ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-white border border-transparent group-hover:border-gray-200'}`}>
                                {hasChildren && isExpanded ? (
                                    <FolderOpenIcon className="w-4 h-4 text-blue-600" />
                                ) : (
                                    <FolderIcon className={`w-4 h-4 ${hasChildren ? 'text-blue-600' : 'text-gray-500'}`} />
                                )}
                            </div>
                        </div>

                        {/* Name */}
                        <span className={`font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                            {category.name}
                        </span>
                    </div>

                    {/* Column 2: Attributes (spans 3) */}
                    <div className="col-span-3">
                        {attributeCount > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-50 text-xs font-medium text-gray-600">
                                {attributeCount} {attributeCount === 1 ? 'attribute' : 'attributes'}
                            </span>
                        ) : (
                            <span className="text-xs text-gray-400">-</span>
                        )}
                    </div>

                    {/* Column 3: Sub-categories (spans 2) */}
                    <div className="col-span-2">
                        {hasChildren ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-xs font-medium text-blue-700">
                                {subCatCount} items
                            </span>
                        ) : (
                            <span className="text-xs text-gray-400">-</span>
                        )}
                    </div>

                    {/* Column 4: Actions (spans 1) */}
                    <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(category);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setCategoryToDelete(category);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8">
            {/* Header stats */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <FolderIcon className="w-16 h-16 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Total Categories</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{categories.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Top-Level</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        {categories.filter(c => !c.parentId).length}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">With Attributes</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        {categories.filter(c => c.attributes.length > 0).length}
                    </p>
                </div>
            </div>

            {/* Category list container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Desktop header */}
                <div className="hidden sm:grid grid-cols-12 gap-4 bg-gray-50/80 px-6 py-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider backdrop-blur-sm">
                    <div className="col-span-6">Category Name</div>
                    <div className="col-span-3">Attributes</div>
                    <div className="col-span-2">Sub-categories</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                {/* List items */}
                <div className="divide-y divide-gray-100">
                    {displayedCategories.map(category => renderCategoryRow(category))}
                </div>

                {/* Empty State / Footer usage */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
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
};

export default CategoryList;