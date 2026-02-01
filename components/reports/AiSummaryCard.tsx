import React, { useState, useRef, useEffect } from 'react';
import { StoreSettings } from '../../types';
import { api } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import {
    SparklesIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    MicrophoneIcon,
    SpeakerWaveIcon,
    StopIcon,
    BoltIcon
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

const TypingMarkdown: React.FC<{ content: string; speed?: number; onComplete?: () => void }> = ({ content, speed = 10, onComplete }) => {
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
    const [typingText, setTypingText] = useState('PROCESSING...');
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
                summaryContext = ` System Status: ONLINE. Analyzed **${transactions}** transactions. Total Revenue: **${revenue}**.`;
            }

            const initialMessage: Message = {
                id: '1',
                type: 'ai',
                content: `${greeting}${name}. ${summaryContext} Ready for instructions.`,
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
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([10, 30, 10, 30, 10]);
        }

        // Cycle through typing messages for "advanced" feel
        const typingMessages = ['ANALYZING DATA STREAM...', 'OPTIMIZING PARAMETERS...', 'CALCULATING PROBABILITIES...', 'GENERATING RESPONSE...'];
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
                content: "CONNECTION INTERRUPTED. UNABLE TO ACCESS DATA STREAM.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            clearInterval(interval);
            setIsTyping(false);
            setTypingText('PROCESSING...');
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
    };

    const suggestedChips = [
        "Increase Sales",
        "Stock Analysis",
        "Top Customers",
        "Report Summary"
    ];

    const startVoiceRecognition = () => {
        if (typeof window === 'undefined') return;

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
            <div className="fixed bottom-6 right-6 z-[80]">
                <button
                    onClick={() => setIsMinimized(false)}
                    className="group relative flex items-center gap-2 px-5 py-3 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white rounded-full shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 active:scale-95 border border-indigo-500/30 overflow-hidden backdrop-blur-md"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 animate-pulse-slow"></div>
                    <SparklesIcon className="w-5 h-5 animate-pulse text-indigo-600 dark:text-indigo-400 relative z-10" />
                    <span className="font-bold text-sm tracking-widest uppercase relative z-10 font-mono">AI CORE</span>
                    <div className="flex gap-1 relative z-10">
                        <div className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full animate-blink shadow-[0_0_8px_rgba(34,197,94,0.8)] dark:shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[90] md:inset-auto md:bottom-6 md:right-6 w-full md:max-w-[450px] animate-slide-up-fade font-sans">
            <div className="relative bg-white/95 dark:bg-slate-900/95 h-full rounded-none md:h-[700px] md:rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.15)] border border-slate-200 dark:border-white/10 backdrop-blur-xl overflow-hidden flex flex-col transition-all duration-500">

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/5 dark:bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>

                {/* Header */}
                <div className="relative flex items-center justify-between px-6 py-5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-white/5 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/20 transition-all">
                                <SparklesIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10">
                                <BoltIcon className="w-2.5 h-2.5 text-yellow-500 dark:text-yellow-400 animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-slate-800 dark:text-white leading-tight tracking-wide font-mono">Ai Assistant</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-2 hover:bg-slate-200/50 dark:hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-white active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/0 relative z-10 scroll-smooth">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} group/msg`}
                        >
                            <div className={`flex flex-col max-w-[85%] ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`
                                    relative px-5 py-4 text-sm leading-relaxed shadow-lg transition-all backdrop-blur-sm
                                    ${message.type === 'user'
                                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm border border-indigo-500 shadow-indigo-500/20'
                                        : 'bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-2xl rounded-tl-sm shadow-sm dark:shadow-black/20'
                                    }
                                `}>
                                    {message.type === 'ai' ? (
                                        <div className="font-mono text-xs md:text-sm prose prose-sm max-w-none prose-p:my-1.5 prose-strong:text-indigo-600 dark:prose-strong:text-indigo-300 prose-ul:pl-4 prose-a:text-indigo-500 dark:prose-a:text-indigo-400 dark:prose-invert">
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
                                        <p className="whitespace-pre-wrap font-medium">{message.content}</p>
                                    )}
                                </div>

                                {/* Message Actions */}
                                {message.type === 'ai' && (
                                    <div className="flex items-center gap-2 mt-2 px-1 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-300">
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono mr-2">
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <button
                                            onClick={() => speakMessage(message.content)}
                                            className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                            title={isSpeaking ? "Stop" : "Listen"}
                                        >
                                            {isSpeaking ? <StopIcon className="w-3.5 h-3.5" /> : <SpeakerWaveIcon className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(message.content)}
                                            className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                            title="Copy"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V17.25m19.125 0V12.75A1.125 1.125 0 0022.5 11.625h-1.5m1.5 0h-5.625c-.621 0-1.125.504-1.125 1.125v5.625c0 .621.504 1.125 1.125 1.125h1.5m1.5 0h1.125c.621 0 1.125-.504 1.125-1.125V11.125M3.375 11.125h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5m0-1.5c0-.621.504-1.125-1.125-1.125h1.5m1.5 0h5.625c.621 0 1.125.504 1.125 1.125v1.5m0-1.5c0-.621.504-1.125-1.125-1.125h-1.5" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Suggested Chips */}
                    {messages.length < 5 && (
                        <div className="flex flex-wrap gap-2 pt-4 px-2">
                            {suggestedChips.map((chip, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSendMessage(chip)}
                                    className="px-3 py-1.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 text-[11px] font-bold text-slate-500 dark:text-slate-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all active:scale-95 font-mono uppercase tracking-wide backdrop-blur-sm shadow-sm"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    )}

                    {isTyping && (
                        <div className="flex justify-start animate-fade-in pl-1">
                            <div className="flex items-center gap-3">
                                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
                                    <SparklesIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400/80 animate-pulse" />
                                </div>
                                <div className="bg-white/80 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-xl rounded-tl-none shadow-sm flex items-center gap-3 backdrop-blur-sm">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce duration-[1000ms]"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce duration-[1000ms] delay-150"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce duration-[1000ms] delay-300"></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-indigo-500/80 dark:text-indigo-300/80 uppercase tracking-widest font-mono animate-pulse">{typingText}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-5 bg-white/90 dark:bg-slate-900/80 border-t border-slate-200 dark:border-white/5 backdrop-blur-xl relative z-20">
                    <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-950/50 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 focus-within:border-indigo-400/50 dark:focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all shadow-inner dark:shadow-black/20">
                        <button
                            onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
                            className={`p-3 rounded-xl transition-all active:scale-90 ${isRecording
                                ? 'bg-red-500/10 dark:bg-red-500/20 text-red-500 dark:text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                : 'text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-white/5'
                                }`}
                        >
                            <MicrophoneIcon className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                        </button>

                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Input command..."
                            className="flex-1 bg-transparent px-2 py-3 text-sm text-slate-800 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium resize-none max-h-[150px] custom-scrollbar font-mono"
                            rows={1}
                        />

                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!input.trim() || isTyping}
                            className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-violet-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none transition-all"
                        >
                            <PaperAirplaneIcon className="w-4 h-4 -rotate-45 -translate-y-0.5 translate-x-0.5" />
                        </button>
                    </div>
                    {isRecording && (
                        <div className="mt-3 text-center">
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] animate-pulse">Voice Interface Active</span>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 10px;
                }
                :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.3);
                }
                :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.8); }
                }
                .animate-blink {
                    animation: blink 2s infinite ease-in-out;
                }
                .animate-pulse-slow {
                    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes slide-up-fade {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up-fade {
                    animation: slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
};
