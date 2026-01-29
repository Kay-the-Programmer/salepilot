import React from 'react';
import CubeIcon from '../../components/icons/CubeIcon';
import TagIcon from '../../components/icons/TagIcon';
import PlusIcon from '../../components/icons/PlusIcon';

interface InventoryMobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: 'products' | 'categories';
    onTabChange: (tab: 'products' | 'categories') => void;
    canManageProducts: boolean;
    onAddProduct: () => void;
}

const InventoryMobileMenu: React.FC<InventoryMobileMenuProps> = ({
    isOpen,
    onClose,
    activeTab,
    onTabChange,
    canManageProducts,
    onAddProduct
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute top-[60px] right-4 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2" onClick={e => e.stopPropagation()}>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => { onTabChange('products'); onClose(); }}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl ${activeTab === 'products' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-700'}`}
                    >
                        <CubeIcon className="w-6 h-6 mb-1" />
                        <span className="text-xs font-semibold">Products</span>
                    </button>
                    <button
                        onClick={() => { onTabChange('categories'); onClose(); }}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl ${activeTab === 'categories' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-700'}`}
                    >
                        <TagIcon className="w-6 h-6 mb-1" />
                        <span className="text-xs font-semibold">Categories</span>
                    </button>
                    {canManageProducts && (
                        <button
                            onClick={() => { onAddProduct(); onClose(); }}
                            className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 text-blue-700"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span className="text-sm font-semibold">Add New Item</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryMobileMenu;
