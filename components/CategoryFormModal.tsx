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
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div
                className="w-full bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-glass-appear sm:max-w-lg border border-slate-200/50 dark:border-white/5 relative z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* iOS-style drag handle for mobile */}
                <div className="sm:hidden pt-3 pb-1 flex justify-center">
                    <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 px-6 pt-6 pb-4 sm:px-10 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-google" id="modal-title">
                                {categoryToEdit ? 'Edit Category' : 'New Category'}
                            </h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                                {categoryToEdit ? 'Update category details' : 'Create a new product category'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 -m-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 active:bg-gray-100 dark:active:bg-gray-700 rounded-full transition-colors"
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
                            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mobile accordion navigation for sections */}
                        <div className="sm:hidden flex gap-2 p-2 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 overflow-x-auto scrollbar-hide">
                            <button
                                type="button"
                                onClick={() => setActiveSection('basic')}
                                className={`px-4 py-2 font-bold text-sm rounded-full transition-all duration-300 active:scale-95 ${activeSection === 'basic' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                Basic Info
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveSection('attributes')}
                                className={`px-4 py-2 font-bold text-sm rounded-full transition-all duration-300 active:scale-95 ${activeSection === 'attributes' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                Attributes
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveSection('accounting')}
                                className={`px-4 py-2 font-bold text-sm rounded-full transition-all duration-300 active:scale-95 ${activeSection === 'accounting' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                Accounting
                            </button>
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
                                    <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Parent Category
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="parentId"
                                            id="parentId"
                                            value={category.parentId || 'null'}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 text-base bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-blue-500 focus:border-transparent transition-all appearance-none text-gray-900 dark:text-white"
                                        >
                                            <option value="null" className="dark:bg-slate-800">None (Top-level category)</option>
                                            {availableParents.map(c => (
                                                <option key={c.id} value={c.id} className="dark:bg-slate-800">{c.name}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        Select a parent category to create a hierarchy
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Attributes Section */}
                        <div className={`${activeSection === 'attributes' ? 'block' : 'hidden sm:block'}`}>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Custom Attributes</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        Define attributes for products in this category (e.g., Size, Color, Material).
                                        These are inherited by sub-categories.
                                    </p>
                                </div>

                                {category.attributes.length > 0 ? (
                                    <div className="space-y-3">
                                        {category.attributes.map((attr, index) => (
                                            <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        placeholder="Attribute name"
                                                        value={attr.name}
                                                        onChange={e => handleAttributeChange(index, e.target.value)}
                                                        className="block w-full bg-white dark:bg-slate-700 px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-blue-500 focus:border-transparent focus:outline-none text-gray-900 dark:text-white"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttribute(index)}
                                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors active:scale-95 transition-all duration-300"
                                                    aria-label="Remove attribute"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl">
                                        <p className="text-gray-500 dark:text-gray-400">No attributes added yet</p>
                                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add attributes like Size, Color, etc.</p>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={addAttribute}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-white/10 text-base font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 transition-colors active:scale-95 transition-all duration-300"
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
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Accounting Integration</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        Map sales from this category to specific accounts. Leave empty to use defaults.
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="revenueAccountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Sales Revenue Account
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="revenueAccountId"
                                            id="revenueAccountId"
                                            value={category.revenueAccountId || ''}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 text-base bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-blue-500 focus:border-transparent transition-all appearance-none text-gray-900 dark:text-white"
                                        >
                                            <option value="" className="dark:bg-slate-800">Default Revenue Account</option>
                                            {revenueAccounts.map(a => (
                                                <option key={a.id} value={a.id} className="dark:bg-slate-800">
                                                    {a.name} ({a.number})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="cogsAccountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Cost of Goods Sold (COGS) Account
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="cogsAccountId"
                                            id="cogsAccountId"
                                            value={category.cogsAccountId || ''}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 text-base bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-blue-500 focus:border-transparent transition-all appearance-none text-gray-900 dark:text-white"
                                        >
                                            <option value="" className="dark:bg-slate-800">Default COGS Account</option>
                                            {cogsAccounts.map(a => (
                                                <option key={a.id} value={a.id} className="dark:bg-slate-800">
                                                    {a.name} ({a.number})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fixed action buttons */}
                    <div className="sticky bottom-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md px-6 py-6 sm:px-10 border-t border-slate-200 dark:border-white/10">
                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                            <div className="flex-1 sm:flex-none">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onClose}
                                    className="w-full sm:w-auto px-8 py-3 rounded-full font-bold active:scale-95 transition-all"
                                >
                                    Cancel
                                </Button>
                            </div>
                            <div className="flex-1 sm:flex-none">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full sm:w-auto px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
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