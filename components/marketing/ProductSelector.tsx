import React, { useState } from 'react';
import { Product } from '../../types';
import { SearchIcon } from '../icons';

interface Props {
    products: Product[];
    onSelect: (product: Product) => void;
    selectedProductId?: string;
}

const ProductSelector: React.FC<Props> = ({ products, onSelect, selectedProductId }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-transparent">
            <div className="px-4 pb-4">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 thin-scrollbar">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-slate-600">
                        No products found
                    </div>
                ) : (
                    filteredProducts.map(product => (
                        <div
                            key={product.id}
                            onClick={() => onSelect(product)}
                            className={`
                                group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer
                                ${selectedProductId === product.id
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400 shadow-sm ring-1 ring-blue-500/30'
                                    : 'bg-white dark:bg-slate-900/30 border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
                                }
                            `}
                        >
                            <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200 dark:border-slate-700 shadow-inner">
                                {product.imageUrls && product.imageUrls.length > 0 ? (
                                    <img
                                        src={product.imageUrls[0]}
                                        alt={product.name}
                                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                    />
                                ) : ( // Fallback icon 
                                    <span className="text-xl">📦</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`font-medium truncate ${selectedProductId === product.id ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-slate-200'}`}>
                                    {product.name}
                                </h4>
                                <div className="flex justify-between items-center text-xs mt-1">
                                    <span className="text-gray-500 dark:text-slate-500 font-mono">{product.sku}</span>
                                    <span className={`font-bold ${selectedProductId === product.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300'}`}>
                                        ${product.price}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProductSelector;
