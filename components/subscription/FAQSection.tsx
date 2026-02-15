import React, { memo, useState } from 'react';

const FAQ_ITEMS = [
    {
        q: `Can I switch plans at any time?`,
        a: `Yes! You can upgrade or downgrade your plan whenever you want. Changes take effect immediately, and we'll prorate any remaining balance.`,
    },
    {
        q: `Is my payment information secure?`,
        a: `Absolutely. All payments are processed through Lenco's PCI-DSS Level 1 certified infrastructure. We never store your card details on our servers.`,
    },
    {
        q: `What happens when my trial ends?`,
        a: `You'll be notified before your trial expires. If you don't subscribe, your account switches to read-only mode — no data is lost. You can subscribe at any time to regain full access.`,
    },
    {
        q: `Do you offer refunds?`,
        a: `We offer a 14-day money-back guarantee on all plans. If you're not satisfied, contact our support team for a full refund — no questions asked.`,
    },
];

const FAQItem = memo(({ item }: { item: typeof FAQ_ITEMS[number] }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-slate-200 dark:border-slate-800 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
            >
                <span className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.q}
                </span>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100 mb-6' : 'max-h-0 opacity-0'
                    }`}
            >
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {item.a}
                </p>
            </div>
        </div>
    );
});

FAQItem.displayName = 'FAQItem';

const FAQSection: React.FC = memo(() => {
    return (
        <div className="max-w-2xl mx-auto mt-24">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
                Frequently Asked Questions
            </h3>
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 px-6 sm:px-8">
                {FAQ_ITEMS.map((item, index) => (
                    <FAQItem key={index} item={item} />
                ))}
            </div>
        </div>
    );
});

FAQSection.displayName = 'FAQSection';

export default FAQSection;
