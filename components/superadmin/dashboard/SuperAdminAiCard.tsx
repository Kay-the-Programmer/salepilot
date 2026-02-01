import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../../services/api';
import ReactMarkdown from 'react-markdown';
import {
    SparklesIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    MicrophoneIcon,
    SpeakerWaveIcon,
    StopIcon,
    BoltIcon
} from '../../icons';

interface Message {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    isTyped?: boolean;
}

interface SuperAdminAiCardProps {
    userName?: string;
    platformStats?: {
        totalStores: number;
        activeStores: number;
        totalRevenue: number;
    };
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

export const SuperAdminAiCard: React.FC<SuperAdminAiCardProps> = ({ userName, platformStats }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [typingText, setTypingText] = useState('ANALYZING...');
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

    // Initialize with AI greeting
    useEffect(() => {
        if (messages.length === 0) {
            const hour = new Date().getHours();
            const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
            const name = userName ? `, ${userName}` : '';

            let summaryContext = "";
            if (platformStats) {
                summaryContext = ` Platform Status: **${platformStats.totalStores}** stores registered, **${platformStats.activeStores}** active.`;
            }

            const initialMessage: Message = {
                id: '1',
                type: 'ai',
                content: `${greeting}${name}. 🚀${summaryContext} Platform Intelligence ready. Ask me about store health, revenue trends, or growth strategies.`,
                timestamp: new Date()
            };
            setMessages([initialMessage]);
        }

        if (typeof window !== 'undefined' && window.speechSynthesis) {
            synthRef.current = window.speechSynthesis;
        }
    }, [userName, messages.length, platformStats]);

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

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        setIsTyping(true);

        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([10, 30, 10, 30, 10]);
        }

        const typingMessages = ['ANALYZING PLATFORM DATA...', 'PROCESSING STORE METRICS...', 'CALCULATING INSIGHTS...', 'GENERATING RESPONSE...'];
        let msgIdx = 0;
        const interval = setInterval(() => {
            setTypingText(typingMessages[msgIdx % typingMessages.length]);
            msgIdx++;
        }, 1500);

        try {
            // Use the superadmin-specific AI endpoint
            const result = await api.post<{ response: string }>('/superadmin/ai/chat', {
                query: userText
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
                content: "⚠️ CONNECTION ERROR. Unable to access platform intelligence. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            clearInterval(interval);
            setIsTyping(false);
            setTypingText('ANALYZING...');
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

    // Superadmin-specific suggested prompts
    const suggestedChips = [
        "Platform Overview",
        "Stores Needing Attention",
        "Revenue Trends",
        "Growth Strategies"
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

        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, '')); // Strip markdown
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
                    className="group relative flex items-center gap-2 px-5 py-3 bg-slate-900/95 text-white rounded-full shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 active:scale-95 border border-indigo-500/40 overflow-hidden backdrop-blur-md"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 animate-pulse-slow"></div>
                    <SparklesIcon className="w-5 h-5 text-indigo-400/80 relative z-10" />
                    <span className="font-bold text-sm tracking-widest uppercase relative z-10 font-mono">PLATFORM AI</span>
                    <div className="flex gap-1 relative z-10">
                        <div className="w-1.5 h-1.5 bg-emerald-500/80 rounded-full shadow-[0_0_5px_rgba(74,222,128,0.3)]"></div>
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 md:inset-auto md:bottom-6 md:right-6 w-full md:max-w-[480px] animate-slide-up-fade font-sans">
            <div className="relative bg-slate-900/98 h-full rounded-none md:h-[720px] md:rounded-3xl shadow-[0_0_60px_rgba(79,70,229,0.25)] border border-indigo-500/30 backdrop-blur-xl overflow-hidden flex flex-col transition-all duration-500">

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                {/* Header */}
                <div className="relative flex items-center justify-between px-6 py-5 bg-slate-800/60 border-b border-white/5 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <SparklesIcon className="w-5 h-5 text-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center border border-indigo-500/30">
                                <BoltIcon className="w-2.5 h-2.5 text-yellow-500/80" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-white leading-tight tracking-wide font-mono">Platform Intelligence</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500/80 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                                </span>
                                <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">SuperAdmin Mode</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white active:scale-95 border border-transparent hover:border-white/10"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900/50 relative z-10 scroll-smooth">
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
                                        : 'bg-slate-800/80 text-slate-200 border border-white/10 rounded-2xl rounded-tl-sm shadow-black/20'
                                    }
                                `}>
                                    {message.type === 'ai' ? (
                                        <div className="font-mono text-xs md:text-sm prose prose-sm max-w-none prose-p:my-1.5 prose-strong:text-indigo-300 prose-ul:pl-4 prose-a:text-indigo-400 prose-invert">
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
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mr-2">
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <button
                                            onClick={() => speakMessage(message.content)}
                                            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-indigo-400 transition-colors"
                                            title={isSpeaking ? "Stop" : "Listen"}
                                        >
                                            {isSpeaking ? <StopIcon className="w-3.5 h-3.5" /> : <SpeakerWaveIcon className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(message.content)}
                                            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-indigo-400 transition-colors"
                                            title="Copy"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
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
                                    className="px-3 py-1.5 bg-slate-800/60 border border-indigo-500/20 text-[11px] font-bold text-indigo-300 rounded-lg hover:bg-indigo-500/20 hover:text-indigo-200 hover:border-indigo-500/40 transition-all active:scale-95 font-mono uppercase tracking-wide backdrop-blur-sm shadow-sm"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    )}

                    {isTyping && (
                        <div className="flex justify-start animate-fade-in pl-1">
                            <div className="flex items-center gap-3">
                                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/80 border border-white/10">
                                    <SparklesIcon className="w-4 h-4 text-indigo-400/80 animate-pulse" />
                                </div>
                                <div className="bg-slate-800/60 border border-white/5 px-4 py-2.5 rounded-xl rounded-tl-none shadow-sm flex items-center gap-3 backdrop-blur-sm">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce duration-[1000ms]"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce duration-[1000ms] delay-150"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce duration-[1000ms] delay-300"></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-indigo-300/80 uppercase tracking-widest font-mono animate-pulse">{typingText}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-5 bg-slate-900/90 border-t border-white/5 backdrop-blur-xl relative z-20">
                    <div className="flex items-end gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-white/10 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all shadow-inner shadow-black/20">
                        <button
                            onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
                            className={`p-3 rounded-xl transition-all active:scale-90 ${isRecording
                                ? 'bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                : 'text-slate-500 hover:text-indigo-400 hover:bg-white/5'
                                }`}
                        >
                            <MicrophoneIcon className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                        </button>

                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask about platform health, stores, revenue..."
                            className="flex-1 bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-slate-600 font-medium resize-none max-h-[150px] custom-scrollbar font-mono"
                            rows={1}
                        />

                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!input.trim() || isTyping}
                            className="bg-gradient-to-br from-indigo-600 to-violet-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none transition-all"
                        >
                            <PaperAirplaneIcon className="w-4 h-4 -rotate-45 -translate-y-0.5 translate-x-0.5" />
                        </button>
                    </div>
                    {isRecording && (
                        <div className="mt-3 text-center">
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em] animate-pulse">Voice Interface Active</span>
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
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
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

export default SuperAdminAiCard;
