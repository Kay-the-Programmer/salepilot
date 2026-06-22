import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeftOnRectangle, HiOutlineArrowRight, HiOutlineShoppingBag } from 'react-icons/hi2';
import PostOfferModal from '../../../components/offers/PostOfferModal';
import Modal from '../../ui/Modal';

// Reusing parts of the original MarketplacePage logic
export default function QuickOffersView() {
    const navigate = useNavigate();
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null); // For Flash Deal Modal

    // Mock Flash Deals
    const flashDeals = [
        { id: 101, name: 'Premium Coffee Maker', price: 89.99, image: null },
        { id: 102, name: 'Wireless Headphones', price: 129.50, image: null },
        { id: 103, name: 'Smart Watch Series 5', price: 249.00, image: null },
        { id: 104, name: 'Ergonomic Mouse', price: 45.00, image: null },
        { id: 105, name: 'Mechanical Keyboard', price: 110.00, image: null },
    ];

    return (
        <div className="pb-20">
            {/* Hero Section */}
            <section className="max-w-[1400px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-warm-900 rounded-3xl overflow-hidden relative min-h-[400px] flex items-center px-12">
                    <div className="relative z-10 max-w-lg">
                        <span className="px-3 py-1 bg-white/10 backdrop-blur rounded-lg text-[10px] font-black uppercase tracking-widest text-sp-amber mb-4 inline-block">Quick Offers</span>
                        <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                            Request what you need, <br /> get offers in minutes.
                        </h2>
                        <button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="px-8 py-4 bg-sp-green text-white rounded-full font-bold uppercase text-xs tracking-widest hover:bg-sp-green-dark transition-colors active:scale-95"
                        >
                            Post a Request
                        </button>
                    </div>
                    {/* Abstract graphics */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-sp-green-dark/40 to-transparent pointer-events-none" />
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="flex-1 bg-surface border border-brand-border rounded-3xl p-8 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer active:scale-95" onClick={() => navigate('/marketplace?view=requests')}>
                        <h3 className="text-xl font-black text-brand-text mb-2">Active Requests</h3>
                        <p className="text-brand-text-muted text-sm mb-4">See what others are looking for and make a sale.</p>
                        <button className="text-xs font-bold text-sp-green-dark uppercase tracking-wider group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">View Requests <HiOutlineArrowRight className="w-3 h-3" /></button>
                    </div>
                    <div className="flex-1 bg-surface border border-brand-border rounded-3xl p-8 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer active:scale-95" onClick={() => navigate('/marketplace?view=activity')}>
                        <h3 className="text-xl font-black text-brand-text mb-2">My Offers</h3>
                        <p className="text-brand-text-muted text-sm mb-4">Track your sent and received offers.</p>
                        <button className="text-xs font-bold text-sp-green-dark uppercase tracking-wider group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">Track Activity <HiOutlineArrowRight className="w-3 h-3" /></button>
                    </div>
                </div>
            </section>

            {/* Flash Deals Section */}
            <section className="max-w-[1400px] mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-brand-text tracking-tight">Flash Deals</h3>
                    <div className="flex gap-2">
                        <button className="w-10 h-10 rounded-full border border-brand-border flex items-center justify-center hover:bg-warm-900 hover:text-white transition-colors active:scale-95">
                            <HiOutlineArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                    {flashDeals.map(product => (
                        <div key={product.id} className="group cursor-pointer active:scale-95 transition-all duration-300" onClick={() => setSelectedProduct(product)}>
                            <div className="bg-surface border border-brand-border rounded-3xl p-6 mb-4 aspect-[4/5] flex items-center justify-center relative overflow-hidden">
                                <div className="absolute top-4 right-4 bg-sp-amber text-warm-900 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                    -20%
                                </div>
                                <HiOutlineShoppingBag className="w-12 h-12 text-brand-border group-hover:scale-110 transition-transform" />
                            </div>
                            <h4 className="text-sm font-bold text-brand-text mb-1">{product.name}</h4>
                            <span className="text-sp-green-dark font-black">${product.price.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </section>

            <PostOfferModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                onOfferCreated={() => { }}
            />

            {/* Product Detail Modal */}
            {selectedProduct && (
                <Modal open onClose={() => setSelectedProduct(null)} size="2xl" className="rounded-3xl" zIndexClass="z-[100]">
                        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                            <div className="bg-surface-variant p-12 flex items-center justify-center">
                                <HiOutlineShoppingBag className="w-32 h-32 text-brand-border" />
                            </div>
                            <div className="p-10 relative">
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="absolute top-6 right-6 p-2 bg-surface-variant rounded-full hover:bg-brand-border transition-colors active:scale-95"
                                >
                                    <HiOutlineArrowLeftOnRectangle className="w-5 h-5 text-brand-text-muted rotate-180" />
                                </button>

                                <span className="inline-block px-3 py-1 bg-sp-amber-soft text-sp-amber rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">Flash Deal</span>

                                <h3 className="text-3xl font-black text-brand-text mb-2 leading-tight">{selectedProduct.name}</h3>
                                <p className="text-3xl font-black text-sp-green-dark mb-6">${selectedProduct.price.toFixed(2)}</p>

                                <p className="text-brand-text-muted text-sm mb-8 leading-relaxed">
                                    This is a limited time offer. Grab this deal before it expires. High quality product from a verified supplier.
                                </p>

                                <button className="w-full py-4 bg-sp-green text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-sp-green-dark transition-colors shadow-sm active:scale-95">
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                </Modal>
            )}
        </div>
    );
}
