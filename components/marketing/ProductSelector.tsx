import React, { useState } from 'react';
import { Product } from '../../types';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'; // Start using heroicons direct if needed, or from internal icons if available. 
// Actually, let's use the project's icon system to be consistent. 
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
        <div className="flex flex-col h-full">
            <div className="px-4 pb-4">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
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
                                    ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500'
                                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                }
                            `}
                        >
                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                {product.imageUrls && product.imageUrls.length > 0 ? (
                                    <img
                                        src={product.imageUrls[0]}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : ( // Fallback icon 
                                    <span className="text-xl">📦</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`font-medium truncate ${selectedProductId === product.id ? 'text-blue-900' : 'text-gray-900'}`}>
                                    {product.name}
                                </h4>
                                <div className="flex justify-between items-center text-xs mt-1">
                                    <span className="text-gray-500 font-mono">{product.sku}</span>
                                    <span className={`font-semibold ${selectedProductId === product.id ? 'text-blue-700' : 'text-gray-700'}`}>
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
