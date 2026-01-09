import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { shopService, ShopInfo } from '../../services/shop.service';
import { buildAssetUrl } from '../../services/api';
import { Product, Category } from '../../types';
import { HiOutlineFunnel, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { useOutletContext } from 'react-router-dom';
import { formatCurrency } from '../../utils/currency';

const ShopProductList: React.FC = () => {
    const { storeId } = useParams<{ storeId: string }>();
    const { shopInfo } = useOutletContext<{ shopInfo: ShopInfo }>();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    useEffect(() => {
        if (!storeId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [prods, cats] = await Promise.all([
                    shopService.getProducts(storeId, selectedCategory, searchQuery),
                    shopService.getCategories(storeId)
                ]);
                setProducts(prods);
                if (categories.length === 0) setCategories(cats);
            } catch (error) {
                console.error("Failed to load products", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [storeId, selectedCategory, searchQuery]);

    const formatPrice = (price: number) => {
        return formatCurrency(price, shopInfo.settings as any);
    };

    return (
        <div className="flex flex-col md:flex-row gap-8">
            <aside className={`md:w-64 flex-shrink-0 ${mobileFiltersOpen ? 'block' : 'hidden md:block'}`}>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-24">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900">Categories</h3>
                        <button onClick={() => setMobileFiltersOpen(false)} className="md:hidden text-gray-500">
                            ✕
                        </button>
                    </div>
                    <ul className="space-y-2">
                        <li>
                            <button
                                onClick={() => setSelectedCategory('')}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === '' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                All Products
                            </button>
                        </li>
                        {categories.map(cat => (
                            <li key={cat.id}>
                                <button
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === cat.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {cat.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>

            <div className="flex-1">
                <div className="mb-6 flex gap-4">
                    <button
                        onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                        className="md:hidden p-2 bg-white border border-gray-200 rounded-md text-gray-600"
                    >
                        <HiOutlineFunnel className="w-5 h-5" />
                    </button>
                    <div className="relative flex-1 max-w-lg">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HiOutlineMagnifyingGlass className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 h-80 animate-pulse"></div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
                        <p className="text-gray-500">No products found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map(product => (
                            <Link key={product.id} to={`/shop/${storeId}/product/${product.id}`} className="group block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200 xl:aspect-w-7 xl:aspect-h-8 relative h-48">
                                    {product.imageUrls && product.imageUrls.length > 0 ? (
                                        <img
                                            src={buildAssetUrl(product.imageUrls[0])}
                                            alt={product.name}
                                            className="h-full w-full object-cover object-center group-hover:opacity-75"
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400?text=No+Image' }}
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-400 bg-gray-100">
                                            No Image
                                        </div>
                                    )}
                                    {product.stock <= 0 && (
                                        <div className="absolute top-2 right-2 bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">
                                            Out of Stock
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                                    <p className="mt-1 text-lg font-medium text-gray-900">{formatPrice(product.price)}</p>
                                    <p className="mt-1 text-xs text-gray-500">{product.brand}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopProductList;
