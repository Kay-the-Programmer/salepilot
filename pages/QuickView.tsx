import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { CpuChipIcon, ChartBarIcon, MicrophoneIcon, StopIcon, ArrowDownTrayIcon, PaperAirplaneIcon, XMarkIcon } from '../components/icons';
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
    const [isRecording, setIsRecording] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const hasMessages = messages.length > 0;

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
        }
    }, [aiQuery]);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recog = new SpeechRecognition();
            recog.continuous = true;
            recog.interimResults = true;
            recog.lang = 'en-US';

            recog.onresult = (event: any) => {
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        setAiQuery(prev => (prev + ' ' + event.results[i][0].transcript).trim());
                    }
                }
            };

            recog.onend = () => setIsRecording(false);
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
    }, [messages, isTyping, aiQuery]);

    const handleAiSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!aiQuery.trim()) return;

        if (isRecording) recognition?.stop();

        const currentQuery = aiQuery;
        setAiQuery('');
        setIsTyping(true);

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: currentQuery,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);

        if ('vibrate' in navigator) navigator.vibrate([15, 30, 15]);

        try {
            const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
            const result = await api.post<{ response: string }>('/ai/chat', {
                query: currentQuery,
                history
            });

            let cleanResponse = result.response;
            let reportData: ReportData | undefined;

            if (cleanResponse.includes('<REPORT_DATA>')) {
                const reportMatch = cleanResponse.match(/<REPORT_DATA>([\s\S]*?)<\/REPORT_DATA>/);
                if (reportMatch) {
                    try {
                        reportData = JSON.parse(reportMatch[1].trim());
                        cleanResponse = cleanResponse.replace(/<REPORT_DATA>[\s\S]*?<\/REPORT_DATA>/, '').trim();
                    } catch (e) {
                        console.error("Failed to parse report data:", e);
                    }
                }
            }

            cleanResponse = cleanResponse.replace(/<THINKING>[\s\S]*?<\/THINKING>/g, '').trim();

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: cleanResponse,
                timestamp: new Date(),
                reportData
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Sorry, I'm having trouble connecting to the business database right now. Please try again later.",
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (aiQuery.trim() && !isTyping) handleAiSubmit();
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
            headStyles: { fillStyle: [79, 70, 229] }
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
        inputRef.current?.focus();
    };

    // Flat list of quick-action chips — compact for mobile
    const quickChips = [
        { label: "Today's Sales", query: 'How are sales today?' },
        { label: 'Top Products', query: 'What are my best-selling products?' },
        { label: 'Low Stock', query: 'Which products need reordering?' },
        { label: 'Profit Margins', query: "What's my profit margin?" },
        { label: 'Best Customers', query: 'Who are my best customers?' },
        { label: 'Weekly Trends', query: 'Show me sales trends this week' },
    ];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#131314] font-google relative overflow-hidden transition-colors duration-500">

            {/* ── Header ── */}
            <div className="flex-shrink-0 px-4 pt-4 pb-2 md:px-6 flex items-center justify-between border-b border-transparent">
                <h1 className="text-base font-semibold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-1.5">
                    SalePilot{' '}
                    <span className="text-blue-600 dark:text-blue-400">AI</span>
                </h1>

                {hasMessages && (
                    <button
                        onClick={() => setMessages([])}
                        className="flex items-center gap-1 text-[11px] font-medium text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-[#e3e3e3] px-2.5 py-1 rounded-full bg-[#f0f4f9] dark:bg-[#1e1f20] hover:bg-[#e1e5ea] dark:hover:bg-[#2a2b2c] transition-all"
                    >
                        <XMarkIcon className="w-3 h-3" />
                        Clear
                    </button>
                )}
            </div>

            {/* ── Scrollable main area ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth pb-[140px]">
                <div className="max-w-2xl mx-auto px-4 sm:px-6">

                    {/* Welcome / landing state */}
                    {!hasMessages && (
                        <div className="pt-8 pb-4 animate-fade-in-up">
                            {/* Greeting */}
                            <div className="mb-6 space-y-0.5">
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
                                        Hello, {user?.name?.split(' ')[0] || 'Partner'}
                                    </span>
                                </h2>
                                <p className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[#c4c7c5] dark:text-[#444746] leading-tight">
                                    How can I help?
                                </p>
                            </div>

                            {/* Quick chips — horizontal scroll on mobile */}
                            <div
                                className="flex flex-wrap gap-2"
                                style={{ animationDelay: '0.1s' }}
                            >
                                {quickChips.map((chip, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleChipClick(chip.query)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#f0f4f9] dark:bg-[#1e1f20] text-[#1f1f1f] dark:text-[#e3e3e3] hover:bg-[#e1e5ea] dark:hover:bg-[#2a2b2c] active:scale-95 transition-all duration-150 border border-[#e1e5ea] dark:border-[#2a2b2c] whitespace-nowrap"
                                    >
                                        {chip.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Chat messages ── */}
                    {hasMessages && (
                        <div className="space-y-6 pt-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {/* Assistant avatar */}
                                    {msg.role === 'assistant' && (
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-violet-500 mt-0.5">
                                            <CpuChipIcon className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}

                                    {/* Bubble */}
                                    <div className={`max-w-[82%] ${msg.role === 'user' ? 'bg-[#f0f4f9] dark:bg-[#1e1f20] px-4 py-2.5 rounded-2xl rounded-tr-sm' : 'pt-0.5'}`}>
                                        <div className={`
                                            prose prose-sm max-w-none dark:prose-invert leading-relaxed
                                            ${msg.role === 'user' ? 'text-[#1f1f1f] dark:text-[#e3e3e3]' : 'text-[#1f1f1f] dark:text-[#e3e3e3]'}
                                        `}>
                                            {msg.role === 'assistant' ? (
                                                <div className="prose-p:my-1.5 prose-strong:text-[#1f1f1f] dark:prose-strong:text-white prose-strong:font-semibold">
                                                    {messages.indexOf(msg) === messages.length - 1 ? (
                                                        <TypingMarkdown content={msg.content} />
                                                    ) : (
                                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                    )}

                                                    {/* Report download card */}
                                                    {msg.reportData && (
                                                        <div className="mt-3 p-3 bg-[#f0f4f9] dark:bg-[#1e1f20] rounded-xl not-prose border border-[#e1e5ea] dark:border-[#333537]">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="p-1.5 bg-white dark:bg-[#131314] rounded-lg">
                                                                    <ChartBarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-semibold text-[#1f1f1f] dark:text-[#e3e3e3]">Report Ready</p>
                                                                    <p className="text-[10px] text-[#444746] dark:text-[#c4c7c5]">{msg.reportData.title}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => downloadPDF(msg.reportData!)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#131314] hover:bg-gray-50 dark:hover:bg-[#2a2b2c] text-[#1f1f1f] dark:text-[#e3e3e3] text-xs font-medium rounded-lg transition-all border border-[#e1e5ea] dark:border-[#333537]"
                                                                >
                                                                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                                                    PDF
                                                                </button>
                                                                <button
                                                                    onClick={() => downloadExcel(msg.reportData!)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#131314] hover:bg-gray-50 dark:hover:bg-[#2a2b2c] text-[#1f1f1f] dark:text-[#e3e3e3] text-xs font-medium rounded-lg transition-all border border-[#e1e5ea] dark:border-[#333537]"
                                                                >
                                                                    <ChartBarIcon className="w-3.5 h-3.5" />
                                                                    Excel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* User avatar */}
                                    {msg.role === 'user' && (
                                        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700 mt-0.5">
                                            {user?.profilePicture ? (
                                                <img src={user.profilePicture} alt="User" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[#1f1f1f] dark:text-[#e3e3e3] text-[10px] font-medium uppercase">
                                                    {user?.name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {isTyping && (
                                <div className="flex gap-3 items-start justify-start">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-violet-500 animate-pulse">
                                        <CpuChipIcon className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div className="flex gap-1 items-center bg-[#f0f4f9] dark:bg-[#1e1f20] px-3.5 py-2.5 rounded-2xl rounded-tl-sm mt-0.5">
                                        <div className="w-1.5 h-1.5 bg-[#444746] dark:bg-[#c4c7c5] rounded-full animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-[#444746] dark:bg-[#c4c7c5] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                        <div className="w-1.5 h-1.5 bg-[#444746] dark:bg-[#c4c7c5] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} className="h-2" />
                        </div>
                    )}

                    {/* Spacer when no messages so input doesn't cover chips */}
                    {!hasMessages && <div ref={messagesEndRef} />}
                </div>
            </div>

            {/* ── Input bar — fixed at bottom ── */}
            <div className="absolute bottom-0 left-0 right-0 pt-6 pb-3 px-4 sm:px-6 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#131314] dark:via-[#131314]/95 pointer-events-none z-30">
                <div className="max-w-2xl mx-auto pointer-events-auto">
                    <form onSubmit={handleAiSubmit} className="relative">
                        <div className={`
                            relative bg-[#f0f4f9] dark:bg-[#1e1f20]
                            rounded-2xl flex items-end px-2 py-2 transition-all duration-200
                            ${isRecording
                                ? 'ring-2 ring-red-500/50'
                                : 'focus-within:bg-white dark:focus-within:bg-[#1e1f20] focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.07)] outline outline-1 outline-transparent focus-within:outline-[#dadde1] dark:focus-within:outline-[#333537]'
                            }
                        `}>
                            {/* Mic button */}
                            <button
                                type="button"
                                onClick={toggleRecording}
                                className={`p-2.5 rounded-full transition-all active:scale-95 flex-shrink-0 ${isRecording ? 'text-red-500 bg-red-50 dark:bg-red-500/10 animate-pulse' : 'text-[#444746] dark:text-[#c4c7c5] hover:bg-[#e1e5ea] dark:hover:bg-[#2a2b2c]'}`}
                                title={isRecording ? "Stop recording" : "Voice input"}
                            >
                                {isRecording ? <StopIcon className="w-4 h-4" /> : <MicrophoneIcon className="w-4 h-4" />}
                            </button>

                            {/* Textarea */}
                            <div className="flex-1 min-h-[36px] flex flex-col justify-center px-1.5">
                                <textarea
                                    ref={inputRef}
                                    value={aiQuery}
                                    onChange={(e) => setAiQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isRecording ? "Listening…" : "Ask anything…"}
                                    rows={1}
                                    className="w-full bg-transparent border-none focus:ring-0 text-[#1f1f1f] dark:text-[#e3e3e3] placeholder-[#9aa0a6] dark:placeholder-[#5f6368] text-sm focus:outline-none resize-none overflow-y-auto custom-scrollbar py-1.5 leading-relaxed"
                                    style={{ minHeight: '36px', maxHeight: '120px' }}
                                />
                            </div>

                            {/* Send button — PaperAirplaneIcon */}
                            <button
                                type="submit"
                                disabled={!aiQuery.trim() || isTyping}
                                className={`p-2.5 rounded-full transition-all flex-shrink-0
                                    ${(!aiQuery.trim() || isTyping)
                                        ? 'text-[#9aa0a6] dark:text-[#5f6368] cursor-not-allowed'
                                        : 'text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 hover:scale-105 active:scale-95 shadow-sm'
                                    }`}
                                title="Send"
                            >
                                <PaperAirplaneIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </form>

                    {/* Disclaimer — only on larger screens */}
                    <p className="text-center text-[10px] text-[#9aa0a6] dark:text-[#5f6368] mt-2 hidden sm:block">
                        SalePilot AI can make mistakes. Verify important info.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuickView;
