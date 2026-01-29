import React from 'react';
import CubeIcon from '../../components/icons/CubeIcon';
import TagIcon from '../../components/icons/TagIcon';

interface InventoryEmptyStateProps {
    activeTab: 'products' | 'categories';
}

const InventoryEmptyState: React.FC<InventoryEmptyStateProps> = ({ activeTab }) => {
    return (
        <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
            <div className="p-4 bg-white rounded-3xl shadow-sm mb-4 border border-gray-100">
                {activeTab === 'products' ? (
                    <CubeIcon className="w-12 h-12 text-gray-300" />
                ) : (
                    <TagIcon className="w-12 h-12 text-gray-300" />
                )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
                No {activeTab === 'products' ? 'Product' : 'Category'} Selected
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
                Select {activeTab === 'products' ? 'a product' : 'a category'} from the list on the left to view and manage its details here.
            </p>
        </div>
    );
};

export default InventoryEmptyState;
