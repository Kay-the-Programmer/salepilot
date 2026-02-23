import React, { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

// Import your business images
import retailshop from '../../assets/retail-shop.png';
import supermarket from '../../assets/mini-mart.png';
import pharmacy from '../../assets/pharmacy.png';
import restaurant from '../../assets/resturant.png';
import boutique from '../../assets/boutique.png';
import hardware from '../../assets/hardware.png';

const SocialProof: React.FC = () => {
    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    const [displayedText, setDisplayedText] = useState('');
    const [textIndex, setTextIndex] = useState(0);
    const [currentBusinessIndex, setCurrentBusinessIndex] = useState(0);
    const animationRef = useRef<NodeJS.Timeout | null>(null);

    const fullText = "Salepilot is a smart, point of sale software";

    const businessTypes = [
        {
            title: 'Retail Shops',
            image: retailshop,
            description: 'Manage daily sales and inventory with ease',
            color: 'from-blue-500/10 to-blue-600/5'
        },
        {
            title: 'Supermarkets',
            image: supermarket,
            description: 'Streamline checkout and stock management',
            color: 'from-green-500/10 to-green-600/5'
        },
        {
            title: 'Pharmacies',
            image: pharmacy,
            description: 'Track medicines and prescriptions efficiently',
            color: 'from-purple-500/10 to-purple-600/5'
        },
        {
            title: 'Restaurants',
            image: restaurant,
            description: 'Handle orders and tables seamlessly',
            color: 'from-orange-500/10 to-orange-600/5'
        },
        {
            title: 'Boutiques',
            image: boutique,
            description: 'Manage fashion inventory and sales',
            color: 'from-pink-500/10 to-pink-600/5'
        },
        {
            title: 'Hardware Stores',
            image: hardware,
            description: 'Track tools and construction materials',
            color: 'from-amber-500/10 to-amber-600/5'
        }
    ];

    // Sine wave animation for the main text
    useEffect(() => {
        if (inView) {
            if (textIndex < fullText.length) {
                animationRef.current = setTimeout(() => {
                    setDisplayedText(prev => prev + fullText.charAt(textIndex));
                    setTextIndex(prev => prev + 1);
                }, 50);
            }
        }

        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
    }, [inView, textIndex, fullText]);

    // Auto-rotate business cards
    useEffect(() => {
        if (inView) {
            const interval = setInterval(() => {
                setCurrentBusinessIndex(prev => (prev + 1) % businessTypes.length);
            }, 4000);

            return () => clearInterval(interval);
        }
    }, [inView, businessTypes.length]);

    const handleDotClick = (index: number) => {
        setCurrentBusinessIndex(index);
    };

    const goToPrev = () => {
        setCurrentBusinessIndex(prev => (prev - 1 + businessTypes.length) % businessTypes.length);
    };

    const goToNext = () => {
        setCurrentBusinessIndex(prev => (prev + 1) % businessTypes.length);
    };

    // Calculate dynamic styles for the carousel
    const getCardStyle = (index: number) => {
        const length = businessTypes.length;
        // Calculate offset ensuring correct wrapping behavior
        let offset = (index - currentBusinessIndex + length) % length;

        // Adjust for valid range centered around 0 (-1, 0, 1)
        // If offset > length / 2, it means it should be on the left side wrapped around
        if (offset > length / 2) offset -= length;

        // Base styles
        let style: React.CSSProperties = {
            transition: 'all 500ms ease-out',
            position: 'absolute',
            top: 0,
            bottom: 0,
        };

        if (offset === 0) {
            // Center - Active
            return { ...style, left: '25%', width: '50%', transform: 'scale(1)', zIndex: 20, opacity: 1 };
        } else if (offset === -1) {
            // Left - Previous
            return { ...style, left: '0%', width: '45%', transform: 'scale(0.85)', zIndex: 10, opacity: 0.7 };
        } else if (offset === 1) {
            // Right - Next
            return { ...style, left: '55%', width: '45%', transform: 'scale(0.85)', zIndex: 10, opacity: 0.7 };
        } else {
            // Hidden
            return { ...style, left: '50%', width: '45%', transform: 'scale(0.5) translateX(-50%)', zIndex: 0, opacity: 0, pointerEvents: 'none' as React.CSSProperties['pointerEvents'] };
        }
    };

    return (
        <section ref={ref} className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Sine-wave animated text */}
                <div className="mb-12">
                    <div className="relative">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight min-h-[120px] md:min-h-[100px]">
                            {displayedText}
                            <span className="inline-block w-1 h-8 bg-[#008060] ml-1 animate-pulse"></span>
                        </h2>

                        {/* Sine wave visualization */}
                        <div className="hidden md:block absolute -bottom-6 left-0 right-0 h-4 overflow-hidden opacity-20">
                            <svg width="100%" height="20" className="text-[#008060]">
                                <path
                                    d={`M0,10 Q${textIndex * 3},5 ${textIndex * 6},10 T${textIndex * 12},10`}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="transition-all duration-300"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Trusted by text */}
                    <div className={`mt-8 transition-all duration-700 delay-500 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}>
                        <p className="text-lg text-gray-600 font-medium">
                            Trusted by growing businesses
                        </p>
                    </div>
                </div>

                {/* Business Types Carousel - Desktop Version */}
                <div className="hidden lg:block">
                    <div className="relative h-[400px] overflow-hidden">
                        <div className="absolute inset-0 w-full h-full">
                            {businessTypes.map((business, index) => {
                                const style = getCardStyle(index);
                                // Determine if this card is clickable (prev/next)
                                const offset = (index - currentBusinessIndex + businessTypes.length) % businessTypes.length;
                                const isPrev = offset === businessTypes.length - 1;
                                const isNext = offset === 1;
                                const clickHandler = isPrev ? goToPrev : isNext ? goToNext : undefined;

                                return (
                                    <div
                                        key={index}
                                        className={`rounded-2xl overflow-hidden shadow-xl ${clickHandler ? 'cursor-pointer hover:opacity-100' : ''}`}
                                        style={style}
                                        onClick={clickHandler}
                                    >
                                        <div className="relative h-full w-full">
                                            <img
                                                src={business.image}
                                                alt={business.title}
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Overlays */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                            {/* Content */}
                                            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                                                <h3 className="text-2xl font-bold mb-2">{business.title}</h3>
                                                <p className="text-white/90 text-sm opacity-0 hover:opacity-100 transition-opacity duration-300">
                                                    {business.description}
                                                </p>
                                            </div>

                                            {offset === 0 && (
                                                <div className="absolute top-6 right-6">
                                                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Fade Effects on Edges */}
                        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent pointer-events-none z-30" />
                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent pointer-events-none z-30" />

                        {/* Navigation Controls */}
                        <div className="absolute top-1/2 left-4 right-4 transform -translate-y-1/2 flex justify-between pointer-events-none z-40">
                            <button
                                onClick={goToPrev}
                                className="pointer-events-auto w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-xl transition-all shadow-lg active:scale-95 transition-all duration-300"
                                aria-label="Previous business"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={goToNext}
                                className="pointer-events-auto w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-xl transition-all shadow-lg active:scale-95 transition-all duration-300"
                                aria-label="Next business"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Navigation Dots */}
                    <div className="flex justify-center gap-3 mt-12">
                        {businessTypes.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => handleDotClick(index)}
                                className={`transition-all duration-300 ${index === currentBusinessIndex
                                    ? 'w-12 h-2 bg-[#008060] rounded-full'
                                    : 'w-2 h-2 bg-gray-300 rounded-full hover:bg-gray-400'
                                    }`}
                                aria-label={`Show ${businessTypes[index].title}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Mobile Version - Full Width */}
                <div className="lg:hidden mt-12 -mx-4 sm:mx-0">
                    <div className="relative overflow-hidden bg-white">
                        {/* Cards Container */}
                        <div className="relative h-80 sm:h-96">
                            {businessTypes.map((business, index) => (
                                <div
                                    key={index}
                                    className={`absolute inset-0 transition-all duration-500 ease-in-out ${index === currentBusinessIndex
                                        ? 'opacity-100 translate-x-0'
                                        : index < currentBusinessIndex
                                            ? 'opacity-0 -translate-x-full'
                                            : 'opacity-0 translate-x-full'
                                        }`}
                                >
                                    <div className="relative h-full w-full">
                                        <img
                                            src={business.image}
                                            alt={business.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/30" />
                                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                                            <h3 className="text-white font-bold text-2xl mb-1">
                                                {business.title}
                                            </h3>
                                            <p className="text-white/90 text-sm">
                                                {business.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Navigation Dots */}
                        <div className="flex justify-center gap-2 mt-4 pb-4">
                            {businessTypes.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleDotClick(index)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentBusinessIndex
                                        ? 'w-6 bg-[#008060]'
                                        : 'bg-gray-300 hover:bg-gray-400'
                                        }`}
                                    aria-label={`Show ${businessTypes[index].title}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats Banner */}
                <div className={`mt-12 grid grid-cols-2 md:grid-cols-3 gap-6 transition-all duration-700 delay-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}>
                    <div className="text-center p-4">
                        <div className="text-2xl font-bold text-[#008060] mb-1">100+</div>
                        <div className="text-sm text-gray-600">Businesses Onboarded</div>
                    </div>
                    <div className="text-center p-4">
                        <div className="text-2xl font-bold text-[#008060] mb-1">24/7</div>
                        <div className="text-sm text-gray-600">Offline-First Reliability</div>
                    </div>
                    <div className="text-center p-4 md:col-span-1 col-span-2">
                        <div className="text-2xl font-bold text-[#008060] mb-1">80%</div>
                        <div className="text-sm text-gray-600">Lower Costs</div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SocialProof;