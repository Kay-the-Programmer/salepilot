
import React, { useState } from 'react';
import { Category, Account } from '../types';
import Header from '../components/Header';
import CategoryList from '../components/CategoryList';
import CategoryFormModal from '../components/CategoryFormModal';

interface CategoriesPageProps {
    categories: Category[];
    accounts: Account[];
    onSaveCategory: (category: Category) => void;
    onDeleteCategory: (categoryId: string) => void;
    isLoading: boolean;
    error: string | null;
}
 
const CategoriesPage: React.FC<CategoriesPageProps> = ({
    categories,
    accounts,
    onSaveCategory,
    onDeleteCategory,
    isLoading,
    error,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleOpenAddModal = () => {
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (category: Category) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleSave = (category: Category) => {
        onSaveCategory(category);
        handleCloseModal();
    };
    
    const filteredCategories = categories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Header
                title="Product Categories"
                buttonText="Add Category"
                onButtonClick={handleOpenAddModal}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
             />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                <CategoryList
                    categories={categories} // pass all to preserve hierarchy
                    searchTerm={searchTerm}
                    onEdit={handleOpenEditModal}
                    onDelete={onDeleteCategory}
                    isLoading={isLoading}
                    error={error}
                />
            </main>
            <CategoryFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                categoryToEdit={editingCategory}
                allCategories={categories}
                accounts={accounts}
            />
        </>
    );
};

export default CategoriesPage;
