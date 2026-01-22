import { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { HiOutlineUserCircle } from 'react-icons/hi2';

export default function SuppliersView() {
    // In a real app, this would fetch users with role 'supplier'
    // For now, we'll fetch all users and filter client-side or assume an endpoint exists
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                // Try fetching real suppliers
                const data = await api.get<any[]>('/users');
                const supplierUsers = data.filter(u => u.role === 'supplier');

                if (supplierUsers.length > 0) {
                    setSuppliers(supplierUsers);
                } else {
                    // Fallback to mock data if no real suppliers found (for demo)
                    throw new Error("No suppliers found");
                }
            } catch (error) {
                console.log("Using mock suppliers data");
                setSuppliers([
                    { id: 's1', name: 'Global Electronics Ltd', email: 'sales@globalelec.com', phone: '+1 555-0123', role: 'supplier' },
                    { id: 's2', name: 'Fresh Farms Co', email: 'orders@freshfarms.com', phone: '+1 555-0124', role: 'supplier' },
                    { id: 's3', name: 'Textile World', email: 'contact@textileworld.com', phone: '+1 555-0125', role: 'supplier' },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchSuppliers();
    }, []);

    const handleViewProfile = (supplierName: string) => {
        alert(`Profile for ${supplierName} is coming soon!`);
    };

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-8">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Registered Suppliers</h2>

            {loading ? (
                <div className="flex justify-center py-12">
                     <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
                </div>
            ) : suppliers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <HiOutlineUserCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">No Suppliers Found</h3>
                    <p className="text-slate-500">Be the first to register as a supplier!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suppliers.map(supplier => (
                        <div key={supplier.id} className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                                    {supplier.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{supplier.name}</h4>
                                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Supplier</span>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-slate-500">
                                <p>Email: {supplier.email}</p>
                                {supplier.phone && <p>Phone: {supplier.phone}</p>}
                            </div>
                            <button
                                onClick={() => handleViewProfile(supplier.name)}
                                className="mt-6 w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 transition-colors"
                            >
                                View Profile
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
