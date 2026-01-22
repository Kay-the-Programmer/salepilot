import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineMagnifyingGlass, HiOutlineArrowLeftOnRectangle, HiOutlineArrowRight, HiOutlineShoppingBag, HiOutlinePlus } from 'react-icons/hi2';
import { formatCurrency } from '../../../utils/currency';
import PostOfferModal from '../../../components/offers/PostOfferModal';
import SalePilotLogo from '../../../assets/salepilot.png';

// Reusing parts of the original MarketplacePage logic
export default function QuickOffersView({ currentUser }: { currentUser: any }) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [products, setProducts] = useState<any[]>([]); // Should come from props or context ideally
    const [loading, setLoading] = useState(false);

    // Mock products for display if empty (ported from original page assumption)
    const filteredProducts = useMemo(() => products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm]);

    return (
        <div className="pb-20">
            {/* Hero Section */}
            <section className="max-w-[1400px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-slate-900 rounded-3xl overflow-hidden relative min-h-[400px] flex items-center px-12">
                    <div className="relative z-10 max-w-lg">
                        <span className="px-3 py-1 bg-white/10 backdrop-blur rounded-lg text-[10px] font-black uppercase tracking-widest text-[#FF7F27] mb-4 inline-block">Quick Offers</span>
                        <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                            Request what you need, <br /> get offers in minutes.
                        </h2>
                        <button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="px-8 py-4 bg-[#FF7F27] text-white rounded-full font-bold uppercase text-xs tracking-widest hover:bg-[#E66B1F] transition-colors"
                        >
                            Post a Request
                        </button>
                    </div>
                    {/* Abstract graphics */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-indigo-900/50 to-transparent pointer-events-none" />
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="flex-1 bg-white border border-slate-100 rounded-3xl p-8 relative overflow-hidden group">
                        <h3 className="text-xl font-black text-slate-900 mb-2">Active Requests</h3>
                        <p className="text-slate-500 text-sm mb-4">See what others are looking for and make a sale.</p>
                        <button className="text-xs font-bold text-indigo-600 uppercase tracking-wider">View Requests &rarr;</button>
                    </div>
                    <div className="flex-1 bg-white border border-slate-100 rounded-3xl p-8 relative overflow-hidden group">
                        <h3 className="text-xl font-black text-slate-900 mb-2">My Offers</h3>
                        <p className="text-slate-500 text-sm mb-4">Track your sent and received offers.</p>
                        <button className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Track Activity &rarr;</button>
                    </div>
                </div>
            </section>

            {/* Flash Deals Section */}
            <section className="max-w-[1400px] mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Flash Deals</h3>
                    <div className="flex gap-2">
                        <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-colors">
                            <HiOutlineArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                    {/* Placeholder for deals */}
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="group cursor-pointer">
                            <div className="bg-white border border-slate-100 rounded-3xl p-6 mb-4 aspect-[4/5] flex items-center justify-center">
                                <HiOutlineShoppingBag className="w-12 h-12 text-slate-200" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mb-1">Product {i}</h4>
                            <span className="text-red-500 font-black">$99.00</span>
                        </div>
                    ))}
                </div>
            </section>

            <PostOfferModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                onOfferCreated={() => { }}
            />
        </div>
    );
}
