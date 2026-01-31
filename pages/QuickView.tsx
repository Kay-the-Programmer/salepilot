import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { SparklesIcon, ChartBarIcon, CubeIcon, SearchIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import ReactMarkdown from 'react-markdown';

interface QuickViewProps {
    user: User | null;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const TypingMarkdown: React.FC<{ content: string; speed?: number }> = ({ content, speed = 10 }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index < content.length) {
            const timeout = setTimeout(() => {
                setDisplayedContent(prev => prev + content[index]);
                setIndex(prev => prev + 1);
            }, speed);
            return () => clearTimeout(timeout);
        }
    }, [index, content, speed]);

    return <ReactMarkdown>{displayedContent}</ReactMarkdown>;
};

const QuickView: React.FC<QuickViewProps> = ({ user }) => {
    const [aiQuery, setAiQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isChatMode, setIsChatMode] = useState(false);
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isChatMode]);

    const handleAiSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiQuery.trim()) return;

        const currentQuery = aiQuery;
        setAiQuery(''); // Clear input immediately for better UX
        setIsChatMode(true); // Enter focused mode
        setIsTyping(true);

        // Add user message
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: currentQuery,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);

        // Vibrate phone if supported
        if ('vibrate' in navigator) {
            navigator.vibrate([15, 30, 15]);
        }

        try {
            const result = await api.post<{ response: string }>('/ai/chat', { query: currentQuery });

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Sorry, I'm having trouble connecting to the business database right now. Please try again later.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
            // Re-focus input after sending
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleChipClick = (query: string) => {
        setAiQuery(query);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const chipCategories = [
        {
            category: 'Sales',
            color: 'bg-emerald-400',
            chips: [
                { label: 'Today\'s Sales', query: 'How are sales today?' },
                { label: 'Top Products', query: 'What are my best-selling products?' },
                { label: 'Weekly Trends', query: 'Show me sales trends this week' },
            ]
        },
        {
            category: 'Insights',
            color: 'bg-indigo-400',
            chips: [
                { label: 'Low Stock', query: 'Which products need reordering?' },
                { label: 'Profit Margins', query: 'What\'s my profit margin?' },
                { label: 'Best Customers', query: 'Who are my best customers?' },
            ]
        },
        {
            category: 'Strategy',
            color: 'bg-purple-400',
            chips: [
                { label: 'Improve Profit', query: 'How can I improve my profit margins?' },
                { label: 'Analyze Retention', query: 'What is my customer retention rate and how do I improve it?' },
                { label: 'Find Dead Stock', query: 'Do I have any dead stock I should clear out?' },
            ]
        }
    ];

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 relative overflow-hidden transition-colors duration-500">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

            {/* Header - Always visible but minimal in chat mode */}
            <div className={`flex-shrink-0 px-6 py-4 md:px-8 transition-all duration-300 ${isChatMode ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800' : ''}`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg shadow-sm">
                        <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Quick View</h1>
                        {!isChatMode && <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI Business Intelligence</p>}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">

                {/* Default View (Hidden in Chat Mode) */}
                <div className={`absolute inset-0 overflow-y-auto custom-scrollbar transition-opacity duration-500 ease-in-out ${isChatMode ? 'opacity-0 pointer-events-none z-0' : 'opacity-100 z-10'}`}>
                    <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col items-center justify-center min-h-[80%]">

                        {/* Welcome Text */}
                        <div className="text-center mb-10 space-y-3 animate-fade-in-up">
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">{user?.name?.split(' ')[0] || 'Partner'}</span>
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto font-light">
                                I'm ready to analyze your business data. What would you like to know today?
                            </p>
                        </div>

                        {/* AI Search Component */}
                        <div className="w-full max-w-3xl mb-16 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <div className="relative group">
                                {/* Enhanced gradient glow with animation */}
                                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full opacity-20 dark:opacity-40 group-hover:opacity-30 dark:group-hover:opacity-50 blur-xl transition-all duration-500 group-focus-within:opacity-40 dark:group-focus-within:opacity-60 group-focus-within:blur-2xl group-focus-within:scale-105"></div>
                                <div glass-effect="" className="relative bg-gradient-to-br from-white to-gray-50/80 dark:from-slate-800 dark:to-slate-900/80 rounded-3xl shadow-xl border border-gray-200/50 dark:border-slate-700/50 backdrop-blur-sm flex items-center p-2.5 transition-all duration-300 group-hover:shadow-2xl group-hover:border-indigo-100 dark:group-hover:border-indigo-900/50 group-focus-within:border-indigo-200 dark:group-focus-within:border-indigo-800">
                                    <div className="pl-4 pr-3 text-indigo-400 dark:text-indigo-300 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">
                                        <SearchIcon className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={aiQuery}
                                        onChange={(e) => setAiQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAiSubmit(e)}
                                        placeholder="Ask about sales trends, inventory status, or customer insights..."
                                        className="flex-1 pl-2 py-4 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-gray-400/70 dark:placeholder-gray-500/70 text-lg rounded-3xl focus:outline-none"
                                        aria-label="AI Assistant Search"
                                    />
                                    <button
                                        onClick={handleAiSubmit}
                                        disabled={!aiQuery.trim()}
                                        className="ml-2 p-3.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-2xl hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 active:scale-95 group-focus-within:ring-2 group-focus-within:ring-indigo-200 dark:group-focus-within:ring-indigo-800"
                                        aria-label="Submit query"
                                    >
                                        <SparklesIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Enhanced Suggestion Chips with category grouping */}
                            <div className="mt-10">
                                <p className="text-center text-gray-500 dark:text-gray-400 text-sm font-medium mb-4 tracking-wide">
                                    Try asking about:
                                </p>
                                <div className="flex flex-wrap justify-center gap-3">
                                    {chipCategories.flatMap(c => c.chips).slice(0, 6).map((chip, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleChipClick(chip.query)}
                                            className="group relative px-5 py-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-gradient-to-r hover:from-indigo-50/80 hover:to-violet-50/80 dark:hover:from-indigo-900/30 dark:hover:to-violet-900/30 text-gray-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium rounded-full transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-indigo-100 dark:hover:shadow-indigo-900/50 active:scale-95"
                                        >
                                            <span className="relative z-10">{chip.label}</span>
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/0 to-violet-500/0 group-hover:from-indigo-500/5 group-hover:to-violet-500/5 dark:group-hover:from-indigo-500/10 dark:group-hover:to-violet-500/10 transition-all duration-300"></div>
                                        </button>
                                    ))}
                                </div>

                                {/* Category indicators */}
                                <div className="mt-6 flex justify-center gap-6">
                                    {chipCategories.map((category, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${category.color}`}></div>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{category.category}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <div
                                onClick={() => navigate('/sales')}
                                className="group bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-500/10 transition-all cursor-pointer hover:shadow-md"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                                        <ChartBarIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">Sales Dashboard</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">View performance metrics</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => navigate('/inventory')}
                                className="group bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-500/10 transition-all cursor-pointer hover:shadow-md"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                                        <CubeIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">Inventory</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage stock & products</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Mode View */}
                <div className={`flex-1 flex flex-col min-h-0 transition-opacity duration-500 ${isChatMode ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {/* Intro message for chat context */}
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 px-5 py-3 rounded-2xl rounded-tl-sm text-sm shadow-sm max-w-[85%]">
                                    I'm ready to help. You can ask me about your sales performance, inventory levels, or customer insights.
                                </div>
                            </div>

                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                                    <div className={`
                                        max-w-[85%] px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed
                                        ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                                            : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-100 rounded-tl-sm'}
                                    `}>
                                        {msg.role === 'assistant' ? (
                                            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold">
                                                {/* Only type out the very last message if it's new */}
                                                {messages.indexOf(msg) === messages.length - 1 ? (
                                                    <TypingMarkdown content={msg.content} />
                                                ) : (
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start animate-fade-in">
                                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-3 animate-shake">
                                        <div className="flex gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Analyzing business data...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Chat Input Area */}
                    <div className="flex-shrink-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-gray-200/60 dark:border-slate-800/60 z-30">
                        <div className="max-w-3xl mx-auto relative">
                            {/* Reset Chat Button */}
                            <button
                                onClick={() => {
                                    setIsChatMode(false);
                                    setMessages([]);
                                }}
                                className="absolute -top-12 left-0 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline transition-colors bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded"
                            >
                                ← Back to Overview
                            </button>

                            <form onSubmit={handleAiSubmit} className="relative flex items-center gap-2">
                                <div className="relative flex-1">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={aiQuery}
                                        onChange={(e) => setAiQuery(e.target.value)}
                                        placeholder="Ask a follow-up question..."
                                        className="w-full pl-5 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!aiQuery.trim() || isTyping}
                                    className="p-3.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex-shrink-0"
                                >
                                    {isTyping ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform -rotate-45 translate-x-0.5">
                                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                        </svg>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default QuickView;

