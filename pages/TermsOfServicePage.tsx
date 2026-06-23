import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/landing/LandingPageHeader';

const SECTIONS: { n: string; tint: string; title: string; body: React.ReactNode }[] = [
    {
        n: '01', tint: 'blue', title: 'Acceptance of Terms',
        body: (
            <p>
                These Terms of Service ("Terms") govern your access to and use of SalePilot, including our website,
                applications, and related services (collectively, the "Service"). By creating an account or using the
                Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
            </p>
        ),
    },
    {
        n: '02', tint: 'indigo', title: 'The Service',
        body: (
            <p>
                SalePilot provides point-of-sale, inventory, customer relationship management, and related business
                tools for merchants. We may add, change, or remove features over time. The free core is offered at no
                cost; certain premium modules and add-ons are available for a fee as described in the app.
            </p>
        ),
    },
    {
        n: '03', tint: 'purple', title: 'Accounts & Responsibilities',
        body: (
            <div className="space-y-4">
                <p>You are responsible for your account, the accuracy of the information you provide, and all activity that occurs under it.</p>
                <ul className="list-disc pl-6 space-y-2 font-medium">
                    <li><span className="text-slate-900 dark:text-white">Security:</span> Keep your password confidential and notify us of any unauthorized use.</li>
                    <li><span className="text-slate-900 dark:text-white">Eligibility:</span> You must be legally able to enter into these Terms and operate a business in your jurisdiction.</li>
                    <li><span className="text-slate-900 dark:text-white">Your data:</span> You retain ownership of the business and customer data you put into the Service.</li>
                </ul>
            </div>
        ),
    },
    {
        n: '04', tint: 'green', title: 'Acceptable Use',
        body: (
            <p>
                You agree not to misuse the Service: no unlawful activity, no infringement of others' rights, no attempts
                to disrupt or reverse-engineer the platform, and no use that violates the rights of your own customers.
                We may suspend accounts that pose a security, legal, or abuse risk.
            </p>
        ),
    },
    {
        n: '05', tint: 'emerald', title: 'WhatsApp & Customer Messaging',
        body: (
            <div className="space-y-4">
                <p>
                    SalePilot offers optional messaging features, including integration with the WhatsApp Business
                    Platform. When you connect and use messaging, you agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 font-medium">
                    <li>Obtain the necessary consent from recipients before messaging them.</li>
                    <li>Comply with the WhatsApp Business Messaging Policy, Meta's platform terms, and all applicable anti-spam and data-protection laws.</li>
                    <li>Use the messaging tools only to communicate with your own customers for legitimate business purposes.</li>
                </ul>
                <p>You are solely responsible for the content of the messages you send and for honoring opt-out requests.</p>
            </div>
        ),
    },
    {
        n: '06', tint: 'orange', title: 'Subscriptions & Payments',
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
        n: '07', tint: 'rose', title: 'Intellectual Property',
        body: (
            <p>
                The Service, including its software, design, and branding, is owned by SalePilot and protected by
                intellectual-property laws. We grant you a limited, non-exclusive, non-transferable right to use the
                Service in accordance with these Terms. These Terms do not transfer any of our intellectual property to you.
            </p>
        ),
    },
    {
        n: '08', tint: 'amber', title: 'Disclaimers & Limitation of Liability',
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
        n: '09', tint: 'slate', title: 'Termination & Changes',
        body: (
            <p>
                You may stop using the Service at any time. We may suspend or terminate access if you breach these Terms
                or where required by law. We may update these Terms from time to time; material changes will be reflected
                by the "Last Updated" date above, and continued use after changes constitutes acceptance.
            </p>
        ),
    },
];

const TINT: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600',
};

const TermsOfServicePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-google transition-colors duration-500">
            <Header onLogin={() => navigate('/login')} onStartFree={() => navigate('/register')} />

            <main className="max-w-4xl mx-auto px-4 py-24 relative z-10">
                <div className="liquid-glass-card rounded-[2.5rem] bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl border border-white dark:border-slate-800/50 p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="mb-12 text-center">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
                            Terms of Service
                        </h1>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Last Updated: June 23, 2026
                        </p>
                    </div>

                    <div className="space-y-12 text-slate-700 dark:text-slate-300 leading-relaxed">
                        {SECTIONS.map(s => (
                            <section key={s.n}>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${TINT[s.tint]}`}>{s.n}</span>
                                    {s.title}
                                </h2>
                                {s.body}
                            </section>
                        ))}

                        <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">Questions about these terms?</h4>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Read our Privacy Policy or contact us.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigate('/privacy')}
                                        className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl font-black uppercase tracking-widest text-xs hover:translate-y-[-2px] transition-all shadow-xl active:scale-95"
                                    >
                                        Privacy Policy
                                    </button>
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

export default TermsOfServicePage;
