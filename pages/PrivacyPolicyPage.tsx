import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/landing/LandingPageHeader';

const PrivacyPolicyPage: React.FC = () => {
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate('/login');
    };

    const handleStartFree = () => {
        navigate('/register');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-google transition-colors duration-500">
            <Header onLogin={handleLogin} onStartFree={handleStartFree} />

            <main className="max-w-4xl mx-auto px-4 py-24 relative z-10">
                <div className="liquid-glass-card rounded-[2.5rem] bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl border border-white dark:border-slate-800/50 p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="mb-12 text-center">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                            Privacy Policy
                        </h1>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Last Updated: May 10, 2026
                        </p>
                    </div>

                    <div className="space-y-12 text-slate-700 dark:text-slate-300 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-sm">01</span>
                                Introduction
                            </h2>
                            <p>
                                Welcome to SalePilot. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our application.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-sm">02</span>
                                Information We Collect
                            </h2>
                            <div className="space-y-4">
                                <p>We collect personal information that you voluntarily provide to us when you register on the application, express an interest in obtaining information about us or our products and services, or otherwise when you contact us.</p>
                                <ul className="list-disc pl-6 space-y-2 font-medium">
                                    <li><span className="text-slate-900 dark:text-white">Account Data:</span> Name, email address, password, and phone number.</li>
                                    <li><span className="text-slate-900 dark:text-white">Business Data:</span> Store name, address, inventory details, and sales records.</li>
                                    <li><span className="text-slate-900 dark:text-white">Payment Data:</span> Transaction history and billing information (processed securely through Lenco).</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 text-sm">03</span>
                                How We Use Your Data
                            </h2>
                            <p className="mb-4">We use personal information collected via our application for a variety of business purposes described below:</p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    'To facilitate account creation and logon process.',
                                    'To send administrative information to you.',
                                    'To fulfill and manage your orders.',
                                    'To post testimonials with your consent.',
                                    'To request feedback and contact you about use of our App.',
                                    'To protect our Services from fraud.'
                                ].map((item, i) => (
                                    <li key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-semibold">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 text-sm">04</span>
                                Data Sharing & Security
                            </h2>
                            <p>
                                We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We use administrative, technical, and physical security measures to help protect your personal information.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 text-sm">05</span>
                                Your Rights
                            </h2>
                            <p>
                                In some regions, such as the European Economic Area (EEA), you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 text-sm">06</span>
                                Device Permissions
                            </h2>
                            <div className="space-y-4">
                                <p>To provide certain features, our application may request access to specific device functions:</p>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                                            <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white mb-1">Camera Access</h4>
                                            <p className="text-sm">We request camera access solely for the purpose of scanning barcodes and capturing product images for your inventory. We do not record video or capture images without your explicit action within the app.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">Still have questions?</h4>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Our support team is here to help.</p>
                                </div>
                                <button 
                                    onClick={() => navigate('/support')}
                                    className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:translate-y-[-2px] transition-all shadow-xl active:scale-95"
                                >
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-slate-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                        © {new Date().getFullYear()} SalePilot. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default PrivacyPolicyPage;
