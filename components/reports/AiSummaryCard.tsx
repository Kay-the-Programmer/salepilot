import React, { useState } from 'react';
import { StoreSettings } from '../../types';
import { CpuChipIcon } from '../icons';
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
        return (
            <div className="fixed bottom-[72px] md:bottom-6 right-4 md:right-6 z-[45]">
                <button
                    onClick={() => setIsMinimized(false)}
                    className="group relative flex items-center gap-2.5 px-4 md:px-5 py-2.5 md:py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl text-slate-700 dark:text-white rounded-full shadow-[0_4px_16px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.12)] transition-all duration-300 hover:scale-105 active:scale-[0.96] border border-slate-200/50 dark:border-white/10"
                    aria-label="Open AI Assistant"
                >
                    <CpuChipIcon className="w-4 h-4 md:w-5 md:h-5 text-indigo-500 dark:text-indigo-400" />
                    <span className="font-medium text-xs md:text-sm">AI Assistant</span>
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                </button>
            </div>
        );
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
