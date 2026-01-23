import { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { HiOutlineUserCircle, HiShoppingCart } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { Supplier } from '../../../types';

export default function SuppliersView() {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState<any[]>([]); // These are Users with role 'supplier'
    const [mySuppliers, setMySuppliers] = useState<Supplier[]>([]); // Current store's linked suppliers
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, mySuppliersRes] = await Promise.all([
                    api.get<any[]>('/users'), // Ideally /marketplace/suppliers
                    api.get<Supplier[]>('/suppliers')
                ]);

                const supplierUsers = usersRes.filter(u => u.role === 'supplier');
                setSuppliers(supplierUsers);
                setMySuppliers(mySuppliersRes);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleBuyFromSupplier = async (supplierUser: any) => {
        try {
            // 1. Check if already linked
            let targetSupplier = mySuppliers.find(s =>
                s.linkedStoreId === supplierUser.currentStoreId ||
                (s.email === supplierUser.email && s.name === supplierUser.name)
            );

            // 2. If not, create a local Supplier record
            if (!targetSupplier) {
                const newSupplierPayload = {
                    name: supplierUser.name,
                    email: supplierUser.email,
                    phone: supplierUser.phone,
                    contactPerson: supplierUser.name,
                    linkedStoreId: supplierUser.currentStoreId || 'unknown_store_id',
                    notes: 'Added from Marketplace'
                };

                targetSupplier = await api.post<Supplier>('/suppliers', newSupplierPayload);
            }

            // 3. Navigate to PO creation
            navigate('/purchase-orders', {
                state: {
                    action: 'create_po',
                    supplierId: targetSupplier.id
                }
            });

        } catch (error) {
            console.error("Failed to link supplier", error);
            alert("Failed to proceed with order. Please try again.");
        }
    };

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
                        <div key={supplier.id} className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow flex flex-col">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                                    {supplier.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{supplier.name}</h4>
                                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Supplier</span>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-slate-500 flex-1">
                                <p>Email: {supplier.email}</p>
                                {supplier.phone && <p>Phone: {supplier.phone}</p>}
                                {supplier.currentStoreId && <p className="text-xs text-slate-400 mt-2">Store ID: {supplier.currentStoreId}</p>}
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => handleViewProfile(supplier.name)}
                                    className="flex-1 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors">
                                    View Profile
                                </button>
                                <button
                                    onClick={() => handleBuyFromSupplier(supplier)}
                                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <HiShoppingCart className="w-4 h-4" />
                                    Order Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
