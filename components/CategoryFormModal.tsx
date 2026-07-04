import React, { useState, useEffect, useMemo } from 'react';
import { Category, CustomAttribute, Account } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { InputField } from './ui/InputField';
import { Button } from './ui/Button';

interface CategoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: Category) => void;
    categoryToEdit?: Category | null;
    allCategories: Category[];
    accounts: Account[];
}

const getInitialState = (): Omit<Category, 'id'> => ({
    name: '',
    parentId: null,
    attributes: [],
    revenueAccountId: undefined,
    cogsAccountId: undefined,
});

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ isOpen, onClose, onSave, categoryToEdit, allCategories, accounts }) => {
    const [category, setCategory] = useState(getInitialState());
    const [error, setError] = useState('');
    const [activeSection, setActiveSection] = useState<string>('basic'); // For accordion on mobile

    useEffect(() => {
        if (isOpen) {
            setError('');
            setActiveSection('basic');
            if (categoryToEdit) {
                setCategory({ ...getInitialState(), ...categoryToEdit });
            } else {
                setCategory(getInitialState());
            }
        }
    }, [categoryToEdit, isOpen]);

    const revenueAccounts = useMemo(() => accounts.filter(a => a.type === 'revenue').sort((a, b) => a.number.localeCompare(b.number)), [accounts]);
    const cogsAccounts = useMemo(() => accounts.filter(a => a.type === 'expense').sort((a, b) => a.number.localeCompare(b.number)), [accounts]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCategory(prev => ({
            ...prev,
            [name]: value === 'null' ? null : value === '' ? undefined : value,
        }));
    };

    const handleAttributeChange = (index: number, value: string) => {
        const newAttributes = [...category.attributes];
        newAttributes[index] = { ...newAttributes[index], name: value };
        setCategory(prev => ({ ...prev, attributes: newAttributes }));
    };

    const addAttribute = () => {
        const newAttribute: CustomAttribute = { id: `attr_${new Date().getTime()}`, name: '' };
        setCategory(prev => ({ ...prev, attributes: [...prev.attributes, newAttribute] }));
        setActiveSection('attributes');
    };

    const removeAttribute = (index: number) => {
        const newAttributes = category.attributes.filter((_, i) => i !== index);
        setCategory(prev => ({ ...prev, attributes: newAttributes }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!category.name.trim()) {
            setError('Category name is required');
            return;
        }

        const finalCategory: Category = {
            ...category,
            id: categoryToEdit?.id || `cat_${new Date().toISOString()}`,
        };
        onSave(finalCategory);
    };

    const availableParents = allCategories.filter(c => c.id !== categoryToEdit?.id);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            {/* Overlay — 20% scrim + light blur to focus the task (DESIGN.md) */}
            <div className="absolute inset-0 bg-warm-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
            <div
                className="w-full bg-surface border border-brand-border rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 sm:max-w-lg relative z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle for mobile bottom-sheet */}
                <div className="sm:hidden pt-3 pb-1 flex justify-center">
                    <div className="w-12 h-1.5 bg-brand-border rounded-full"></div>
                </div>

                {/* Header — flat tonal, 1px divider */}
                <div className="sticky top-0 bg-surface border-b border-brand-border px-6 pt-6 pb-4 sm:px-8 z-10">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="text-2xl font-bold tracking-tight text-brand-text" id="modal-title">
                                {categoryToEdit ? 'Edit Category' : 'New Category'}
                            </h3>
                            <p className="text-sm text-brand-text-muted mt-1">
                                {categoryToEdit ? 'Update category details' : 'Create a new product category'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="shrink-0 p-2 text-brand-text-muted hover:text-brand-text hover:bg-surface-variant rounded-lg transition-all active:scale-95"
                            aria-label="Close"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Form content - scrollable */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="px-4 py-4 sm:px-6 space-y-6">
                        {error && (
                            <div className="bg-danger-muted border border-danger/30 p-3.5 rounded-lg flex items-center gap-3">
                                <svg className="h-5 w-5 shrink-0 text-danger" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm text-danger font-semibold">{error}</p>
                            </div>
                        )}

                        {/* Mobile section tabs */}
                        <div className="sm:hidden flex gap-2 overflow-x-auto scrollbar-hide">
                            {([['basic', 'Basic Info'], ['attributes', 'Attributes'], ['accounting', 'Accounting']] as const).map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setActiveSection(key)}
                                    className={`shrink-0 px-4 py-2 font-semibold text-sm rounded-lg transition-all active:scale-95 ${activeSection === key ? 'bg-primary text-white' : 'bg-surface-variant text-brand-text-muted'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Basic Information Section */}
                        <div className={`${activeSection === 'basic' ? 'block' : 'hidden sm:block'}`}>
                            <div className="space-y-5">
                                <InputField
                                    label="Category Name"
                                    name="name"
                                    id="name"
                                    value={category.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Electronics, Clothing"
                                />

                                <div>
                                    <label htmlFor="parentId" className="block text-sm font-medium text-brand-text-muted mb-2">
                                        Parent Category
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="parentId"
                                            id="parentId"
                                            value={category.parentId || 'null'}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 text-base bg-surface-variant border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-transparent transition-all appearance-none text-brand-text"
                                        >
                                            <option value="null" className="bg-surface text-brand-text">None (Top-level category)</option>
                                            {availableParents.map(c => (
                                                <option key={c.id} value={c.id} className="bg-surface text-brand-text">{c.name}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                            <ChevronDownIcon className="h-5 w-5 text-brand-text-muted" />
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs text-brand-text-muted">
                                        Select a parent category to create a hierarchy
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Attributes Section */}
                        <div className={`${activeSection === 'attributes' ? 'block' : 'hidden sm:block'}`}>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-lg font-bold text-brand-text mb-1">Custom Attributes</h4>
                                    <p className="text-sm text-brand-text-muted mb-4">
                                        Define attributes for products in this category (e.g., Size, Color, Material).
                                        These are inherited by sub-categories.
                                    </p>
                                </div>

                                {category.attributes.length > 0 ? (
                                    <div className="space-y-3">
                                        {category.attributes.map((attr, index) => (
                                            <div key={index} className="flex items-center gap-2 p-3 bg-surface-variant rounded-xl">
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        placeholder="Attribute name"
                                                        value={attr.name}
                                                        onChange={e => handleAttributeChange(index, e.target.value)}
                                                        className="block w-full bg-surface px-3 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-primary/25 focus:border-transparent focus:outline-none text-brand-text"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttribute(index)}
                                                    className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-all active:scale-95"
                                                    aria-label="Remove attribute"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 border-2 border-dashed border-brand-border rounded-xl">
                                        <p className="text-brand-text-muted">No attributes added yet</p>
                                        <p className="text-sm text-brand-text-muted mt-1">Add attributes like Size, Color, etc.</p>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={addAttribute}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-brand-border text-base font-medium rounded-xl text-brand-text bg-surface-variant hover:border-primary/40 hover:text-primary transition-all active:scale-95"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    Add Attribute
                                </button>
                            </div>
                        </div>

                        {/* Accounting Section */}
                        <div className={`${activeSection === 'accounting' ? 'block' : 'hidden sm:block'}`}>
                            <div className="space-y-5">
                                <div>
                                    <h4 className="text-lg font-bold text-brand-text mb-1">Accounting Integration</h4>
                                    <p className="text-sm text-brand-text-muted mb-4">
                                        Map sales from this category to specific accounts. Leave empty to use defaults.
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="revenueAccountId" className="block text-sm font-medium text-brand-text-muted mb-2">
                                        Sales Revenue Account
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="revenueAccountId"
                                            id="revenueAccountId"
                                            value={category.revenueAccountId || ''}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 text-base bg-surface-variant border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-transparent transition-all appearance-none text-brand-text"
                                        >
                                            <option value="" className="bg-surface text-brand-text">Default Revenue Account</option>
                                            {revenueAccounts.map(a => (
                                                <option key={a.id} value={a.id} className="bg-surface text-brand-text">
                                                    {a.name} ({a.number})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                            <ChevronDownIcon className="h-5 w-5 text-brand-text-muted" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="cogsAccountId" className="block text-sm font-medium text-brand-text-muted mb-2">
                                        Cost of Goods Sold (COGS) Account
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="cogsAccountId"
                                            id="cogsAccountId"
                                            value={category.cogsAccountId || ''}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 text-base bg-surface-variant border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-transparent transition-all appearance-none text-brand-text"
                                        >
                                            <option value="" className="bg-surface text-brand-text">Default COGS Account</option>
                                            {cogsAccounts.map(a => (
                                                <option key={a.id} value={a.id} className="bg-surface text-brand-text">
                                                    {a.name} ({a.number})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                            <ChevronDownIcon className="h-5 w-5 text-brand-text-muted" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fixed action bar — flat tonal, 1px divider */}
                    <div className="sticky bottom-0 bg-surface px-6 py-5 sm:px-8 border-t border-brand-border">
                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                            <div className="flex-1 sm:flex-none">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onClose}
                                    className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold active:scale-95 transition-all"
                                >
                                    Cancel
                                </Button>
                            </div>
                            <div className="flex-1 sm:flex-none">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold active:scale-95 transition-all"
                                >
                                    {categoryToEdit ? 'Save Changes' : 'Create Category'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryFormModal;