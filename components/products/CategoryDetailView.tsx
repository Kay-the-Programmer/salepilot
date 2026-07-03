import React from 'react';
import { Category, User, StoreSettings } from '../../types';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
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

/** Small labelled stat tile — same tonal-layer language as the product detail. */
const StatTile: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="bg-surface border border-brand-border rounded-lg p-4">
        <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-brand-text-muted mb-1.5">{label}</span>
        {children}
    </div>
);

/**
 * Category detail — full-screen, minimal Velocity layout: a flat header with
 * back + actions, stat tiles, then the attribute chips and sub-category rows.
 */
const CategoryDetailView: React.FC<CategoryDetailViewProps> = ({
    category,
    subcategories,
    storeSettings: _storeSettings,
    user,
    onEdit,
    onDelete,
    onBack
}) => {
    // Superadmin counts as a manager — in Store Mode they act as the store's admin.
    const canManage = user.role === 'admin' || user.role === 'inventory_manager' || user.role === 'superadmin';

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            {/* ── Header: back, identity, actions ── */}
            <header className="flex-none px-4 sm:px-6 h-16 bg-surface border-b border-brand-border flex items-center gap-3 sticky top-0 z-20">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="shrink-0 w-9 h-9 -ml-1 flex items-center justify-center rounded-full text-brand-text-muted hover:bg-surface-variant active:scale-90 transition-colors"
                        aria-label="Back to category list"
                        title="Back to category list"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                )}
                <div className="w-9 h-9 rounded-lg bg-sp-navy-soft flex items-center justify-center flex-shrink-0">
                    <TagIcon className="w-5 h-5 text-sp-navy" />
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-base md:text-lg font-bold text-brand-text truncate leading-tight">{category.name}</h1>
                    <p className="text-[11px] text-brand-text-muted truncate">Category</p>
                </div>

                {canManage && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => onEdit(category)}
                            className="bg-sp-navy hover:bg-sp-navy-light text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors active:scale-95"
                        >
                            <PencilIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                            onClick={() => onDelete(category)}
                            className="w-10 h-10 grid place-items-center rounded-lg border border-brand-border text-brand-text-muted hover:border-danger hover:text-danger transition-colors active:scale-95"
                            aria-label="Delete category"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </header>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <StatTile label="Attributes">
                            <p className="text-2xl font-bold text-brand-text tracking-tight tnum">{category.attributes.length}</p>
                        </StatTile>
                        <StatTile label="Sub-categories">
                            <p className="text-2xl font-bold text-brand-text tracking-tight tnum">{subcategories.length}</p>
                        </StatTile>
                    </div>

                    {/* Attributes */}
                    <section className="bg-surface border border-brand-border rounded-lg p-5">
                        <h2 className="text-sm font-bold text-brand-text flex items-center gap-2 mb-4">
                            <span className="w-1.5 h-1.5 bg-sp-navy rounded-full" />
                            Custom Attributes
                        </h2>
                        {category.attributes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {category.attributes.map(attr => (
                                    <span
                                        key={attr.id}
                                        className="px-3 py-1.5 bg-surface-variant border border-brand-border rounded-full text-[13px] font-medium text-brand-text"
                                    >
                                        {attr.name}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-brand-text-muted py-4 text-center border border-dashed border-brand-border rounded-lg">
                                No custom attributes defined
                            </p>
                        )}
                    </section>

                    {/* Sub-categories */}
                    <section className="bg-surface border border-brand-border rounded-lg p-5">
                        <h2 className="text-sm font-bold text-brand-text flex items-center gap-2 mb-4">
                            <span className="w-1.5 h-1.5 bg-sp-orange rounded-full" />
                            Sub-categories
                        </h2>
                        {subcategories.length > 0 ? (
                            <div className="divide-y divide-brand-border border border-brand-border rounded-lg overflow-hidden">
                                {subcategories.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-3 px-4 py-3 bg-surface hover:bg-surface-variant/50 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center flex-shrink-0">
                                            <FolderIcon className="w-4 h-4 text-sp-navy" />
                                        </div>
                                        <span className="text-sm font-semibold text-brand-text truncate flex-1">{sub.name}</span>
                                        <span className="text-xs text-brand-text-muted tnum flex-shrink-0">
                                            {sub.attributes.length} attribute{sub.attributes.length === 1 ? '' : 's'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-brand-text-muted py-4 text-center border border-dashed border-brand-border rounded-lg">
                                No sub-categories
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default CategoryDetailView;
