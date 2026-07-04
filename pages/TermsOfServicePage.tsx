import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/landing/LandingPageHeader';

/**
 * Terms of Service — styled to the Velocity design system (DESIGN.md):
 * deep-navy primary, vibrant-orange conversion accents, flat tonal cards with
 * 1px borders (no glassmorphism), soft corners and the app's Plus Jakarta Sans.
 */

/** Brand-styled bullet list (orange dots), matching the Privacy page. */
const Bullets: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
    <ul className="space-y-2.5">
        {items.map((item, i) => (
            <li key={i} className="flex gap-3">
                <span className="mt-2 w-1.5 h-1.5 shrink-0 rounded-full bg-secondary" />
                <span>{item}</span>
            </li>
        ))}
    </ul>
);

const Term: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="font-semibold text-brand-text">{children}</span>
);

const SECTIONS: { n: string; title: string; body: React.ReactNode }[] = [
    {
        n: '01', title: 'Acceptance of Terms',
        body: (
            <p>
                These Terms of Service ("Terms") govern your access to and use of SalePilot, including our website,
                applications, and related services (collectively, the "Service"). By creating an account or using the
                Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
            </p>
        ),
    },
    {
        n: '02', title: 'The Service',
        body: (
            <p>
                SalePilot provides point-of-sale, inventory, customer relationship management, and related business
                tools for merchants. We may add, change, or remove features over time. The free core is offered at no
                cost; certain premium modules and add-ons are available for a fee as described in the app.
            </p>
        ),
    },
    {
        n: '03', title: 'Accounts & Responsibilities',
        body: (
            <div className="space-y-4">
                <p>You are responsible for your account, the accuracy of the information you provide, and all activity that occurs under it.</p>
                <Bullets items={[
                    <><Term>Security:</Term> Keep your password confidential and notify us of any unauthorized use.</>,
                    <><Term>Eligibility:</Term> You must be legally able to enter into these Terms and operate a business in your jurisdiction.</>,
                    <><Term>Your data:</Term> You retain ownership of the business and customer data you put into the Service.</>,
                ]} />
            </div>
        ),
    },
    {
        n: '04', title: 'Acceptable Use',
        body: (
            <p>
                You agree not to misuse the Service: no unlawful activity, no infringement of others' rights, no attempts
                to disrupt or reverse-engineer the platform, and no use that violates the rights of your own customers.
                We may suspend accounts that pose a security, legal, or abuse risk.
            </p>
        ),
    },
    {
        n: '05', title: 'WhatsApp & Customer Messaging',
        body: (
            <div className="space-y-4">
                <p>
                    SalePilot offers optional messaging features, including integration with the WhatsApp Business
                    Platform. When you connect and use messaging, you agree to:
                </p>
                <Bullets items={[
                    'Obtain the necessary consent from recipients before messaging them.',
                    "Comply with the WhatsApp Business Messaging Policy, Meta's platform terms, and all applicable anti-spam and data-protection laws.",
                    'Use the messaging tools only to communicate with your own customers for legitimate business purposes.',
                ]} />
                <p>You are solely responsible for the content of the messages you send and for honoring opt-out requests.</p>
            </div>
        ),
    },
    {
        n: '06', title: 'Subscriptions & Payments',
        body: (
            <p>
                Paid plans and add-on modules are billed in advance on a recurring basis through our payment partner
                (Lenco) unless otherwise stated. Fees are non-refundable except where required by law. You can manage or
                cancel paid features from your subscription settings; cancellation takes effect at the end of the current
                billing period. Premium features may be revoked if a payment fails after applicable retries.
            </p>
        ),
    },
    {
        n: '07', title: 'Intellectual Property',
        body: (
            <p>
                The Service, including its software, design, and branding, is owned by SalePilot and protected by
                intellectual-property laws. We grant you a limited, non-exclusive, non-transferable right to use the
                Service in accordance with these Terms. These Terms do not transfer any of our intellectual property to you.
            </p>
        ),
    },
    {
        n: '08', title: 'Disclaimers & Limitation of Liability',
        body: (
            <p>
                The Service is provided "as is" without warranties of any kind. To the maximum extent permitted by law,
                SalePilot is not liable for indirect, incidental, or consequential damages, or for loss of profits, data,
                or goodwill arising from your use of the Service. Nothing in these Terms limits liability that cannot be
                limited under applicable law.
            </p>
        ),
    },
    {
        n: '09', title: 'Termination & Changes',
        body: (
            <p>
                You may stop using the Service at any time. We may suspend or terminate access if you breach these Terms
                or where required by law. We may update these Terms from time to time; material changes will be reflected
                by the "Last Updated" date above, and continued use after changes constitutes acceptance.
            </p>
        ),
    },
];

const TermsOfServicePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-brand-text transition-colors duration-300">
            <Header onLogin={() => navigate('/login')} onStartFree={() => navigate('/register')} />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-20">
                {/* Page heading */}
                <div className="mb-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-text-muted mb-3">
                        Last updated: June 23, 2026
                    </p>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-text">
                        Terms of Service
                    </h1>
                    <p className="mt-3 text-brand-text-muted leading-relaxed max-w-2xl">
                        The terms below govern your use of SalePilot. Please read them carefully — using the Service
                        means you accept them.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-surface border border-brand-border rounded-2xl shadow-sm p-6 md:p-10">
                    <div className="space-y-10 text-brand-text-muted leading-relaxed">
                        {SECTIONS.map(s => (
                            <section key={s.n}>
                                <h2 className="flex items-center gap-3 text-xl font-bold text-brand-text tracking-tight mb-4">
                                    <span className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold tnum">
                                        {s.n}
                                    </span>
                                    {s.title}
                                </h2>
                                {s.body}
                            </section>
                        ))}

                        {/* Footer CTA */}
                        <div className="pt-8 border-t border-brand-border">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                                <div>
                                    <h4 className="font-bold text-brand-text">Questions about these terms?</h4>
                                    <p className="text-sm text-brand-text-muted mt-0.5">Read our Privacy Policy or reach out to us.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigate('/privacy')}
                                        className="px-6 py-3 rounded-lg border border-primary text-primary bg-transparent font-semibold text-sm hover:bg-primary/5 transition-colors active:scale-[0.98]"
                                    >
                                        Privacy Policy
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

export default TermsOfServicePage;
