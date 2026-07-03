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

            // 3. Navigate to PO creation (the Procurement Hub is the single PO manager)
            navigate('/procure/orders', {
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
            <h2 className="text-2xl font-black text-brand-text mb-6">Registered Suppliers</h2>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-sp-green-soft border-t-sp-green rounded-full"></div>
                </div>
            ) : suppliers.length === 0 ? (
                <div className="text-center py-20 bg-surface rounded-3xl border border-dashed border-brand-border">
                    <HiOutlineUserCircle className="w-16 h-16 text-brand-border mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-brand-text">No Suppliers Found</h3>
                    <p className="text-brand-text-muted">Be the first to register as a supplier!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suppliers.map(supplier => (
                        <div key={supplier.id} className="bg-surface border border-brand-border rounded-2xl shadow-sm p-6 hover:shadow-md transition-all flex flex-col">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-sp-green-soft rounded-full flex items-center justify-center text-sp-green-dark font-bold text-xl">
                                    {supplier.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-brand-text">{supplier.name}</h4>
                                    <span className="text-xs bg-sp-green-soft text-sp-green-dark px-2 py-1 rounded-full font-bold uppercase tracking-wider">Supplier</span>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-brand-text-muted flex-1">
                                <p>Email: {supplier.email}</p>
                                {supplier.phone && <p>Phone: {supplier.phone}</p>}
                                {supplier.currentStoreId && <p className="text-xs text-brand-text-muted mt-2">Store ID: {supplier.currentStoreId}</p>}
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => handleViewProfile(supplier.name)}
                                    className="flex-1 py-2 border border-brand-border text-brand-text rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-surface-variant transition-colors active:scale-95">
                                    View Profile
                                </button>
                                <button
                                    onClick={() => handleBuyFromSupplier(supplier)}
                                    className="flex-1 py-2 bg-sp-amber text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-sp-green-dark transition-colors flex items-center justify-center gap-2 active:scale-95"
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
