
import React, { useState, useEffect, useMemo } from 'react';
import { Category, CustomAttribute, Account } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

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

    useEffect(() => {
        if (isOpen) {
            setError('');
            if (categoryToEdit) {
                setCategory({ ...getInitialState(), ...categoryToEdit });
            } else {
                setCategory(getInitialState());
            }
        }
    }, [categoryToEdit, isOpen]);
    
    const revenueAccounts = useMemo(() => accounts.filter(a => a.type === 'revenue').sort((a,b) => a.number.localeCompare(b.number)), [accounts]);
    const cogsAccounts = useMemo(() => accounts.filter(a => a.type === 'expense').sort((a,b) => a.number.localeCompare(b.number)), [accounts]);


    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        setCategory(prev => ({ ...prev, attributes: [...prev.attributes, newAttribute]}));
    };

    const removeAttribute = (index: number) => {
        const newAttributes = category.attributes.filter((_, i) => i !== index);
        setCategory(prev => ({ ...prev, attributes: newAttributes }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!category.name.trim()) {
            setError('Category name is required.');
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 transition-opacity" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-lg w-full m-4">
                <form onSubmit={handleSubmit}>
                    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b">
                         <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            {categoryToEdit ? 'Edit Category' : 'Add New Category'}
                        </h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        {error && <div className="rounded-md bg-red-50 p-4 mb-4"><p className="text-sm text-red-700">{error}</p></div>}
                        
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Category Name *</label>
                            <input type="text" name="name" id="name" value={category.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                        </div>

                         <div>
                            <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">Parent Category</label>
                            <select name="parentId" id="parentId" value={category.parentId || 'null'} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                <option value="null">None (Top-level)</option>
                                {availableParents.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <h4 className="text-md font-semibold text-gray-800 mt-6 mb-2 border-b pb-1">Custom Attributes</h4>
                            <p className="text-xs text-gray-500 mb-3">Define attributes for products in this category (e.g., Size, Color). Attributes are inherited by sub-categories.</p>
                            <div className="space-y-2">
                                {category.attributes.map((attr, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input 
                                            type="text"
                                            placeholder="Attribute Name"
                                            value={attr.name}
                                            onChange={e => handleAttributeChange(index, e.target.value)}
                                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                        <button type="button" onClick={() => removeAttribute(index)} className="text-red-500 hover:text-red-700 p-1">
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                             <button type="button" onClick={addAttribute} className="mt-3 inline-flex items-center px-3 py-1.5 border border-dashed border-gray-400 text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100">
                                <PlusIcon className="w-4 h-4 mr-1.5"/> Add Attribute
                            </button>
                        </div>

                        <div>
                            <h4 className="text-md font-semibold text-gray-800 mt-6 mb-2 border-b pb-1">Accounting Integration</h4>
                            <p className="text-xs text-gray-500 mb-3">Map sales from this category to specific accounts. If not set, defaults will be used.</p>
                            <div>
                                <label htmlFor="revenueAccountId" className="block text-sm font-medium text-gray-700">Sales Revenue Account</label>
                                <select name="revenueAccountId" id="revenueAccountId" value={category.revenueAccountId || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                    <option value="">Default Revenue Account</option>
                                    {revenueAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.number})</option>)}
                                </select>
                            </div>
                            <div className="mt-4">
                                <label htmlFor="cogsAccountId" className="block text-sm font-medium text-gray-700">Cost of Goods Sold (COGS) Account</label>
                                <select name="cogsAccountId" id="cogsAccountId" value={category.cogsAccountId || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                    <option value="">Default COGS Account</option>
                                    {cogsAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.number})</option>)}
                                </select>
                            </div>
                        </div>

                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t">
                        <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                            Save Category
                        </button>
                        <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryFormModal;
