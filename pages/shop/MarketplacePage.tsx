import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { HiOutlineBuildingStorefront, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface PublicStore {
    id: string;
    name: string;
    status: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    currency?: { code: string; symbol: string };
}

const MarketplacePage: React.FC = () => {
    const [stores, setStores] = useState<PublicStore[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            const response = await axios.get(`${API_URL}/shop/stores`);
            setStores(response.data);
        } catch (error) {
            console.error('Error fetching stores:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (store.address && store.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/directory')}>
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <HiOutlineBuildingStorefront className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">SalePilot Directory</h1>
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Discover Local Stores
                    </h2>
                    <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                        Browse our directory of verified stores and shop online directly.
                    </p>
                </div>

                <div className="max-w-xl mx-auto mb-12 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <HiOutlineMagnifyingGlass className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                        placeholder="Search for stores by name or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse h-64"></div>
                        ))}
                    </div>
                ) : filteredStores.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <HiOutlineBuildingStorefront className="h-16 w-16 mx-auto opacity-50" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No stores found</h3>
                        <p className="mt-1 text-gray-500">Try adjusting your search criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredStores.map(store => (
                            <div key={store.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden flex flex-col">
                                <div className="h-32 bg-indigo-50 flex items-center justify-center">
                                    <HiOutlineBuildingStorefront className="h-12 w-12 text-indigo-300" />
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 truncate" title={store.name}>{store.name}</h3>
                                    {store.address && (
                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5em]">{store.address}</p>
                                    )}
                                    <div className="mt-auto pt-4 border-t border-gray-50">
                                        <button
                                            onClick={() => navigate(`/shop/${store.id}`)}
                                            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                        >
                                            Visit Store
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-400">
                        &copy; 2026 SalePilot. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default MarketplacePage;
