import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { CpuChipIcon, ChartBarIcon, MicrophoneIcon, StopIcon, ArrowDownTrayIcon } from '../components/icons';
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
        <div className="flex flex-col h-full bg-white dark:bg-[#131314] font-google relative overflow-hidden transition-colors duration-500">
            {/* Header - Minimal, typical of Gemini */}
            <div className="flex-shrink-0 px-4 py-4 md:px-6 flex items-center justify-between absolute top-0 left-0 right-0 z-10">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-medium text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-2">
                        SalePilot <span className="text-blue-600 dark:text-blue-400 font-bold">AI</span>
                    </h1>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col mt-16">

                {/* Default View (Landing state) */}
                <div className={`absolute inset-0 overflow-y-auto custom-scrollbar transition-all duration-700 ease-in-out ${isChatMode ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0 z-10'}`}>
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 flex flex-col justify-center min-h-[80%]">

                        {/* Welcome Text - Gemini Style */}
                        <div className="mb-12 space-y-2 animate-fade-in-up">
                            <h2 className="text-[40px] md:text-[56px] font-semibold tracking-tight leading-tight">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
                                    Hello, {user?.name?.split(' ')[0] || 'Partner'}
                                </span>
                            </h2>
                            <p className="text-[40px] md:text-[56px] font-semibold tracking-tight text-[#c4c7c5] dark:text-[#444746] leading-tight">
                                How can I help you today?
                            </p>
                        </div>

                        {/* Suggestion Grid */}
                        <div className="w-full animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                                {chipCategories.flatMap(c => c.chips).slice(0, 4).map((chip, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleChipClick(chip.query)}
                                        className="bg-[#f0f4f9] dark:bg-[#1e1f20] hover:bg-[#e1e5ea] dark:hover:bg-[#2a2b2c] p-4 rounded-2xl cursor-pointer group active:scale-95 transition-all duration-200 flex flex-col justify-between min-h-[120px]"
                                    >
                                        <p className="text-sm text-[#1f1f1f] dark:text-[#e3e3e3] font-medium leading-relaxed">
                                            {chip.label}
                                        </p>
                                        <div className="self-end p-2 bg-white dark:bg-[#131314] rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <CpuChipIcon className="w-4 h-4 text-[#444746] dark:text-[#c4c7c5]" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Mode View */}
                <div className={`flex-1 flex flex-col min-h-0 transition-opacity duration-500 ${isChatMode ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 scroll-smooth pb-40">
                        <div className="max-w-3xl mx-auto space-y-8 pt-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-4 group animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {/* Assistant Avatar */}
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-violet-500 mt-1">
                                            <CpuChipIcon className="w-4 h-4 text-white" />
                                        </div>
                                    )}

                                    {/* Content Area */}
                                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-[#f0f4f9] dark:bg-[#1e1f20] px-5 py-3.5 rounded-3xl rounded-tr-sm' : 'pt-1'}`}>
                                        <div className={`
                                            prose prose-sm md:prose-base max-w-none dark:prose-invert leading-relaxed
                                            ${msg.role === 'user' ? 'text-[#1f1f1f] dark:text-[#e3e3e3]' : 'text-[#1f1f1f] dark:text-[#e3e3e3]'}
                                        `}>
                                            {msg.role === 'assistant' ? (
                                                <div className="prose-p:my-2 prose-strong:text-[#1f1f1f] dark:prose-strong:text-white prose-strong:font-semibold">
                                                    {messages.indexOf(msg) === messages.length - 1 ? (
                                                        <TypingMarkdown content={msg.content} />
                                                    ) : (
                                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                    )}

                                                    {msg.reportData && (
                                                        <div className="mt-5 p-4 bg-[#f0f4f9] dark:bg-[#1e1f20] rounded-2xl not-prose border border-[#e1e5ea] dark:border-[#333537]">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <div className="p-2 bg-white dark:bg-[#131314] rounded-lg">
                                                                    <ChartBarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-[#1f1f1f] dark:text-[#e3e3e3]">Report Generated</p>
                                                                    <p className="text-xs text-[#444746] dark:text-[#c4c7c5]">{msg.reportData.title}</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap gap-2">
                                                                <button
                                                                    onClick={() => downloadPDF(msg.reportData!)}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#131314] hover:bg-gray-50 dark:hover:bg-[#2a2b2c] text-[#1f1f1f] dark:text-[#e3e3e3] text-xs font-semibold rounded-xl transition-all border border-[#e1e5ea] dark:border-[#333537]"
                                                                >
                                                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                                                    PDF
                                                                </button>
                                                                <button
                                                                    onClick={() => downloadExcel(msg.reportData!)}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#131314] hover:bg-gray-50 dark:hover:bg-[#2a2b2c] text-[#1f1f1f] dark:text-[#e3e3e3] text-xs font-semibold rounded-xl transition-all border border-[#e1e5ea] dark:border-[#333537]"
                                                                >
                                                                    <ChartBarIcon className="w-4 h-4" />
                                                                    Excel
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

                                    {/* User Avatar */}
                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700 ml-1 mt-1">
                                            {user?.profilePicture ? (
                                                <img src={user.profilePicture} alt="User" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[#1f1f1f] dark:text-[#e3e3e3] text-xs font-medium uppercase">
                                                    {user?.name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex gap-4 group items-center justify-start">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-violet-500 animate-pulse mt-1">
                                        <CpuChipIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex gap-1.5 items-center bg-[#f0f4f9] dark:bg-[#1e1f20] px-4 py-3 rounded-2xl">
                                        <div className="w-2 h-2 bg-[#444746] dark:bg-[#c4c7c5] rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-[#444746] dark:bg-[#c4c7c5] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                        <div className="w-2 h-2 bg-[#444746] dark:bg-[#c4c7c5] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    </div>
                </div>

                {/* Chat Input Area - Gemini Style */}
                <div className="absolute bottom-0 left-0 right-0 pt-10 pb-4 px-4 sm:px-6 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-[#131314] dark:via-[#131314]/90 z-30 pointer-events-none">
                    <div className="max-w-3xl mx-auto relative pointer-events-auto">
                        <form onSubmit={handleAiSubmit} className="relative group">
                            <div className={`
                                relative bg-[#f0f4f9] dark:bg-[#1e1f20] 
                                rounded-[24px] flex items-end p-2 sm:p-3 transition-all duration-300 shadow-sm
                                ${isRecording ? 'ring-2 ring-red-500/50' : 'focus-within:bg-white dark:focus-within:bg-[#131314] focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.08)] outline outline-1 outline-transparent focus-within:outline-[#e1e5ea] dark:focus-within:outline-[#333537]'}
                            `}>
                                <button
                                    type="button"
                                    onClick={toggleRecording}
                                    className={`p-3 rounded-full transition-all active:scale-95 flex-shrink-0 mt-auto ${isRecording ? 'text-red-500 bg-red-50 dark:bg-red-500/10 animate-pulse' : 'text-[#444746] dark:text-[#c4c7c5] hover:bg-[#e1e5ea] dark:hover:bg-[#2a2b2c]'}`}
                                    title={isRecording ? "Stop recording" : "Record voice"}
                                >
                                    {isRecording ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
                                </button>

                                <div className="flex-1 min-h-[44px] flex flex-col justify-center px-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={aiQuery}
                                        onChange={(e) => setAiQuery(e.target.value)}
                                        placeholder={isRecording ? "Listening..." : "Ask SalePilot..."}
                                        className="w-full bg-transparent border-none focus:ring-0 text-[#1f1f1f] dark:text-[#e3e3e3] placeholder-[#444746] dark:placeholder-[#c4c7c5] text-base focus:outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!aiQuery.trim() || isTyping}
                                    className={`p-3 rounded-full transition-all flex-shrink-0 mt-auto
                                        ${(!aiQuery.trim() || isTyping)
                                            ? 'text-[#444746] dark:text-[#c4c7c5] opacity-50'
                                            : 'text-white bg-black dark:text-[#1f1f1f] dark:bg-[#e3e3e3] hover:scale-105 active:scale-95 shadow-sm'
                                        }`}
                                >
                                    <CpuChipIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </form>

                        <div className="flex items-center justify-between mt-3 px-2">
                            <p className="text-[11px] text-[#444746] dark:text-[#c4c7c5] font-medium hidden sm:block">
                                SalePilot can make mistakes. Consider verifying important information.
                            </p>
                            {isChatMode && (
                                <button
                                    onClick={() => {
                                        setIsChatMode(false);
                                        setMessages([]);
                                    }}
                                    className="text-[11px] font-medium text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-[#e3e3e3] transition-colors ml-auto sm:ml-0 px-3 py-1 bg-gray-100 dark:bg-[#1e1f20] hover:bg-gray-200 dark:hover:bg-[#2a2b2c] rounded-full"
                                >
                                    Clear Chat
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickView;

