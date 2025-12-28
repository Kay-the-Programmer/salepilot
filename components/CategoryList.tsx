
import React from 'react';
import { Category } from '../types';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';

interface CategoryListProps {
    categories: Category[];
    searchTerm: string;
    onEdit: (category: Category) => void;
    onDelete: (categoryId: string) => void;
    isLoading: boolean;
    error: string | null;
}

const CategoryList: React.FC<CategoryListProps> = ({ categories, searchTerm, onEdit, onDelete, isLoading, error }) => {

    const renderCategories = (parentId: string | null, level: number): React.ReactNode => {
        const children = categories.filter(c => c.parentId === parentId);
        
        if (children.length === 0 && level === 0 && searchTerm) return null;

        return children
            .filter(c => !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(category => (
            <React.Fragment key={category.id}>
                <tr className="bg-white hover:bg-gray-50">
                    <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center" style={{ paddingLeft: `${level * 2}rem` }}>
                             <div className="font-medium text-gray-900">{category.name}</div>
                        </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{category.attributes.map(a => a.name).join(', ') || '-'}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{categories.filter(c => c.parentId === category.id).length}</td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center justify-end space-x-4">
                            <button onClick={() => onEdit(category)} className="text-blue-600 hover:text-blue-900" title="Edit Category">
                                <PencilIcon className="w-5 h-5"/>
                            </button>
                            <button onClick={() => onDelete(category.id)} className="text-red-600 hover:text-red-900" title="Delete Category">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </td>
                </tr>
                {renderCategories(category.id, level + 1)}
            </React.Fragment>
        ));
    };

    if (isLoading) {
        return <div className="text-center p-10">Loading categories...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">Error: {error}</div>;
    }

    const topLevelCategories = renderCategories(null, 0);

    if (!topLevelCategories || (Array.isArray(topLevelCategories) && topLevelCategories.length === 0)) {
        return <div className="text-center p-10 text-gray-500">No categories found.</div>;
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="mt-4 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Category Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Custom Attributes</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Sub-categories</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                   {topLevelCategories}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryList;