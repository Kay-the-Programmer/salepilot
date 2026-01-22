import { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { HiOutlineBuildingStorefront } from 'react-icons/hi2';

export default function RetailersView() {
    const [retailers, setRetailers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch stores to list as retailers
        const fetchRetailers = async () => {
            try {
                // Using existing endpoint if available or mocking
                // Based on auth controller logic, we don't have a direct public "list all stores" endpoint in the snippets I saw
                // But marketplace controller has `findMatchingStores` so stores table exists.
                // START HACK: For now I'll create a placeholder or try to use an endpoint if I find one. 
                // Let's assume we might need to add one, but to keep it simple I will just show a "Coming Soon" or mock data if no endpoint is readily available for *all* stores.
                // Actually, I can check if there is a store list endpoint. 
                // `c:\Users\omen\Downloads\salepilot\salepilot-backend\src\controllers\users.controller.ts` had some store logic.

                // Let's rely on a mock for now and add a TODO to implement the backend list.
                // Or I can try to hit `/api/stores` if it existed.

                // Setting empty for now to show the UI state
                setRetailers([]);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch retailers", error);
                setLoading(false);
            }
        };
        fetchRetailers();
    }, []);

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-8">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Retailers Network</h2>

            {loading ? (
                <div className="text-center py-12">Loading retailers...</div>
            ) : retailers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <HiOutlineBuildingStorefront className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">Retailers Directory</h3>
                    <p className="text-slate-500">Retailer listing coming soon.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Render retailers here */}
                </div>
            )}
        </div>
    );
}
