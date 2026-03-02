import React from 'react';
import CubeIcon from '../../components/icons/CubeIcon';
import TagIcon from '../../components/icons/TagIcon';

interface InventoryMobileHeaderProps {
    activeTab: 'products' | 'categories';
    setActiveTab: (tab: 'products' | 'categories') => void;
    selectedItem: boolean;
}

const InventoryMobileHeader: React.FC<InventoryMobileHeaderProps> = ({
    activeTab,
    setActiveTab,
    selectedItem,
}) => {
    // Hide bottom nav when a product/category detail is open (full-screen detail view)
    if (selectedItem) return null;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-slate-200/60 dark:border-white/8 safe-area-pb">
            <div className="flex items-stretch h-16">
                {/* Products Tab */}
                <button
                    onClick={() => setActiveTab('products')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${activeTab === 'products'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                    aria-label="Products"
                    aria-selected={activeTab === 'products'}
                >
                    {/* Pill indicator */}
                    <span className={`transition-all duration-300 ${activeTab === 'products' ? 'opacity-100' : 'opacity-0'}`}>
                        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-blue-500 rounded-full" />
                    </span>
                    <CubeIcon className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'products' ? 'scale-110' : 'scale-100'}`} />
                    <span className={`text-[10px] font-semibold tracking-wide transition-all duration-200 ${activeTab === 'products' ? 'font-bold' : ''}`}>
                        Products
                    </span>
                </button>

                {/* Categories Tab */}
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${activeTab === 'categories'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                    aria-label="Categories"
                    aria-selected={activeTab === 'categories'}
                >
                    <TagIcon className={`w-5 h-5 transition-transform duration-200 ${activeTab === 'categories' ? 'scale-110' : 'scale-100'}`} />
                    <span className={`text-[10px] font-semibold tracking-wide transition-all duration-200 ${activeTab === 'categories' ? 'font-bold' : ''}`}>
                        Categories
                    </span>
                </button>
            </div>
        </nav>
    );
};

export default InventoryMobileHeader;
