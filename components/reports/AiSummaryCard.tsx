import React, { useState, useRef, useEffect } from 'react';
import { StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import {
    SparklesIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    MicrophoneIcon,
    SpeakerWaveIcon,
    StopIcon
} from '../icons';

interface Message {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

interface AiSummaryCardProps {
    reportData: any;
    storeSettings: StoreSettings;
    userName?: string;
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({ reportData, storeSettings, userName }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    // Initialize with AI greeting
    useEffect(() => {
        if (messages.length === 0) {
            const hour = new Date().getHours();
            const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
            const name = userName ? `, ${userName}` : '';

            const initialMessage: Message = {
                id: '1',
                type: 'ai',
                content: `${greeting}${name}! I'm your AI assistant. Ask me about your sales, products, inventory, or get business advice.`,
                timestamp: new Date()
            };
            setMessages([initialMessage]);
        }

        // Initialize speech synthesis
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            synthRef.current = window.speechSynthesis;
        }
    }, [userName, messages.length]);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const generateAIResponse = (userMessage: string): string => {
        const lowerMessage = userMessage.toLowerCase();

        if (!reportData?.sales) {
            return "No sales data available yet. Make your first sale to see insights!";
        }

        const { totalRevenue, totalTransactions, topProductsByRevenue, grossMargin } = reportData.sales;

        // Revenue queries
        if (lowerMessage.includes('revenue') || lowerMessage.includes('sales') || lowerMessage.includes('made')) {
            return `Total revenue: ${formatCurrency(totalRevenue, storeSettings)} from ${totalTransactions} transactions. ${grossMargin > 30 ? "Excellent " + grossMargin.toFixed(1) + "% margin! 🎉" : "Margin: " + grossMargin.toFixed(1) + "%"}`;
        }

        // Top products
        if (lowerMessage.includes('top') || lowerMessage.includes('best') || lowerMessage.includes('product')) {
            const topProduct = topProductsByRevenue?.[0];
            if (topProduct) {
                return `Top product: "${topProduct.name}" with ${formatCurrency(topProduct.revenue, storeSettings)} in revenue.`;
            }
            return "No product data available.";
        }

        // Margin/profit queries
        if (lowerMessage.includes('margin') || lowerMessage.includes('profit')) {
            return `Current gross margin: ${grossMargin.toFixed(1)}%. ${grossMargin > 40 ? "Outstanding!" : grossMargin > 30 ? "Solid performance." : "Consider reviewing pricing."}`;
        }

        // Inventory queries
        if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
            const invStats = reportData.inventory || {};
            if (invStats.totalUnits) {
                return `${invStats.totalUnits} units in stock, valued at ${formatCurrency(invStats.totalValue, storeSettings)}. ${invStats.lowStockCount > 0 ? `⚠️ ${invStats.lowStockCount} items low on stock.` : "Stock levels good."}`;
            }
            return "Add products to track inventory.";
        }

        // Customer queries
        if (lowerMessage.includes('customer')) {
            const custStats = reportData.customers || {};
            return `${custStats.totalCustomers || 0} customers registered.`;
        }

        // Improvement/advice
        if (lowerMessage.includes('improve') || lowerMessage.includes('advice') || lowerMessage.includes('suggestion')) {
            const tips = [
                `Focus on increasing average order value with ${totalTransactions} transactions.`,
                `Keep top products well-stocked to maximize revenue.`,
                `Run promotions on slow-moving inventory.`,
                grossMargin < 30 ? "Consider reviewing pricing strategy." : "Maintain pricing discipline."
            ];
            return tips[Math.floor(Math.random() * tips.length)];
        }

        // Default response
        return `I can help with sales, revenue, products, margins, inventory, and customers. What would you like to know?`;
    };

    const handleSendMessage = () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // Simulate AI thinking delay
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: generateAIResponse(input.trim()),
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
        }, 400);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const startVoiceRecognition = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice recognition not supported.');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onstart = () => setIsRecording(true);
        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            setIsRecording(false);
        };
        recognitionRef.current.onerror = () => setIsRecording(false);
        recognitionRef.current.onend = () => setIsRecording(false);
        recognitionRef.current.start();
    };

    const stopVoiceRecognition = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    const speakMessage = (text: string) => {
        if (!synthRef.current) return;

        if (isSpeaking) {
            synthRef.current.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        synthRef.current.speak(utterance);
    };

    // Minimized floating button
    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => setIsMinimized(false)}
                    className="group flex items-center gap-2 px-4 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                    <SparklesIcon className="w-4 h-4" />
                    <span className="font-medium text-sm">AI Assistant</span>
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                </button>
            </div>
        );
    }

    // Full chat interface - Minimalistic design
    return (
        <div className="fixed bottom-6 right-6 z-40 w-full max-w-md">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col" style={{ height: '600px' }}>

                {/* Header - Simplified */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                            <SparklesIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">AI Assistant</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Messages Container - Clean design */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-slate-900">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex items-start gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Simple Avatar */}
                                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${message.type === 'ai'
                                    ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                                    : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                                    }`}>
                                    {message.type === 'ai' ? '✨' : (userName?.[0]?.toUpperCase() || 'U')}
                                </div>

                                {/* Message Bubble - Minimal */}
                                <div className="flex flex-col gap-1">
                                    <div className={`px-3 py-2 rounded-lg ${message.type === 'user'
                                        ? 'bg-indigo-600 dark:bg-indigo-500 text-white'
                                        : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700'
                                        }`}>
                                        <p className="text-sm leading-relaxed">{message.content}</p>
                                    </div>

                                    {/* Voice playback - Minimal */}
                                    {message.type === 'ai' && (
                                        <button
                                            onClick={() => speakMessage(message.content)}
                                            className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors self-start"
                                            title={isSpeaking ? "Stop" : "Listen"}
                                        >
                                            {isSpeaking ? (
                                                <StopIcon className="w-3 h-3" />
                                            ) : (
                                                <SpeakerWaveIcon className="w-3 h-3" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area - Clean */}
                <div className="p-3 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
                    {isRecording && (
                        <div className="mb-2 flex items-center gap-2 text-xs text-red-500 px-1">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                            <span>Listening...</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {/* Voice Input Button - Minimal */}
                        <button
                            onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
                            className={`flex-shrink-0 p-2 rounded-lg transition-all ${isRecording
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                                }`}
                            title="Voice input"
                        >
                            {isRecording ? (
                                <StopIcon className="w-4 h-4" />
                            ) : (
                                <MicrophoneIcon className="w-4 h-4" />
                            )}
                        </button>

                        {/* Text Input - Minimal */}
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask anything..."
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none text-sm transition-all"
                        />

                        {/* Send Button - Minimal */}
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim()}
                            className="flex-shrink-0 p-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
                            title="Send message"
                        >
                            <PaperAirplaneIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
