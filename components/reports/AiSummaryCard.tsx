import React, { useState, useRef, useEffect } from 'react';
import { StoreSettings } from '../../types';
import { api } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    CpuChipIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    MicrophoneIcon,
    SpeakerWaveIcon,
    StopIcon,
    TrashIcon
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

/**
 * Parses <REPORT_DATA> tags and converts the enclosed JSON into a markdown table.
 */
const formatReportDataAsMarkdown = (text: string): string => {
    if (!text.includes('<REPORT_DATA>')) return text;

    return text.replace(/<REPORT_DATA>([\s\S]*?)<\/REPORT_DATA>/g, (match, jsonStr) => {
        try {
            const data = JSON.parse(jsonStr.trim());
            if (!data.headers || !data.rows) return "";

            let markdown = `\n\n### ${data.title || 'Report'}\n\n`;

            // Header
            markdown += `| ${data.headers.join(' | ')} |\n`;
            // Separator
            markdown += `| ${data.headers.map(() => '---').join(' | ')} |\n`;
            // Rows
            data.rows.forEach((row: any[]) => {
                markdown += `| ${row.join(' | ')} |\n`;
            });

            return markdown + "\n";
        } catch (e) {
            console.error("Failed to parse <REPORT_DATA>:", e);
            return "";
        }
    });
};

// Typing effect that reveals content in chunks
const TypingMarkdown: React.FC<{ content: string; speed?: number; onComplete?: () => void }> = ({ content, speed = 6, onComplete }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index < content.length) {
            const timeout = setTimeout(() => {
                const chunkSize = Math.min(3, content.length - index);
                setDisplayedContent(prev => prev + content.slice(index, index + chunkSize));
                setIndex(prev => prev + chunkSize);
            }, speed);
            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [index, content, speed, onComplete]);

    return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {displayedContent}
        </ReactMarkdown>
    );
};

