
import React, { useMemo } from 'react';
import { StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { SparklesIcon, XMarkIcon } from '../icons';

interface AiSummaryCardProps {
    reportData: any;
    storeSettings: StoreSettings;
    userName?: string;
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({ reportData, storeSettings, userName }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const summary = useMemo(() => {
        if (!reportData?.sales) return null;

        const { totalRevenue, totalTransactions, topProductsByRevenue, grossMargin } = reportData.sales;
        const topProduct = topProductsByRevenue?.[0];

        // Time of day greeting
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        const name = userName ? `, ${userName}` : '';

        // Congratulatory logic
        let title = `${greeting}${name}!`;
        let message = '';
        let tone = 'neutral';

        if (totalRevenue > 0) {
            if (grossMargin > 30) {
                title = `Outstanding Performance${name}! 🎉`;
                message = `You're crushing it! Your store generated **${formatCurrency(totalRevenue, storeSettings)}** with a healthy **${grossMargin.toFixed(1)}% margin**. `;
                tone = 'success';
            } else {
                title = `Great progress${name}! 🚀`;
                message = `You've clocked **${formatCurrency(totalRevenue, storeSettings)}** in sales across **${totalTransactions} transactions**. `;
                tone = 'good';
            }

            if (topProduct) {
                message += `Your top performer is **${topProduct.name}**, contributing significantly to your bottom line. Keep stocking it!`;
            }
        } else {
            const invStats = reportData.inventory || {};
            const custStats = reportData.customers || {};

            title = `${greeting}${name}. Ready to sell?`;

            if (invStats.totalUnits === 0) {
                message = "Your dashboard is quiet because you haven't added any products yet. **Add your first product** to start tracking inventory and making sales!";
            } else if (custStats.totalSuppliers === 0) {
                message = "Great job adding products! Now, **add your first supplier** to manage your inventory sources and purchase orders.";
            } else if (custStats.totalCustomers === 0) {
                message = "You're almost there! **Add your first customer** or process a walk-in sale to see your reports come to life.";
            } else {
                message = "Everything is set up! Your dashboard is quiet today. Check your marketing campaigns or start processing sales to see your growth.";
            }
            tone = 'quiet';
        }

        return { title, message, tone };
    }, [reportData, storeSettings, userName]);

    if (!summary) return null;



    // Minimized View (Floating Button)
    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-40 animate-fade-in-up">
                <button
                    onClick={() => setIsOpen(true)}
                    className={`group flex items-center gap-2 px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${summary.tone === 'quiet'
                        ? 'bg-white text-indigo-600 border border-indigo-100'
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                        }`}
                >
                    <div className={`p-1 rounded-full ${summary.tone === 'quiet' ? 'bg-indigo-50' : 'bg-white/20'}`}>
                        <SparklesIcon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm pr-1">AI Insights</span>

                    {/* Pulsing content indicator/notification dot if urgent/good news */}
                    {summary.tone !== 'quiet' && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                        </span>
                    )}
                </button>
            </div>
        );
    }

    // Expanded View (Modal)
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <div className={`relative w-full max-w-lg overflow-hidden rounded-3xl shadow-2xl animate-scale-in flex flex-col max-h-[90vh]
                ${summary.tone === 'success' ? 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white' :
                    summary.tone === 'good' ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white' :
                        'bg-white border border-gray-200 text-gray-800'}`}>

                {/* Background Decorations - Fixed position to stay behind scrolling content */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-black opacity-5 blur-3xl pointer-events-none"></div>

                {/* Close Button - Absolute to the container */}
                <button
                    onClick={() => setIsOpen(false)}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-30
                        ${summary.tone === 'quiet' ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-white/20 text-white/80 hover:text-white'}`}
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="relative z-10 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                    {/* Header with Icon */}
                    <div className="flex items-start gap-4 mb-6 pr-8">
                        <div className={`p-3 rounded-2xl flex-shrink-0 ${summary.tone === 'quiet' ? 'bg-indigo-50 text-indigo-600' : 'bg-white/20 text-white backdrop-blur-md'}`}>
                            <SparklesIcon className="w-8 h-8" />
                        </div>
                        <div className="flex-1 pt-1">
                            <div className={`text-sm font-medium mb-1 ${summary.tone === 'quiet' ? 'text-indigo-600' : 'text-blue-100'}`}>
                                AI Performance Summary
                            </div>
                            <h2 className={`text-xl md:text-2xl font-bold leading-tight ${summary.tone === 'quiet' ? 'text-gray-900' : 'text-white'}`}>
                                {summary.title}
                            </h2>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`prose prose-lg max-w-none mb-6 ${summary.tone === 'quiet' ? 'text-gray-600' : 'text-blue-50'}`}>
                        <p dangerouslySetInnerHTML={{
                            __html: summary.message.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold opacity-100">$1</span>')
                        }} />
                    </div>

                    {/* Footer / Action */}
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={() => setIsOpen(false)}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all w-full md:w-auto
                                ${summary.tone === 'quiet'
                                    ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-200'
                                    : 'bg-white text-indigo-600 hover:bg-blue-50 shadow-lg shadow-indigo-900/20'}`}
                        >
                            Got it, thanks!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
