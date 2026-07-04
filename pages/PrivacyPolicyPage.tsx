import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/landing/LandingPageHeader';

/**
 * Privacy Policy — styled to the Velocity design system (DESIGN.md):
 * deep-navy primary, vibrant-orange conversion accents, flat tonal cards with
 * 1px borders (no glassmorphism), soft corners and the app's Plus Jakarta Sans.
 */
const SECTIONS = [
    { n: '01', title: 'Introduction' },
    { n: '02', title: 'Information We Collect' },
    { n: '03', title: 'How We Use Your Data' },
    { n: '04', title: 'Data Sharing & Security' },
    { n: '05', title: 'Your Rights' },
    { n: '06', title: 'Device Permissions' },
];

const SectionHeading: React.FC<{ n: string; children: React.ReactNode }> = ({ n, children }) => (
    <h2 className="flex items-center gap-3 text-xl font-bold text-brand-text tracking-tight mb-4">
        <span className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold tnum">
            {n}
        </span>
        {children}
    </h2>
);

const PrivacyPolicyPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-brand-text transition-colors duration-300">
            <Header onLogin={() => navigate('/login')} onStartFree={() => navigate('/register')} />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-20">
                {/* Page heading */}
                <div className="mb-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-text-muted mb-3">
                        Last updated: May 10, 2026
                    </p>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-text">
                        Privacy Policy
                    </h1>
                    <p className="mt-3 text-brand-text-muted leading-relaxed max-w-2xl">
                        We are committed to protecting your personal information and your right to privacy.
                        This policy explains what we collect, how we use it, and the choices you have.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-surface border border-brand-border rounded-2xl shadow-sm p-6 md:p-10">
                    <div className="space-y-10 text-brand-text-muted leading-relaxed">
                        <section>
                            <SectionHeading n={SECTIONS[0].n}>{SECTIONS[0].title}</SectionHeading>
                            <p>
                                Welcome to SalePilot. We are committed to protecting your personal information and your
                                right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
                                your information when you visit our website and use our application.
                            </p>
                        </section>

                        <section>
                            <SectionHeading n={SECTIONS[1].n}>{SECTIONS[1].title}</SectionHeading>
                            <p className="mb-4">
                                We collect personal information that you voluntarily provide when you register, express
                                interest in our products and services, or otherwise contact us.
                            </p>
                            <ul className="space-y-2.5">
                                {[
                                    ['Account Data', 'Name, email address, password, and phone number.'],
                                    ['Business Data', 'Store name, address, inventory details, and sales records.'],
                                    ['Payment Data', 'Transaction history and billing information (processed securely through Lenco).'],
                                ].map(([label, desc]) => (
                                    <li key={label} className="flex gap-3">
                                        <span className="mt-2 w-1.5 h-1.5 shrink-0 rounded-full bg-secondary" />
                                        <span>
                                            <span className="font-semibold text-brand-text">{label}:</span> {desc}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <SectionHeading n={SECTIONS[2].n}>{SECTIONS[2].title}</SectionHeading>
                            <p className="mb-4">We use the personal information we collect for the business purposes described below:</p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    'To facilitate account creation and the login process.',
                                    'To send you administrative information.',
                                    'To fulfil and manage your orders.',
                                    'To post testimonials with your consent.',
                                    'To request feedback and contact you about your use of the app.',
                                    'To protect our services from fraud.',
                                ].map((item, i) => (
                                    <li
                                        key={i}
                                        className="bg-surface-variant border border-brand-border rounded-xl p-4 text-sm font-medium text-brand-text"
                                    >
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <SectionHeading n={SECTIONS[3].n}>{SECTIONS[3].title}</SectionHeading>
                            <p>
                                We only share information with your consent, to comply with laws, to provide you with our
                                services, to protect your rights, or to fulfil business obligations. We use administrative,
                                technical, and physical security measures to help protect your personal information.
                            </p>
                        </section>

                        <section>
                            <SectionHeading n={SECTIONS[4].n}>{SECTIONS[4].title}</SectionHeading>
                            <p>
                                In some regions, such as the European Economic Area (EEA), you have rights that give you
                                greater access to and control over your personal information. You may review, change, or
                                terminate your account at any time.
                            </p>
                        </section>

                        <section>
                            <SectionHeading n={SECTIONS[5].n}>{SECTIONS[5].title}</SectionHeading>
                            <p className="mb-4">To provide certain features, our application may request access to specific device functions:</p>
                            <div className="bg-surface-variant border border-brand-border rounded-xl p-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-11 h-11 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-brand-text mb-1">Camera Access</h4>
                                        <p className="text-sm">
                                            We request camera access solely to scan barcodes and capture product images for
                                            your inventory. We do not record video or capture images without your explicit
                                            action within the app.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Footer CTA */}
                        <div className="pt-8 border-t border-brand-border">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                                <div>
                                    <h4 className="font-bold text-brand-text">Still have questions?</h4>
                                    <p className="text-sm text-brand-text-muted mt-0.5">Our support team is here to help.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigate('/terms')}
                                        className="px-6 py-3 rounded-lg border border-primary text-primary bg-transparent font-semibold text-sm hover:bg-primary/5 transition-colors active:scale-[0.98]"
                                    >
                                        Terms of Service
                                    </button>
                                    <button
                                        onClick={() => navigate('/support')}
                                        className="px-6 py-3 rounded-lg bg-secondary text-white font-semibold text-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
                                    >
                                        Contact Support
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-sp-navy text-white/70 py-10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-lg font-bold tracking-tight text-white">
                        Sale<span className="text-secondary">Pilot</span>
                    </span>
                    <p className="text-sm">© {new Date().getFullYear()} SalePilot. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PrivacyPolicyPage;
