import React from 'react';

const categories = [
    { id: 1, name: 'Tops', image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=500&auto=format&fit=crop' },
    { id: 2, name: 'Casual', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=500&auto=format&fit=crop' },
    { id: 3, name: 'Swimwear', image: 'https://images.unsplash.com/photo-1574966739987-6e1d5272a859?q=80&w=500&auto=format&fit=crop' },
    { id: 4, name: 'Dresses', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=500&auto=format&fit=crop' },
];

const MarketplaceCategories: React.FC = () => {
    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-medium text-center mb-12 text-gray-900">Categories you might like</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {categories.map((cat) => (
                        <div key={cat.id} className="group cursor-pointer active:scale-95 transition-all duration-300">
                            <div className="relative overflow-hidden rounded-lg aspect-[3/4] mb-4">
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors active:scale-95 transition-all duration-300"></div>
                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                                    <span className="liquid-glass-card rounded-[2rem] px-6 py-2 text-sm font-medium whitespace-nowrap">
                                        {cat.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Promo Full Width */}
            <div className="container mx-auto px-4 mt-16">
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="relative rounded-lg overflow-hidden h-[400px]">
                        <img src="https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?q=80&w=1000&auto=format&fit=crop" alt="The January Collection" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/40 to-transparent">
                            <h3 className="text-white text-2xl font-bold mb-2">The January Collection</h3>
                            <button className="bg-white text-black px-6 py-2 rounded-full self-start font-medium text-sm hover:bg-gray-100 active:scale-95 transition-all duration-300">Shop now</button>
                        </div>
                    </div>
                    <div className="relative rounded-lg overflow-hidden h-[400px]">
                        <img src="https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=1000&auto=format&fit=crop" alt="Olympia's Picks" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/40 to-transparent">
                            <h3 className="text-white text-2xl font-bold mb-2">Olympia's Picks</h3>
                            <button className="bg-white text-black px-6 py-2 rounded-full self-start font-medium text-sm hover:bg-gray-100 active:scale-95 transition-all duration-300">Shop now</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MarketplaceCategories;
