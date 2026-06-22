import React from 'react';
import CubeIcon from '../../components/icons/CubeIcon';
import TagIcon from '../../components/icons/TagIcon';

interface InventoryEmptyStateProps {
    activeTab: 'products' | 'categories';
}

const InventoryEmptyState: React.FC<InventoryEmptyStateProps> = ({ activeTab }) => {
    return (
        <div className="hidden md:flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-20 h-20 rounded-[28px] bg-success-muted dark:bg-primary/10 border border-primary/15 flex items-center justify-center mb-5 shadow-sm rotate-3">
                {activeTab === 'products' ? (
                    <CubeIcon className="w-9 h-9 text-primary" />
                ) : (
                    <TagIcon className="w-9 h-9 text-primary" />
                )}
            </div>
            <h3 className="text-lg font-bold tracking-tight text-brand-text mb-1.5">
                No {activeTab === 'products' ? 'product' : 'category'} selected
            </h3>
            <p className="text-sm text-brand-text-muted max-w-xs leading-relaxed">
                Select {activeTab === 'products' ? 'a product' : 'a category'} from the list to view and manage its details here.
            </p>
        </div>
    );
};

export default InventoryEmptyState;
