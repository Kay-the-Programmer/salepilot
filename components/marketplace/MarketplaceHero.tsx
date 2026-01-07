import React from 'react';
import { useNavigate } from 'react-router-dom';

const MarketplaceHero: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section className="relative h-[600px] w-full bg-gray-100 overflow-hidden">
            {/* Background Image Placeholder - using a high quality fashion image */}
            <div className="absolute inset-0">
                <img
                    src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop"
                    alt="Hero Background"
                    className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/10"></div>
            </div>

            <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-start">
                <div className="max-w-2xl text-white pl-4 md:pl-10">
                    <h1 className="text-5xl md:text-7xl font-bold mb-4 leading-tight tracking-tight">
                        Elegance
                    </h1>
                    <p className="text-lg md:text-xl mb-8 font-light text-gray-100 opacity-90">
                        From casual to formal, we've got you covered
                    </p>
                    <button
                        onClick={() => {
                            const element = document.getElementById('store-grid');
                            element?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors flex items-center group"
                    >
                        Shop Collection
                        <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Pagination/Carousel Indicators (Mock) */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-white"></div>
                <div className="w-2 h-2 rounded-full bg-white/50"></div>
                <div className="w-2 h-2 rounded-full bg-white/50"></div>
            </div>
        </section>
    );
};

export default MarketplaceHero;
