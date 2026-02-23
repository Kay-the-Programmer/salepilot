import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User } from '../types';
import { SparklesIcon, ChartBarIcon, CubeIcon, MicrophoneIcon, StopIcon, ArrowDownTrayIcon } from '../components/icons';
import { api } from '../services/api';
import ReactMarkdown from 'react-markdown';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface QuickViewProps {
    user: User | null;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    reportData?: ReportData;
}

interface ReportData {
    title: string;
    headers: string[];
    rows: any[][];
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
    const [isRecording, setIsRecording] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recog = new SpeechRecognition();
            recog.continuous = true;
            recog.interimResults = true;
            recog.lang = 'en-US';

            recog.onresult = (event: any) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        setAiQuery(prev => (prev + ' ' + event.results[i][0].transcript).trim());
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
            };

            recog.onend = () => {
                setIsRecording(false);
            };

            recog.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
            };

            setRecognition(recog);
        }
    }, []);

    const toggleRecording = () => {
        if (!recognition) {
            alert("Speech recognition is not supported in your browser.");
            return;
        }

        if (isRecording) {
            recognition.stop();
            setIsRecording(false);
        } else {
            try {
                recognition.start();
                setIsRecording(true);
                // Vibrate on start recording
                if ('vibrate' in navigator) navigator.vibrate(50);
            } catch (err) {
                console.error("Failed to start recognition:", err);
                setIsRecording(false);
            }
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isChatMode]);

    const handleAiSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiQuery.trim()) return;

        if (isRecording) {
            recognition?.stop();
        }

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
            // Include history in the request (max last 10 messages)
            const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));

            const result = await api.post<{ response: string }>('/ai/chat', {
                query: currentQuery,
                history: history
            });

            // Parse response for report data
            let cleanResponse = result.response;
            let reportData: ReportData | undefined;

            if (cleanResponse.includes('<REPORT_DATA>')) {
                const reportMatch = cleanResponse.match(/<REPORT_DATA>([\s\S]*?)<\/REPORT_DATA>/);
                if (reportMatch) {
                    try {
                        reportData = JSON.parse(reportMatch[1].trim());
                        // Remove the tag from visible content
                        cleanResponse = cleanResponse.replace(/<REPORT_DATA>[\s\S]*?<\/REPORT_DATA>/, '').trim();
                    } catch (e) {
                        console.error("Failed to parse report data:", e);
                    }
                }
            }

            // Remove THINKING tags from UI view if present
            cleanResponse = cleanResponse.replace(/<THINKING>[\s\S]*?<\/THINKING>/g, '').trim();

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: cleanResponse,
                timestamp: new Date(),
                reportData: reportData
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

    const downloadPDF = (data: ReportData) => {
        const doc = new jsPDF() as any;
        doc.setFontSize(18);
        doc.text(data.title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated by SalePilot AI Assistant on ${new Date().toLocaleDateString()}`, 14, 30);

        doc.autoTable({
            head: [data.headers],
            body: data.rows,
            startY: 40,
            theme: 'striped',
            headStyles: { fillStyle: [79, 70, 229] } // indigo-600
        });

        doc.save(`${data.title.replace(/\s+/g, '_')}.pdf`);
    };

    const downloadExcel = (data: ReportData) => {
        const ws = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${data.title.replace(/\s+/g, '_')}.xlsx`);
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

            {/* Header - Minimal & Functional */}
            <div className={`flex-shrink-0 px-6 py-4 md:px-8 transition-all duration-300 ${isChatMode ? 'bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800' : ''}`}>
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-indigo-600 rounded-lg shadow-sm">
                            <SparklesIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">Business Assistant</h1>
                            {!isChatMode && <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">Powered by SalePilot AI</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">

                {/* Default View (Landing state) */}
                <div className={`absolute inset-0 overflow-y-auto custom-scrollbar transition-all duration-700 ease-in-out ${isChatMode ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0 z-10'}`}>
                    <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[70%]">

                        {/* Welcome Text - Modern & Clean */}
                        <div className="text-center mb-12 space-y-4 animate-fade-in-up">
                            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tighter">
                                Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">{user?.name?.split(' ')[0] || 'Partner'}</span>
                            </h2>
                            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                                I'm your AI business assistant. How can I help you grow your business today?
                            </p>
                        </div>

                        {/* Suggestion Grid - More like Gemini cards */}
                        <div className="w-full max-w-4xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                                {chipCategories.map((cat, idx) => (
                                    <div key={idx} className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-gray-200/50 dark:border-slate-700/50 rounded-2xl p-5 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer group active:scale-95 transition-all duration-300" onClick={() => handleChipClick(cat.chips[0].query)}>
                                        <div className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                                            {idx === 0 ? <ChartBarIcon className="w-4 h-4 text-white" /> : idx === 1 ? <CubeIcon className="w-4 h-4 text-white" /> : <SparklesIcon className="w-4 h-4 text-white" />}
                                        </div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{cat.category}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic">
                                            "{cat.chips[0].label}"
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <p className="text-center text-gray-400 dark:text-gray-500 text-xs font-medium mb-6 tracking-widest uppercase">
                                Quick Actions
                            </p>

                            <div className="flex flex-wrap justify-center gap-3">
                                {chipCategories.flatMap(c => c.chips).slice(0, 8).map((chip, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleChipClick(chip.query)}
                                        className="px-4 py-2 bg-gray-100/50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-600 dark:text-gray-300 text-sm rounded-xl border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-200 active:scale-95 transition-all duration-300"
                                    >
                                        {chip.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Mode View */}
                <div className={`flex-1 flex flex-col min-h-0 transition-opacity duration-500 ${isChatMode ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
                    {/* Messages Area - OpenAI/Gemini Centered Layout */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 scroll-smooth pb-32">
                        <div className="max-w-4xl mx-auto space-y-10">
                            {/* Intro message */}
                            <div className="flex items-start gap-4 group">
                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 animate-scale-in">
                                    <SparklesIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="pt-1.5 prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-300 font-medium">
                                    I'm ready to help. You can ask me about your sales performance, inventory levels, or customer insights.
                                </div>
                            </div>

                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex items-start gap-4 group animate-slide-up`}>
                                    {/* Avatar Column */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                        ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-gray-700 to-gray-900 dark:from-slate-700 dark:to-slate-800 text-white font-bold text-xs uppercase'
                                            : 'bg-indigo-600'}`}>
                                        {msg.role === 'user'
                                            ? (user?.name?.charAt(0) || 'U')
                                            : <SparklesIcon className="w-4 h-4 text-white" />}
                                    </div>

                                    {/* Content Column */}
                                    <div className="flex-1 pt-1.5">
                                        <div className={`
                                            prose prose-sm max-w-none dark:prose-invert leading-relaxed
                                            ${msg.role === 'user' ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-800 dark:text-gray-200'}
                                        `}>
                                            {msg.role === 'assistant' ? (
                                                <div className="prose-p:my-2 prose-strong:text-indigo-600 dark:prose-strong:text-indigo-400 prose-strong:font-bold">
                                                    {messages.indexOf(msg) === messages.length - 1 ? (
                                                        <TypingMarkdown content={msg.content} />
                                                    ) : (
                                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                    )}

                                                    {msg.reportData && (
                                                        <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 not-prose">
                                                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Generated Report: {msg.reportData.title}</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                <button
                                                                    onClick={() => downloadPDF(msg.reportData!)}
                                                                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95"
                                                                >
                                                                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                                                    Download PDF
                                                                </button>
                                                                <button
                                                                    onClick={() => downloadExcel(msg.reportData!)}
                                                                    className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95"
                                                                >
                                                                    <ChartBarIcon className="w-3.5 h-3.5" />
                                                                    Download Excel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex items-start gap-4 group">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                                        <SparklesIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="pt-3.5">
                                        <div className="flex gap-1.5 items-center">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    </div>

                    {/* Chat Input Area - Pill Floating Design */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 pointer-events-none z-30">
                        <div className="max-w-4xl mx-auto relative pointer-events-auto">

                            {/* Actions bar above input */}
                            <div className="flex items-center gap-2 mb-3">
                                <button
                                    onClick={() => {
                                        setIsChatMode(false);
                                        setMessages([]);
                                    }}
                                    className="liquid-glass-card rounded-[2rem] flex items-center gap-1.5 px-3 py-1.5 /60 dark:bg-slate-800/60 backdrop-blur-md border border-gray-200/50 dark:border-slate-700/50 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                                >
                                    <span>Clear Chat</span>
                                </button>
                                {!isChatMode && (
                                    <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 ml-2 animate-pulse">
                                        Ask your first question to begin...
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleAiSubmit} className="relative group">
                                {/* Gradient Glow Background */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[2rem] opacity-0 group-focus-within:opacity-20 blur-xl transition-all duration-500"></div>

                                <div className={`relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border ${isRecording ? 'border-red-500/50 ring-2 ring-red-500/20' : 'border-gray-200/80 dark:border-slate-700/80'} rounded-[2rem] shadow-2xl flex items-center p-2 transition-all duration-300 group-focus-within:border-indigo-500/50`}>
                                    {isRecording && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-bounce shadow-lg flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                            LISTENING...
                                        </div>
                                    )}
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={aiQuery}
                                        onChange={(e) => setAiQuery(e.target.value)}
                                        placeholder={isRecording ? "Listening to your voice..." : isChatMode ? "Ask a follow-up..." : "What can I help you with today?"}
                                        className="flex-1 pl-6 pr-4 py-3 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base rounded-full focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleRecording}
                                        className={`p-2 transition-all hover:scale-110 active:scale-90 mr-1 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-indigo-500'}`}
                                        title={isRecording ? "Stop recording" : "Record voice"}
                                    >
                                        {isRecording ? <StopIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!aiQuery.trim() || isTyping}
                                        className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all disabled:opacity-30 disabled:grayscale hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
                                    >
                                        <SparklesIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>

                            <p className="mt-4 text-[10px] text-center text-gray-400 dark:text-gray-500 font-medium">
                                Assistant can make mistakes. Verify important business data.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default QuickView;

