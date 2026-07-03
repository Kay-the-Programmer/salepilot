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
    /** First-run CTA: opens the create-category form from the empty state. */
    onAddCategory?: () => void;
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
    onSelectCategory,
    onAddCategory
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
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-sp-navy"></div>
                    <p className="mt-3 text-sm font-medium text-brand-text-muted">Loading categories…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-4 py-12 sm:px-6">
                <div className="text-center bg-surface border border-brand-border rounded-lg p-8 max-w-md mx-auto">
                    <div className="mx-auto flex items-center justify-center p-3 rounded-lg bg-danger/15 w-fit">
                        <svg className="h-6 w-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="mt-4 text-sm font-bold text-brand-text">Error loading categories</p>
                    <p className="mt-1 text-sm text-brand-text-muted">{error}</p>
                </div>
            </div>
        );
    }

    const displayedCategories = getFilteredCategories();

    if (displayedCategories.length === 0) {
        return (
            <div className="px-4 py-12 sm:px-6">
                <div className="text-center bg-surface p-8 rounded-2xl shadow-sm border border-brand-border">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/[0.06] dark:bg-primary/15">
                        <FolderIcon className="h-8 w-8 text-primary/60" />
                    </div>
                    <h3 className="mt-5 text-base font-bold text-brand-text tracking-tight">
                        {searchTerm ? 'No categories found' : 'No categories yet'}
                    </h3>
                    <p className="mt-1 text-sm text-brand-text-muted max-w-sm mx-auto leading-relaxed">
                        {searchTerm
                            ? `No categories match "${searchTerm}".`
                            : 'Categories group your products so they are faster to find at checkout and clearer in reports.'}
                    </p>
                    {!searchTerm && onAddCategory && (
                        <button
                            type="button"
                            onClick={onAddCategory}
                            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-primary text-white text-sm font-bold rounded-lg shadow-sm hover:bg-primary-container transition-all active:scale-95"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Create your first category
                        </button>
                    )}
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
                className={`group relative transition-colors cursor-pointer active:scale-[0.995] ${isSelected
                    ? 'bg-sp-navy-soft/40'
                    : 'hover:bg-surface-variant/50'
                    }`}
                onClick={() => onSelectCategory?.(category.id)}
            >
                {/* Mobile View: Flexible Stack */}
                <div className="sm:hidden px-3 py-2 flex items-start gap-2">
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
                                className="p-1 -ml-1 text-brand-text-muted hover:text-sp-navy rounded active:bg-sp-navy-soft"
                            >
                                {isExpanded ? (
                                    <FolderOpenIcon className="w-5 h-5 text-sp-navy" />
                                ) : (
                                    <FolderIcon className="w-5 h-5 text-brand-text-muted" />
                                )}
                            </button>
                        ) : (
                            <div className="p-1">
                                <FolderIcon className="w-5 h-5 text-brand-text-muted/60" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-2">
                            <h3 className={`text-[15px] font-semibold tracking-tight truncate transition-colors ${isSelected ? 'text-sp-navy' : 'text-brand-text group-hover:text-sp-navy'}`}>
                                {category.name}
                            </h3>
                            {/* Mobile Actions */}
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(category);
                                    }}
                                    className="p-1.5 text-brand-text-muted hover:text-sp-navy hover:bg-sp-navy-soft rounded-lg transition-colors active:scale-95"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCategoryToDelete(category);
                                    }}
                                    className="p-1.5 text-brand-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors active:scale-95"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-text-muted">
                            <span>{attributeCount} attributes</span>
                            {hasChildren && (
                                <span>{subCatCount} sub-categories</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Desktop View: Grid Layout */}
                <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-2.5 items-center">
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
                                    className="p-1 text-brand-text-muted hover:text-brand-text rounded transition-colors"
                                >
                                    {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                                </button>
                            ) : null}
                        </div>

                        {/* Icon */}
                        <div className="flex-shrink-0 mr-3">
                            <div className={`p-1.5 rounded-lg ${isExpanded ? 'bg-sp-navy-soft' : 'bg-surface-variant transition-colors'}`}>
                                {hasChildren && isExpanded ? (
                                    <FolderOpenIcon className="w-4.5 h-4.5 text-sp-navy" />
                                ) : (
                                    <FolderIcon className={`w-4.5 h-4.5 ${hasChildren ? 'text-sp-navy' : 'text-brand-text-muted'}`} />
                                )}
                            </div>
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0 flex flex-col">
                            <span className={`text-[15px] font-semibold tracking-tight truncate transition-colors ${isSelected ? 'text-sp-navy' : 'text-brand-text group-hover:text-sp-navy'}`}>
                                {category.name}
                            </span>
                            {category.level > 0 && (
                                <span className="text-[10px] font-bold tracking-widest text-brand-text-muted uppercase mt-0.5">Sub-category</span>
                            )}
                        </div>
                    </div>

                    {/* Column 2: Attributes (spans 3) */}
                    <div className="col-span-3">
                        {attributeCount > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-surface-variant text-[11px] font-bold tracking-wider text-brand-text-muted uppercase">
                                {attributeCount} {attributeCount === 1 ? 'attr' : 'attrs'}
                            </span>
                        ) : (
                            <span className="text-xs text-brand-text-muted/40 ml-4">—</span>
                        )}
                    </div>

                    {/* Column 3: Sub-categories (spans 2) */}
                    <div className="col-span-2">
                        {hasChildren ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-sp-navy-soft text-[11px] font-bold tracking-wider text-sp-navy uppercase">
                                {subCatCount} items
                            </span>
                        ) : (
                            <span className="text-xs text-brand-text-muted/40 ml-4">—</span>
                        )}
                    </div>

                    {/* Column 4: Actions (spans 1) */}
                    <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(category);
                            }}
                            className="p-1.5 text-brand-text-muted hover:text-sp-navy hover:bg-sp-navy-soft rounded-lg transition-colors active:scale-95"
                            title="Edit"
                        >
                            <PencilIcon className="w-4.5 h-4.5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setCategoryToDelete(category);
                            }}
                            className="p-1.5 text-brand-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors active:scale-95"
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
        <div className="p-2 md:p-4">
            {/* Header stats — flat tonal tiles, one glance each */}
            <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="bg-surface border border-brand-border rounded-lg p-4">
                    <p className="text-[10px] font-black text-brand-text-muted tracking-[0.15em] uppercase mb-1.5">Categories</p>
                    <p className="text-2xl font-bold tracking-tight text-brand-text tnum">{categories.length}</p>
                </div>
                <div className="bg-surface border border-brand-border rounded-lg p-4">
                    <p className="text-[10px] font-black text-brand-text-muted tracking-[0.15em] uppercase mb-1.5">Top-level</p>
                    <p className="text-2xl font-bold tracking-tight text-brand-text tnum">
                        {categories.filter(c => !c.parentId).length}
                    </p>
                </div>
                <div className="bg-surface border border-brand-border rounded-lg p-4">
                    <p className="text-[10px] font-black text-brand-text-muted tracking-[0.15em] uppercase mb-1.5">With attributes</p>
                    <p className="text-2xl font-bold tracking-tight text-brand-text tnum">
                        {categories.filter(c => c.attributes.length > 0).length}
                    </p>
                </div>
            </div>

            {/* Category list container */}
            <div className="bg-surface border border-brand-border rounded-lg overflow-hidden">
                {/* Desktop header */}
                <div className="hidden sm:grid grid-cols-12 gap-3 bg-surface-variant px-6 py-3 text-[10px] font-black text-brand-text-muted uppercase tracking-[0.2em]">
                    <div className="col-span-6">Category Name</div>
                    <div className="col-span-3">Attributes</div>
                    <div className="col-span-2">Sub-categories</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                {/* List items */}
                <div className="divide-y divide-brand-border">
                    {displayedCategories.map(category => renderCategoryRow(category))}
                </div>

                {/* Footer usage */}
                <div className="bg-surface-variant/60 px-6 py-2.5 border-t border-brand-border text-[11px] font-bold tracking-wider text-brand-text-muted uppercase flex justify-between">
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