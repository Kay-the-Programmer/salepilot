import { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { HiOutlineBuildingStorefront } from 'react-icons/hi2';

export default function RetailersView() {
    const [retailers, setRetailers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock retailers for demonstration
        setRetailers([
            { id: 'r1', name: 'Downtown Boutique', address: '123 Main St', category: 'Fashion' },
            { id: 'r2', name: 'Tech Haven', address: '456 Tech Park', category: 'Electronics' },
            { id: 'r3', name: 'Home Essentials', address: '789 Market Ave', category: 'Home & Garden' },
            { id: 'r4', name: 'City Market', address: '321 Urban Rd', category: 'Groceries' },
        ]);
        setLoading(false);
    }, []);

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-8">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Retailers Network</h2>

            {loading ? (
                <div className="flex justify-center py-12">
                     <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
                </div>
            ) : retailers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <HiOutlineBuildingStorefront className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">Retailers Directory</h3>
                    <p className="text-slate-500">Retailer listing coming soon.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {retailers.map(retailer => (
                        <div key={retailer.id} className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow group cursor-pointer active:scale-95 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <HiOutlineBuildingStorefront className="w-6 h-6 text-indigo-600" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-200 px-2 py-1 rounded-full">{retailer.category}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors">{retailer.name}</h4>
                            <p className="text-sm text-slate-500 mb-4">{retailer.address}</p>
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="w-2/3 h-full bg-indigo-600 rounded-full"></div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">Reputation Score: 4.8/5</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
