import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBuildingStorefront } from 'react-icons/hi2';

export interface PublicStore {
    id: string;
    name: string;
    status: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    currency?: { code: string; symbol: string };
}

interface StoreGridProps {
    stores: PublicStore[];
    loading: boolean;
}

const StoreGrid: React.FC<StoreGridProps> = ({ stores, loading }) => {
    const navigate = useNavigate();

    // Mock images to make the grid look like the design since store object doesn't have images yet
    const mockImages = [
        'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1074',
        'https://images.unsplash.com/photo-1529139574466-a302c27e3844?q=80&w=600',
        'https://images.unsplash.com/photo-1485217988980-11786ced9454?q=80&w=600',
        'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=600',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600',
        'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?q=80&w=600',
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="bg-gray-200 aspect-[3/4] rounded-lg mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (stores.length === 0) {
        return (
            <div className="text-center py-20">
                <HiOutlineBuildingStorefront className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No stores found</h3>
                <p className="mt-2 text-gray-500">Check back later for new additions.</p>
            </div>
        );
    }

    return (
        <div id="store-grid" className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-medium text-gray-900 mb-2">Ecomus's Favorites</h2>
                    <p className="text-gray-500">Beautifully Functional. Needlessly Optional. Competely Clean.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {stores.map((store, index) => (
                        <div key={store.id} className="group cursor-pointer active:scale-95 transition-all duration-300" onClick={() => navigate(`/shop/${store.id}`)}>
                            <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-4 bg-gray-100">
                                {/* Using distinct mock images for variety based on index loop */}
                                <img
                                    src={mockImages[index % mockImages.length]}
                                    alt={store.name}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                />
                                {index === 0 && (
                                    <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">-33%</span>
                                )}
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button className="liquid-glass-card rounded-[2rem] text-black px-6 py-3 font-medium transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                        View Shop
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-base font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{store.name}</h3>
                                {store.address && (
                                    <p className="text-sm text-gray-500 line-clamp-1">{store.address}</p>
                                )}
                                <div className="mt-2 flex items-center space-x-2">
                                    {/* Color swatches mock */}
                                    <div className="w-4 h-4 rounded-full border border-gray-300 p-0.5 cursor-pointer active:scale-95 transition-all duration-300">
                                        <div className="w-full h-full rounded-full bg-yellow-100"></div>
                                    </div>
                                    <div className="w-4 h-4 rounded-full border border-transparent p-0.5 cursor-pointer active:scale-95 transition-all duration-300">
                                        <div className="w-full h-full rounded-full bg-black"></div>
                                    </div>
                                    <div className="w-4 h-4 rounded-full border border-transparent p-0.5 cursor-pointer active:scale-95 transition-all duration-300">
                                        <div className="w-full h-full rounded-full bg-purple-100"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <button className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors active:scale-95 transition-all duration-300">
                        Load More
                    </button>
                    {/* Newsletter */}
                    <div className="mt-32 max-w-4xl mx-auto bg-gray-50 rounded-2xl p-12 text-center md:flex md:items-center md:justify-between md:text-left">
                        <div className="mb-6 md:mb-0">
                            <h3 className="text-2xl font-bold mb-2">Subscribe to our newsletter</h3>
                            <p className="text-gray-600">Get 20% off your first order!</p>
                        </div>
                        <div className="flex w-full md:w-auto">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none w-full md:w-64"
                            />
                            <button className="bg-black text-white px-6 py-3 rounded-r-lg font-medium hover:bg-gray-800 active:scale-95 transition-all duration-300">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreGrid;
