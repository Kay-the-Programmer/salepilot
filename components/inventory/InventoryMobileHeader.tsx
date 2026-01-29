import React from 'react';
import { FiCamera, FiGrid } from 'react-icons/fi';

interface InventoryMobileHeaderProps {
    activeTab: 'products' | 'categories';
    selectedItem: boolean;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    onScanClick: () => void;
}

const InventoryMobileHeader: React.FC<InventoryMobileHeaderProps> = ({
    activeTab,
    selectedItem,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    onScanClick
}) => {
    return (
        <div className={`sticky top-0 z-30 bg-white border-b border-gray-200 md:hidden ${selectedItem ? 'hidden' : ''}`}>
            <div className="px-4 py-3 flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900">
                    {activeTab === 'products' ? 'Inventory' : 'Categories'}
                </h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onScanClick}
                        className="p-2 rounded-lg text-gray-600 active:bg-gray-100 transition-colors"
                    >
                        <FiCamera className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`p-2 rounded-lg active:bg-gray-100 transition-colors ${isMobileMenuOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
                    >
                        <FiGrid className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InventoryMobileHeader;
