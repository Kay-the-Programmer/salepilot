import { useEffect, useState } from 'react';
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
            <h2 className="text-2xl font-black text-brand-text mb-6">Retailers Network</h2>

            {loading ? (
                <div className="flex justify-center py-12">
                     <div className="animate-spin w-8 h-8 border-4 border-sp-green-soft border-t-sp-green rounded-full"></div>
                </div>
            ) : retailers.length === 0 ? (
                <div className="text-center py-20 bg-surface rounded-3xl border border-dashed border-brand-border">
                    <HiOutlineBuildingStorefront className="w-16 h-16 text-brand-border mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-brand-text">Retailers Directory</h3>
                    <p className="text-brand-text-muted">Retailer listing coming soon.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {retailers.map(retailer => (
                        <div key={retailer.id} className="bg-surface p-6 rounded-2xl border border-brand-border shadow-sm hover:shadow-md transition-all group cursor-pointer active:scale-95">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 bg-sp-green-soft rounded-lg flex items-center justify-center">
                                    <HiOutlineBuildingStorefront className="w-6 h-6 text-sp-green-dark" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted border border-brand-border px-2 py-1 rounded-full">{retailer.category}</span>
                            </div>
                            <h4 className="font-bold text-brand-text text-lg mb-1 group-hover:text-sp-green-dark transition-colors">{retailer.name}</h4>
                            <p className="text-sm text-brand-text-muted mb-4">{retailer.address}</p>
                            <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                                <div className="w-2/3 h-full bg-sp-green rounded-full"></div>
                            </div>
                            <p className="text-[10px] font-bold text-brand-text-muted mt-2 uppercase tracking-wide">Reputation Score: 4.8/5</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
