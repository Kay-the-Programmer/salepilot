import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/landing/LandingPageHeader';
import Hero from '../components/landing/Hero';
import SocialProof from '../components/landing/SocialProof';
import ValueProposition from '../components/landing/ValueProposition';
import FinalCTA from '../components/landing/FinalCTA';
import Testimonial from '../components/landing/Testimonial';
import FAQ from '../components/landing/FAQ';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate('/login');
    };

    const handleStartFree = () => {
        navigate('/register');
    };

    const handleStartTrial = (email: string) => {
        // Navigate to register with captured email state
        navigate('/register', { state: { email } });
    };

    return (
        <div className="App overflow-x-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float-delayed"></div>
            </div>

            <Header onLogin={handleLogin} onStartFree={handleStartFree} />

            <main className="relative z-10">
                <Hero onStartTrial={handleStartTrial} />
                <SocialProof />
                <ValueProposition />
                <FinalCTA onStartTrial={handleStartTrial} />
                <Testimonial />
                <FAQ />
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="text-2xl font-bold mb-4">SalePilot</div>
                            <p className="text-gray-400 text-sm">
                                Smarter selling for African businesses
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#use-cases" className="hover:text-white transition-colors">Use Cases</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4">Support</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
                        <p>© {new Date().getFullYear()} SalePilot. All rights reserved.</p>
                        <p className="mt-2 text-xs">Empowering African small and medium businesses</p>
                    </div>
                </div>
            </footer>

            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-5deg); }
        }
        
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 25s ease-in-out infinite;
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default LandingPage;
