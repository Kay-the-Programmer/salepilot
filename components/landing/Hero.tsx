import React, { useState, useEffect } from 'react';
import sellsmart from '../../assets/sellsmart.png';
import inventory from '../../assets/inventory.png';
import offline from '../../assets/offline.png';

interface HeroProps {
    onStartTrial: (email: string) => void;
}

const slides = [
    {
        image: sellsmart,
        title: "Sell Smart",
        description: "Streamline your sales with an intelligent POS system"
    },
    {
        image: inventory,
        title: "Track Inventory",
        description: "Real-time stock management with automatic alerts"
    },
    {
        image: offline,
        title: "Sell Offline",
        description: "Make sales even when internet is unavailable"
    }
];

const Hero: React.FC<HeroProps> = ({ onStartTrial }) => {
    const [email, setEmail] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            onStartTrial(email);
            setEmail('');
        }
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden bg-black">
            {/* Background Images Slider */}
            {slides.map((slide, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                    />
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-black/50" />
                </div>
            ))}

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Desktop: Left-aligned content */}
                <div className="hidden lg:block">
                    <div className="max-w-xl">
                        {/* Slide Content - Left-aligned on desktop */}
                        <div className="mb-8">
                            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4 text-left">
                                {slides[currentSlide].title}
                            </h1>
                            <p className="text-xl lg:text-2xl text-gray-200 text-left">
                                {slides[currentSlide].description}
                            </p>
                        </div>

                        {/* Persistent Email Form - Left-aligned on desktop */}
                        <form onSubmit={handleSubmit} className="mb-8 max-w-md">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    className="flex-grow px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-white"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
                                >
                                    Start Free Trial
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Mobile: Centered content */}
                <div className="lg:hidden text-center">
                    {/* Slide Content - Centered on mobile */}
                    <div className="mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                            {slides[currentSlide].title}
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-200">
                            {slides[currentSlide].description}
                        </p>
                    </div>

                    {/* Persistent Email Form - Centered on mobile */}
                    <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                className="flex-grow px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:border-white"
                                required
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
                            >
                                Start Free Trial
                            </button>
                        </div>
                    </form>

                    {/* Slide Indicators - Centered on mobile */}
                    <div className="flex justify-center gap-2 mb-8">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? 'bg-white w-6' : 'bg-white/40'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Navigation Arrows (Always at Bottom Center) */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                <button
                    onClick={prevSlide}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    aria-label="Previous slide"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={nextSlide}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    aria-label="Next slide"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </section>
    );
};

export default Hero;