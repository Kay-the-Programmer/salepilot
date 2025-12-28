// pages/LandingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <img src="/logo.svg" alt="SalePilot Logo" className="h-10 w-auto" />
                        <span className="ml-2 text-xl font-bold text-gray-800">SalePilot</span>
                    </div>
                    <nav>
                        <ul className="flex space-x-8">
                            <li><a href="#features" className="text-gray-600 hover:text-blue-600">Features</a></li>
                            <li><a href="#pricing" className="text-gray-600 hover:text-blue-600">Pricing</a></li>
                            <li><Link to="/login" className="text-gray-600 hover:text-blue-600">Login</Link></li>
                            <li><Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Start Free Trial</Link></li>
                        </ul>
                    </nav>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="py-20 px-4">
                    <div className="container mx-auto text-center">
                        <h1 className="text-5xl font-bold text-gray-900 mb-6">Manage Your Store with Confidence</h1>
                        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
                            SalePilot is a complete point of sale and inventory management solution designed for small and medium businesses.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <Link to="/register" className="px-8 py-3 bg-blue-600 text-white rounded-md text-lg font-medium hover:bg-blue-700">
                                Start Free Trial
                            </Link>
                            <a href="#demo" className="px-8 py-3 border border-gray-300 text-gray-700 rounded-md text-lg font-medium hover:bg-gray-50">
                                Watch Demo
                            </a>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center mb-16">Everything You Need to Run Your Business</h2>

                        <div className="grid md:grid-cols-3 gap-10">
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Point of Sale</h3>
                                <p className="text-gray-600">Fast and intuitive checkout process with support for multiple payment methods.</p>
                            </div>

                            {/* Add more feature cards */}
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="py-20">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center mb-16">Simple, Transparent Pricing</h2>

                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {/* Pricing cards */}
                            <div className="border border-gray-200 rounded-lg p-8">
                                <h3 className="text-xl font-bold mb-4">Starter</h3>
                                <p className="text-gray-600 mb-6">Perfect for new businesses</p>
                                <p className="text-4xl font-bold mb-6">$29<span className="text-lg text-gray-500">/month</span></p>
                                <ul className="mb-8 space-y-2">
                                    <li className="flex items-center">
                                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Up to 500 products</span>
                                    </li>
                                    {/* More features */}
                                </ul>
                                <Link to="/register?plan=starter" className="block w-full py-2 px-4 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700">
                                    Start Free Trial
                                </Link>
                            </div>

                            {/* Add more pricing cards */}
                        </div>
                    </div>
                </section>

                {/* Testimonials, FAQ, etc. */}
            </main>

            <footer className="bg-gray-800 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">SalePilot</h3>
                            <p className="text-gray-400">Your complete business management solution.</p>
                        </div>

                        {/* More footer sections */}
                    </div>
                    <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
                        <p>&copy; {new Date().getFullYear()} SalePilot. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;