import React, { useState, useRef, useEffect } from 'react';
import { StoreSettings } from '../../types';
import { api } from '../../services/api'; // Added import for backend API
import ReactMarkdown from 'react-markdown';
import {
    SparklesIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    MicrophoneIcon,
    SpeakerWaveIcon,
    StopIcon
} from '../icons';
import { formatCurrency } from '../../utils/currency';

interface Message {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    isTyped?: boolean;
}


interface AiSummaryCardProps {
    reportData: any;
    storeSettings: StoreSettings;
    userName?: string;
}

const TypingMarkdown: React.FC<{ content: string; speed?: number; onComplete?: () => void }> = ({ content, speed = 8, onComplete }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index < content.length) {
            const timeout = setTimeout(() => {
                setDisplayedContent(prev => prev + content[index]);
                setIndex(prev => prev + 1);
            }, speed);
            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [index, content, speed, onComplete]);

    return <ReactMarkdown>{displayedContent}</ReactMarkdown>;
};

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({ reportData, storeSettings, userName }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [typingText, setTypingText] = useState('Thinking...');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
        }
    }, [input]);

    // Initialize with AI greeting and data summary
    useEffect(() => {
        if (messages.length === 0) {
            const hour = new Date().getHours();
            const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
            const name = userName ? `, ${userName}` : '';

            // Build a short summary based on reportData
            let summaryContext = "";
            if (reportData?.sales) {
                const revenue = formatCurrency(reportData.sales.totalRevenue, storeSettings);
                const transactions = reportData.sales.totalTransactions;
                summaryContext = ` I've analyzed your current data: you've reached **${revenue}** in revenue across **${transactions}** transactions for this period.`;
            }

            const initialMessage: Message = {
                id: '1',
                type: 'ai',
                content: `${greeting}${name}!✨${summaryContext} How can I help you optimize your business today?`,
                timestamp: new Date()
            };
            setMessages([initialMessage]);
        }

        if (typeof window !== 'undefined' && window.speechSynthesis) {
            synthRef.current = window.speechSynthesis;
        }
    }, [userName, messages.length, reportData, storeSettings]);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSendMessage = async (textOverride?: string) => {
        const userText = textOverride || input.trim();
        if (!userText || isTyping) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: userText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // Reset height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        setIsTyping(true);

        // Vibrate phone if supported
        if ('vibrate' in navigator) {
            navigator.vibrate([10, 30, 10, 30, 10]);
        }

        // Cycle through typing messages for "advanced" feel
        const typingMessages = ['Analyzing sales data...', 'Checking inventory levels...', 'Identifying patterns...', 'Formulating strategy...'];
        let msgIdx = 0;
        const interval = setInterval(() => {
            setTypingText(typingMessages[msgIdx % typingMessages.length]);
            msgIdx++;
        }, 1500);

        try {
            // Enhanced AI request with context
            const result = await api.post<{ response: string }>('/ai/chat', {
                query: userText,
                context: {
                    reportData: reportData,
                    userName: userName,
                    currentDate: new Date().toISOString(),
                    currency: storeSettings.currency
                }

            });

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: result.response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: "I'm having trouble accessing your business data right now. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            clearInterval(interval);
            setIsTyping(false);
            setTypingText('Thinking...');
        }
    };

    const handleTypingComplete = (id: string) => {
        setMessages(prev => prev.map(msg =>
            msg.id === id ? { ...msg, isTyped: true } : msg
        ));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast here
    };

    const suggestedChips = [
        "How can I increase sales?",
        "Any low stock items?",
        "Who are my best customers?",
        "Summarize this report"
    ];

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

    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => setIsMinimized(false)}
                    className="group flex items-center gap-2 px-5 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 hover:scale-105 active:scale-95 border border-indigo-500/50"
                >
                    <SparklesIcon className="w-5 h-5 animate-pulse" />
                    <span className="font-bold text-sm tracking-tight">AI Advisor</span>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-40 w-full max-w-[420px] animate-fade-in-up">
            <div className="bg-white dark:bg-slate-900/95 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-200 dark:border-slate-700/50 backdrop-blur-xl overflow-hidden flex flex-col h-[650px] transition-all duration-500">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800/50 bg-white/90 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <SparklesIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-gray-900 dark:text-white leading-tight">AI Advisor</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active Intelligence</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all text-gray-400 hover:text-gray-900 dark:hover:text-white active:scale-90"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-transparent">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} group/msg`}
                        >
                            <div className={`flex flex-col max-w-[85%] ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`
                                    px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-all
                                    ${message.type === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-white dark:bg-slate-800/80 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-slate-700/50 rounded-tl-none'
                                    }
                                `}>
                                    {message.type === 'ai' ? (
                                        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400 prose-ul:pl-4 prose-li:my-1">
                                            {/* Only type out if it's an AI message that hasn't been typed yet */}
                                            {message.type === 'ai' && !message.isTyped ? (
                                                <TypingMarkdown
                                                    content={message.content}
                                                    onComplete={() => handleTypingComplete(message.id)}
                                                />
                                            ) : (
                                                <ReactMarkdown>{message.content}</ReactMarkdown>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                    )}
                                </div>

                                {/* Message Actions */}
                                {message.type === 'ai' && (
                                    <div className="flex items-center gap-3 mt-2 px-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => speakMessage(message.content)}
                                            className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                            title={isSpeaking ? "Stop" : "Listen"}
                                        >
                                            {isSpeaking ? <StopIcon className="w-3.5 h-3.5" /> : <SpeakerWaveIcon className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(message.content)}
                                            className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                            title="Copy"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V17.25m19.125 0V12.75A1.125 1.125 0 0022.5 11.625h-1.5m1.5 0h-5.625c-.621 0-1.125.504-1.125 1.125v5.625c0 .621.504 1.125 1.125 1.125h1.5m1.5 0h1.125c.621 0 1.125-.504 1.125-1.125V11.125M3.375 11.125h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5m0-1.5c0-.621.504-1.125 1.125-1.125h1.5m1.5 0h5.625c.621 0 1.125.504 1.125 1.125v1.5m0-1.5c0-.621.504-1.125-1.125-1.125h-1.5" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Suggested Chips */}
                    {messages.length < 5 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {suggestedChips.map((chip, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSendMessage(chip)}
                                    className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-[11px] font-bold text-gray-600 dark:text-gray-400 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all active:scale-95"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    )}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="flex items-start gap-3 animate-shake">
                                <div className="bg-white/80 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/50 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{typingText}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-5 bg-white dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-700/50">
                    <div className="flex items-end gap-2 bg-gray-50 dark:bg-slate-900/50 p-2 rounded-[20px] border border-gray-200 dark:border-slate-700 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-all">
                        <button
                            onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
                            className={`p-2.5 rounded-2xl transition-all active:scale-90 mb-0.5 ${isRecording
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                                }`}
                        >
                            <MicrophoneIcon className="w-5 h-5" />
                        </button>

                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask about your business..."
                            className="flex-1 bg-transparent px-2 py-2 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium resize-none max-h-[150px] custom-scrollbar"
                            rows={1}
                        />

                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!input.trim() || isTyping}
                            className="bg-indigo-600 dark:bg-indigo-500 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all mb-0.5"
                        >
                            <PaperAirplaneIcon className="w-5 h-5 -rotate-45 -translate-y-0.5 translate-x-0.5" />
                        </button>
                    </div>
                    {isRecording && (
                        <div className="mt-2 text-center">
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest animate-pulse">Listening...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
