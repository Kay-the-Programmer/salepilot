
import React, { useMemo } from 'react';
import { StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface AiSummaryCardProps {
    reportData: any;
    storeSettings: StoreSettings;
    userName?: string;
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({ reportData, storeSettings, userName }) => {

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
            title = `${greeting}${name}. Ready to sell?`;
            message = "Your dashboard is quiet today. Add some new products or check your marketing campaigns to kickstart sales!";
            tone = 'quiet';
        }

        return { title, message, tone };
    }, [reportData, storeSettings, userName]);

    if (!summary) return null;

    return (
        <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg mb-6 transition-all duration-500
            ${summary.tone === 'success' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white' :
                summary.tone === 'good' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                    'bg-white border border-gray-200 text-gray-800'}`}>

            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-white opacity-10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-black opacity-5 blur-2xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                    <h2 className={`text-2xl font-bold mb-2 ${summary.tone === 'quiet' ? 'text-gray-900' : 'text-white'}`}>
                        {summary.title}
                    </h2>
                    <div className={`prose prose-sm max-w-none ${summary.tone === 'quiet' ? 'text-gray-600' : 'text-blue-50'}`}>
                        <p dangerouslySetInnerHTML={{
                            __html: summary.message.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold opacity-100">$1</span>')
                        }} />
                    </div>
                </div>

                {summary.tone !== 'quiet' && (
                    <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center justify-center">
                        {/* Simple visual indicator based on tone */}
                        <div className="text-3xl">
                            {summary.tone === 'success' ? '🏆' : '📈'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