// Clean markdown rendering — Gemini-style
const markdownComponents = {
    h1: ({ children, ...props }: any) => (
        <h3 className="text-[15px] font-semibold text-slate-800 dark:text-white mt-4 mb-2 first:mt-0" {...props}>{children}</h3>
    ),
    h2: ({ children, ...props }: any) => (
        <h4 className="text-[14px] font-semibold text-slate-700 dark:text-slate-200 mt-3.5 mb-1.5 first:mt-0" {...props}>{children}</h4>
    ),
    h3: ({ children, ...props }: any) => (
        <h5 className="text-[13px] font-semibold text-slate-600 dark:text-slate-300 mt-3 mb-1 first:mt-0" {...props}>{children}</h5>
    ),
    p: ({ children, ...props }: any) => (
        <p className="text-[13.5px] leading-[1.7] text-slate-700 dark:text-slate-300 my-2" {...props}>{children}</p>
    ),
    strong: ({ children, ...props }: any) => (
        <strong className="font-semibold text-slate-800 dark:text-white" {...props}>{children}</strong>
    ),
    em: ({ children, ...props }: any) => (
        <em className="text-slate-500 dark:text-slate-400" {...props}>{children}</em>
    ),
    ul: ({ children, ...props }: any) => (
        <ul className="my-2 pl-1 space-y-1.5" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }: any) => (
        <ol className="my-2 pl-5 space-y-1.5 list-decimal marker:text-slate-400 dark:marker:text-slate-500" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }: any) => (
        <li className="text-[13.5px] leading-[1.6] text-slate-700 dark:text-slate-300 pl-1 flex gap-2 items-start">
            <span className="text-indigo-400 dark:text-indigo-500 mt-[7px] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-current"></span>
            <span>{children}</span>
        </li>
    ),
    table: ({ children, ...props }: any) => (
        <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
            <table className="w-full text-[12.5px]" {...props}>{children}</table>
        </div>
    ),
    thead: ({ children, ...props }: any) => (
        <thead className="bg-slate-50 dark:bg-slate-800/50" {...props}>{children}</thead>
    ),
    th: ({ children, ...props }: any) => (
        <th className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/10 text-[12px] uppercase tracking-wide" {...props}>{children}</th>
    ),
    td: ({ children, ...props }: any) => (
        <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-white/5" {...props}>{children}</td>
    ),
    tr: ({ children, ...props }: any) => (
        <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors active:scale-95 transition-all duration-300" {...props}>{children}</tr>
    ),
    blockquote: ({ children, ...props }: any) => (
        <blockquote className="my-2.5 pl-3 border-l-2 border-indigo-300 dark:border-indigo-500/50 text-slate-500 dark:text-slate-400 italic text-[13px]" {...props}>{children}</blockquote>
    ),
    code: ({ children, className, ...props }: any) => {
        const isInline = !className;
        if (isInline) {
            return <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-[12px] font-mono" {...props}>{children}</code>;
        }
        return <code className="block my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[12px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto border border-slate-200/50 dark:border-white/5" {...props}>{children}</code>;
    },
    hr: (props: any) => (
        <hr className="my-3 border-slate-100 dark:border-white/5" {...props} />
    ),
};

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({ reportData, storeSettings, userName }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    }, [input]);

    // Initialize with greeting
    useEffect(() => {
        if (messages.length === 0) {
            const hour = new Date().getHours();
            const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
            const name = userName ? `, ${userName}` : '';

            let summaryContext = "";
            if (reportData?.sales) {
                const revenue = formatCurrency(reportData.sales.totalRevenue, storeSettings);
                const transactions = reportData.sales.totalTransactions;
                summaryContext = `\n\nI've analyzed **${transactions}** transactions with a total revenue of **${revenue}**. How can I help you today?`;
            } else {
                summaryContext = "\n\nHow can I help you today?";
            }

            const initialMessage: Message = {
                id: '1',
                type: 'ai',
                content: `${greeting}${name}! 👋${summaryContext}`,
                timestamp: new Date()
            };
            setMessages([initialMessage]);
        }

        if (typeof window !== 'undefined' && window.speechSynthesis) {
            synthRef.current = window.speechSynthesis;
        }
    }, [userName, messages.length, reportData, storeSettings]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Build conversation history for context
    const buildHistory = () => {
        return messages.slice(-10).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));
    };

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
            navigator.vibrate(10);
        }

        try {
            const result = await api.post<{ response: string }>('/ai/chat', {
                query: userText,
                context: {
                    reportData: reportData,
                    userName: userName,
                    currentDate: new Date().toISOString(),
                    currency: storeSettings.currency
                },
                history: buildHistory()
            });

            // Strip thinking tags — we don't show reasoning to the user
            const rawResponse = result.response;
            let cleanContent = rawResponse.replace(/<THINKING>[\s\S]*?<\/THINKING>/, '').trim();

            // Format any report data tags into markdown tables
            cleanContent = formatReportDataAsMarkdown(cleanContent);

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: cleanContent,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: "Sorry, I wasn't able to process that request. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
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

    const handleClearChat = () => {
        setMessages([]);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const suggestedChips = [
        { label: "Sales Trends", emoji: "📈" },
        { label: "Stock Alert", emoji: "📦" },
        { label: "Customer Insights", emoji: "👥" },
        { label: "Full Report", emoji: "📊" },
        { label: "Growth Tips", emoji: "💡" },
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

    // === MINIMIZED FAB ===
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

    // === FULL CHAT PANEL — Gemini-style ===
    return (
        <div className="fixed inset-0 z-[60] md:inset-auto md:bottom-6 md:right-6 w-full md:max-w-[460px] animate-slide-up-fade">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[24px] relative h-full md:h-[700px] md:max-h-[calc(100vh-6rem)] shadow-[0_16px_40px_rgb(0,0,0,0.16)] border border-slate-200/50 dark:border-white/[0.06] overflow-hidden flex flex-col">

                {/* ─── Header ─── */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.04]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center">
                            <CpuChipIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-[14px] text-slate-800 dark:text-white leading-tight">AI Assistant</h3>
                            <span className="text-[11px] text-emerald-500 dark:text-emerald-400 font-medium">Online</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                        {messages.length > 1 && (
                            <button
                                onClick={handleClearChat}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 active:scale-95 transition-all duration-300"
                                title="New chat"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white active:scale-95 transition-all duration-300"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ─── Messages ─── */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 custom-scrollbar scroll-smooth">
                    {messages.map((message) => (
                        <div key={message.id} className="group/msg">
                            {message.type === 'user' ? (
                                /* ── User message: right-aligned pill ── */
                                <div className="flex justify-end">
                                    <div className="max-w-[80%] bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-br-md text-[13.5px] leading-relaxed shadow-sm">
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                </div>
                            ) : (
                                /* ── AI message: Gemini-style flowing text ── */
                                <div className="flex gap-3 items-start">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                        <CpuChipIcon className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="ai-content">
                                            {!message.isTyped ? (
                                                <TypingMarkdown
                                                    content={message.content}
                                                    onComplete={() => handleTypingComplete(message.id)}
                                                />
                                            ) : (
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={markdownComponents}
                                                >
                                                    {message.content}
                                                </ReactMarkdown>
                                            )}
                                        </div>

                                        {/* Action buttons — appear on hover */}
                                        {message.isTyped && (
                                            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={() => speakMessage(message.content)}
                                                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors active:scale-95 transition-all duration-300"
                                                    title={isSpeaking ? "Stop" : "Listen"}
                                                >
                                                    {isSpeaking ? <StopIcon className="w-3.5 h-3.5" /> : <SpeakerWaveIcon className="w-3.5 h-3.5" />}
                                                </button>
                                                <button
                                                    onClick={() => copyToClipboard(message.content)}
                                                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors active:scale-95 transition-all duration-300"
                                                    title="Copy"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                                    </svg>
                                                </button>
                                                <span className="text-[10px] text-slate-400 ml-1">
                                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* ─── Suggested Chips ─── */}
                    {messages.length <= 3 && !isTyping && (
                        <div className="flex flex-wrap gap-2 pt-1 pl-10">
                            {suggestedChips.map((chip, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSendMessage(chip.label)}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-[12.5px] font-medium text-slate-600 dark:text-slate-400 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all active:scale-95"
                                >
                                    <span className="text-sm">{chip.emoji}</span>
                                    <span>{chip.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ─── Typing Indicator ─── */}
                    {isTyping && (
                        <div className="flex gap-3 items-start animate-fade-in">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <CpuChipIcon className="w-3.5 h-3.5 text-white animate-pulse" />
                            </div>
                            <div className="flex items-center gap-2 pt-1.5">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="text-[12px] text-slate-400 dark:text-slate-500">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* ─── Input Area ─── */}
                <div className="px-4 pb-4 pt-2 bg-transparent">
                    {isRecording && (
                        <div className="mb-2 text-center">
                            <span className="text-[11px] font-medium text-red-500 animate-pulse inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                Listening...
                            </span>
                        </div>
                    )}
                    <div className="flex items-end gap-2 bg-slate-50 dark:bg-white/[0.03] p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] focus-within:border-indigo-300 dark:focus-within:border-indigo-500/30 transition-all">
                        <button
                            onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
                            className={`p-2.5 rounded-xl transition-all active:scale-90 flex-shrink-0 ${isRecording
                                ? 'bg-red-50 dark:bg-red-500/10 text-red-500'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-white/5'
                                }`}
                        >
                            <MicrophoneIcon className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
                        </button>

                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask about your business..."
                            className="flex-1 bg-transparent px-1 py-2.5 text-[14px] text-slate-800 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none max-h-[120px] custom-scrollbar leading-relaxed"
                            rows={1}
                        />

                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!input.trim() || isTyping}
                            className="p-2.5 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-sm disabled:opacity-25 disabled:hover:bg-indigo-600 transition-all active:scale-95 flex-shrink-0"
                        >
                            <PaperAirplaneIcon className="w-4 h-4 -rotate-45 -translate-y-0.5 translate-x-0.5" />
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                }
                :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.06);
                }
                @keyframes slide-up-fade {
                    from { transform: translateY(12px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up-fade {
                    animation: slide-up-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.25s ease-out;
                }
            `}</style>
        </div>
    );
};
