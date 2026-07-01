import React, { useState } from 'react';
import { StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { AiChat } from '../ai/AiChat';

interface AiSummaryCardProps {
    reportData: any;
    storeSettings: StoreSettings;
    userName?: string;
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({ reportData, storeSettings, userName }) => {
    const [isMinimized, setIsMinimized] = useState(true);

    let summaryContext = "";
    if (reportData?.sales) {
        const revenue = formatCurrency(reportData.sales.totalRevenue, storeSettings);
        const transactions = reportData.sales.totalTransactions;
        summaryContext = `I've analyzed **${transactions}** transactions with a total revenue of **${revenue}**. How can I help you today?`;
    }

    if (isMinimized) {
        // The floating "AI Assistant" launcher is intentionally hidden — the global
        // feedback button now occupies the bottom-right corner. The chat panel below
        // stays available for when the assistant is opened programmatically, and the
        // launcher can be restored by rendering the button here again.
        return null;
    }

    return (
        <div className="fixed inset-0 z-[60] md:inset-auto md:bottom-6 md:right-6 w-full md:max-w-[460px] animate-slide-up-fade">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[24px] relative h-full md:h-[700px] md:max-h-[calc(100vh-6rem)] shadow-[0_16px_40px_rgb(0,0,0,0.16)] border border-slate-200/50 dark:border-white/[0.06] overflow-hidden flex flex-col">
                <AiChat
                    userName={userName}
                    contextData={{
                        reportData,
                        userName,
                        currentDate: new Date().toISOString(),
                        currency: storeSettings.currency
                    }}
                    onClose={() => setIsMinimized(true)}
                    isFullScreen={false}
                    initialGreetingContext={summaryContext}
                />
            </div>
        </div>
    );
};
