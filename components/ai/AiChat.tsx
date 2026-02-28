import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { dbService } from '../../services/dbService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
    CpuChipIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    MicrophoneIcon,
    SpeakerWaveIcon,
    StopIcon,
    TrashIcon,
    PlusIcon,
    ChatBubbleLeftRightIcon,
    ArrowDownTrayIcon,
    ChartBarIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    CheckIcon
} from '../icons';

export interface ReportData {
    title?: string;
    headers: string[];
    rows: any[][];
}

export interface Message {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    isTyped?: boolean;
    reportData?: ReportData;
}

export interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    timestamp: number;
}

export interface AiChatProps {
    userName?: string;
    contextData?: any;
    onClose?: () => void;
    isFullScreen?: boolean;
    initialGreetingContext?: string;
}

const TypingMarkdown: React.FC<{ content: string; speed?: number; onComplete?: () => void }> = ({ content, speed = 10, onComplete }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index < content.length) {
            const timeout = setTimeout(() => {
                // Natural typing: varying chunk sizes and shorter punctuation pauses
                const char = content[index];
                const isPunctuation = /[.,!?;]/.test(char);
                const nextChunkSize = isPunctuation ? 1 : Math.floor(Math.random() * 4) + 2;

                setDisplayedContent(prev => prev + content.slice(index, index + nextChunkSize));
                setIndex(prev => prev + nextChunkSize);
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

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-all z-10"
            title="Copy to clipboard"
        >
            {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>}
        </button>
    );
};

export const markdownComponents = {
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
    li: ({ children }: any) => (
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
        const codeText = String(children).replace(/\n$/, '');
        if (isInline) {
            return <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-[12px] font-mono" {...props}>{children}</code>;
        }
        return (
            <div className="relative group/code">
                <CopyButton text={codeText} />
                <code className="block my-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[12px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto border border-slate-200/50 dark:border-white/5" {...props}>{children}</code>
            </div>
        );
    },
    hr: (props: any) => (
        <hr className="my-3 border-slate-100 dark:border-white/5" {...props} />
    ),
};

export const AiChat: React.FC<AiChatProps> = ({ userName, contextData, onClose, isFullScreen = false, initialGreetingContext }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [history, setHistory] = useState<Conversation[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    const hasMessages = messages.length > 0;

    // Load History from IndexedDB
    const loadHistory = async () => {
        try {
            const savedHistory = await dbService.getAll<Conversation>('aiHistory');
            setHistory(savedHistory.sort((a, b) => b.timestamp - a.timestamp));
        } catch (err) {
            console.error("Failed to load AI history", err);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    // Save conversation to IndexedDB
    const saveConversation = async (updatedMessages: Message[]) => {
        if (updatedMessages.length <= 1) return; // Don't save just the greeting

        try {
            const firstUserMsg = updatedMessages.find(m => m.type === 'user')?.content || 'New Conversation';
            const conversationId = currentConversationId || Date.now().toString();

            if (!currentConversationId) setCurrentConversationId(conversationId);

            const conversation: Conversation = {
                id: conversationId,
                title: firstUserMsg.slice(0, 40) + (firstUserMsg.length > 40 ? '...' : ''),
                messages: updatedMessages,
                timestamp: Date.now()
            };

            await dbService.put('aiHistory', conversation);
            loadHistory(); // Refresh sidebar history
        } catch (err) {
            console.error("Failed to save AI conversation", err);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setCurrentConversationId(null);
        setShowHistory(false);
    };

    const loadConversation = (conv: Conversation) => {
        setMessages(conv.messages);
        setCurrentConversationId(conv.id);
        setShowHistory(false);
    };

    const deleteConversation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            const store = (dbService as any).getStore('aiHistory', 'readwrite');
            await (await store).delete(id);
            loadHistory();
            if (currentConversationId === id) {
                handleNewChat();
            }
        } catch (err) {
            console.error("Failed to delete conversation", err);
        }
    };

    const handleRename = async (id: string, newTitle: string) => {
        try {
            const conv = history.find(c => c.id === id);
            if (conv) {
                const updatedConv = { ...conv, title: newTitle };
                await dbService.put('aiHistory', updatedConv);
                setEditingId(null);
                loadHistory();
            }
        } catch (err) {
            console.error("Failed to rename conversation", err);
        }
    };

    const exportFullConversation = () => {
        if (messages.length === 0) return;

        const doc = new jsPDF() as any;
        doc.setFontSize(20);
        doc.setTextColor(79, 70, 229);
        doc.text('AI Chat Transcript', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Exported on ${new Date().toLocaleString()}`, 14, 30);

        let y = 45;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 14;
        const innerWidth = pageWidth - (margin * 2);

        messages.forEach((msg) => {
            // Check for page break
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            // Role header
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(msg.type === 'user' ? 60 : 79);
            doc.text(msg.type === 'user' ? 'YOU' : 'AI ASSISTANT', margin, y);
            y += 6;

            // Content
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(50);

            const lines = doc.splitTextToSize(msg.content.replace(/<[^>]+>/g, ''), innerWidth);
            doc.text(lines, margin, y);
            y += (lines.length * 5) + 8;
        });

        const filename = currentConversationId ? `chat_transcript_${currentConversationId}.pdf` : 'chat_transcript.pdf';
        doc.save(filename);
    };

    const groupHistory = () => {
        const filtered = history.filter(c =>
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.messages.some(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        const groups: { [key: string]: Conversation[] } = {
            'Today': [],
            'Yesterday': [],
            'Earlier': []
        };

        const today = new Date().setHours(0, 0, 0, 0);
        const yesterday = new Date(today - 86400000).getTime();

        filtered.forEach(c => {
            const date = new Date(c.timestamp).setHours(0, 0, 0, 0);
            if (date === today) groups['Today'].push(c);
            else if (date === yesterday) groups['Yesterday'].push(c);
            else groups['Earlier'].push(c);
        });

        return groups;
    };

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

            const summaryContext = initialGreetingContext ? `\n\n${initialGreetingContext}` : "\n\nHow can I help you today?";

            const initialMessage: Message = {
                id: '1',
                type: 'ai',
                content: `${greeting}${name}! 👋${summaryContext}`,
                timestamp: new Date(),
                isTyped: false // Allow it to type out
            };
            setMessages([initialMessage]);
        }

        if (typeof window !== 'undefined' && window.speechSynthesis) {
            synthRef.current = window.speechSynthesis;
        }
    }, [userName, messages.length, initialGreetingContext]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

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
                context: contextData,
                history: buildHistory()
            });

            let rawResponse = result.response;
            let reportData: ReportData | undefined;

            // Strip thinking tags
            let cleanContent = rawResponse.replace(/<THINKING>[\s\S]*?<\/THINKING>/, '').trim();

            // Extract Report Data specifically for rendering tables and buttons
            if (cleanContent.includes('<REPORT_DATA>')) {
                const reportMatch = cleanContent.match(/<REPORT_DATA>([\s\S]*?)<\/REPORT_DATA>/);
                if (reportMatch) {
                    try {
                        reportData = JSON.parse(reportMatch[1].trim());

                        // Let's also parse it into markdown so it shows inline beautifully as well
                        if (reportData && reportData.headers && reportData.rows) {
                            let markdown = `\n\n### ${reportData.title || 'Report'}\n\n`;
                            markdown += `| ${reportData.headers.join(' | ')} |\n`;
                            markdown += `| ${reportData.headers.map(() => '---').join(' | ')} |\n`;
                            reportData.rows.forEach((row: any[]) => {
                                markdown += `| ${row.join(' | ')} |\n`;
                            });
                            markdown += `\n`;

                            // Replace the custom tag with our standard markdown table
                            cleanContent = cleanContent.replace(/<REPORT_DATA>[\s\S]*?<\/REPORT_DATA>/, markdown);
                        } else {
                            cleanContent = cleanContent.replace(/<REPORT_DATA>[\s\S]*?<\/REPORT_DATA>/, '').trim();
                        }
                    } catch (e) {
                        console.error("Failed to parse <REPORT_DATA>:", e);
                        cleanContent = cleanContent.replace(/<REPORT_DATA>[\s\S]*?<\/REPORT_DATA>/, '').trim();
                    }
                }
            }

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: cleanContent,
                timestamp: new Date(),
                reportData
            };
            setMessages(prev => {
                const updatedMessages = [...prev, aiResponse];
                saveConversation(updatedMessages);
                return updatedMessages;
            });
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const downloadPDF = (data: ReportData) => {
        const doc = new jsPDF() as any;
        doc.setFontSize(18);
        doc.text(data.title || 'Report', 14, 22);
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
        doc.save(`${(data.title || 'Report').replace(/\s+/g, '_')}.pdf`);
    };

    const downloadExcel = (data: ReportData) => {
        const ws = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${(data.title || 'Report').replace(/\s+/g, '_')}.xlsx`);
    };

    const copyReportData = (data: ReportData) => {
        const headerRow = data.headers.join('\t');
        const rows = data.rows.map(row => row.join('\t')).join('\n');
        const text = `${data.title || 'Report'}\n\n${headerRow}\n${rows}`;
        navigator.clipboard.writeText(text);
        // Maybe some toast here, but for now just basic
    };

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

    const suggestedChips = [
        { label: "Sales Trends", emoji: "📈" },
        { label: "Stock Alert", emoji: "📦" },
        { label: "Customer Insights", emoji: "👥" },
        { label: "Full Report", emoji: "📊" },
        { label: "Growth Tips", emoji: "💡" },
    ];

    return (
        <div className={`flex flex-col h-full bg-white dark:bg-[#131314] font-google relative overflow-hidden transition-colors duration-500 ${isFullScreen ? 'w-full' : ''}`}>

            {/* Header */}
            <div className={`flex-shrink-0 px-4 pt-4 pb-2 md:px-6 flex items-center justify-between border-b border-transparent ${isFullScreen ? '' : 'border-slate-100 dark:border-white/[0.04]'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                        <CpuChipIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-[15px] font-semibold text-slate-800 dark:text-slate-200 tracking-tight leading-tight flex items-center gap-1.5">
                            SalePilot <span className="text-indigo-600 dark:text-indigo-400">AI</span>
                        </h1>
                        {!isFullScreen && (
                            <span className="text-[11px] text-emerald-500 dark:text-emerald-400 font-medium tracking-wide">Online</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`p-2 rounded-full transition-colors active:scale-95 transition-all duration-300 ${showHistory ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                        title="History"
                    >
                        <ClockIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleNewChat}
                        className={`p-2 rounded-full transition-colors active:scale-95 transition-all duration-300 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 ${!hasMessages ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="New Chat"
                        disabled={!hasMessages}
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                    {messages.length > 0 && (
                        <button
                            onClick={exportFullConversation}
                            className={`p-2 rounded-full transition-colors active:scale-95 transition-all duration-300 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5`}
                            title="Export Conversation PDF"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                    )}
                    {messages.length > 1 && (
                        <button
                            onClick={() => setMessages([])}
                            className={`p-2 rounded-full transition-colors active:scale-95 transition-all duration-300 ${isFullScreen ? 'flex items-center gap-1 text-[11px] font-medium text-[#444746] dark:text-[#c4c7c5] hover:text-[#1f1f1f] dark:hover:text-[#e3e3e3] bg-[#f0f4f9] dark:bg-[#1e1f20] hover:bg-[#e1e5ea] dark:hover:bg-[#2a2b2c]' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                            title="Clear Chat"
                        >
                            <TrashIcon className="w-4 h-4" />
                            {isFullScreen && <span>Clear</span>}
                        </button>
                    )}
                    {onClose && !isFullScreen && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white active:scale-95 transition-all duration-300 ml-1"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main scrollable area */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar scroll-smooth ${isFullScreen ? 'pb-[140px]' : 'px-4 py-4 space-y-5 pb-24'}`}>
                {showHistory ? (
                    <div className={`${isFullScreen ? 'max-w-2xl mx-auto px-4 sm:px-6' : ''} space-y-6`}>
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Conversation History</h2>
                        </div>

                        {/* Search Bar */}
                        <div className="relative group px-2">
                            <MagnifyingGlassIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-indigo-300 dark:focus:border-indigo-500/30 transition-all"
                            />
                        </div>

                        <div className="space-y-6">
                            {Object.entries(groupHistory()).map(([group, items]) => (
                                items.length > 0 && (
                                    <div key={group} className="space-y-3">
                                        <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">{group}</h3>
                                        <div className="space-y-2">
                                            {items.map((conv) => (
                                                <div
                                                    key={conv.id}
                                                    onClick={() => loadConversation(conv)}
                                                    className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${currentConversationId === conv.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20' : 'bg-white dark:bg-white/5 border-transparent hover:bg-slate-50 dark:hover:bg-white/[0.08]'}`}
                                                >
                                                    <div className="flex gap-3 items-center min-w-0 flex-1">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                                                            <ChatBubbleLeftRightIcon className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            {editingId === conv.id ? (
                                                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                                    <input
                                                                        autoFocus
                                                                        className="bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-500/50 rounded px-2 py-0.5 text-sm w-full outline-none"
                                                                        value={editingTitle}
                                                                        onChange={e => setEditingTitle(e.target.value)}
                                                                        onKeyDown={e => {
                                                                            if (e.key === 'Enter') handleRename(conv.id, editingTitle);
                                                                            if (e.key === 'Escape') setEditingId(null);
                                                                        }}
                                                                    />
                                                                    <button onClick={() => handleRename(conv.id, editingTitle)} className="p-1 text-emerald-500">
                                                                        <CheckIcon className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <p className={`text-sm font-medium truncate ${currentConversationId === conv.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                                        {conv.title}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {editingId !== conv.id && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingId(conv.id);
                                                                    setEditingTitle(conv.title);
                                                                }}
                                                                className="p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                            >
                                                                <PencilIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => deleteConversation(e, conv.id)}
                                                            className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}

                            {history.length === 0 && (
                                <div className="py-20 text-center">
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ClockIcon className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-sm text-slate-400">No conversations saved yet</p>
                                </div>
                            )}

                            {history.length > 0 && Object.values(groupHistory()).every(g => g.length === 0) && (
                                <div className="py-20 text-center">
                                    <p className="text-sm text-slate-400 italic">No matches found for "{searchTerm}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={`${isFullScreen ? 'max-w-2xl mx-auto px-4 sm:px-6 mt-6 space-y-6' : ''}`}>

                        {messages.map((message) => (
                            <div key={message.id} className={`group/msg flex ${message.type === 'user' ? 'justify-end' : 'justify-start gap-3 items-start'} animate-slide-up`}>

                                {/* AI Avatar */}
                                {message.type === 'ai' && (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                                        <CpuChipIcon className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}

                                {/* Message Bubble */}
                                <div className={`
                                ${message.type === 'user' ?
                                        (isFullScreen ? 'bg-[#f0f4f9] dark:bg-[#1e1f20] text-[#1f1f1f] dark:text-[#e3e3e3] px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[82%]' : 'max-w-[80%] bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-br-md text-[13.5px] leading-relaxed shadow-sm')
                                        : 'flex-1 min-w-0 pt-0.5'
                                    }
                            `}>
                                    {message.type === 'user' ? (
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                    ) : (
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

                                            {/* Action buttons — TTS, Copy */}
                                            {message.isTyped && (
                                                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200">
                                                    <button
                                                        onClick={() => speakMessage(message.content)}
                                                        className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors active:scale-95"
                                                        title={isSpeaking ? "Stop" : "Listen"}
                                                    >
                                                        {isSpeaking ? <StopIcon className="w-3.5 h-3.5" /> : <SpeakerWaveIcon className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(message.content)}
                                                        className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors active:scale-95"
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

                                            {/* Download Report Buttons */}
                                            {message.reportData && message.isTyped && (
                                                <div className="mt-3 p-3 bg-slate-50 dark:bg-[#1e1f20] rounded-xl not-prose border border-slate-200 dark:border-[#333537] w-fit max-w-full">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="p-1.5 bg-white dark:bg-[#131314] rounded-lg shadow-sm">
                                                            <ChartBarIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-slate-800 dark:text-[#e3e3e3]">Report Ready</p>
                                                            <p className="text-[10px] text-slate-500 dark:text-[#c4c7c5] line-clamp-1">{message.reportData.title || 'Data Export'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => downloadPDF(message.reportData!)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#131314] hover:bg-slate-100 dark:hover:bg-[#2a2b2c] text-slate-700 dark:text-[#e3e3e3] text-xs font-medium rounded-lg transition-all border border-slate-200 dark:border-[#333537] active:scale-95 shadow-sm whitespace-nowrap"
                                                        >
                                                            <ArrowDownTrayIcon className="w-3.5 h-3.5 text-indigo-500" />
                                                            PDF
                                                        </button>
                                                        <button
                                                            onClick={() => downloadExcel(message.reportData!)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#131314] hover:bg-slate-100 dark:hover:bg-[#2a2b2c] text-slate-700 dark:text-[#e3e3e3] text-xs font-medium rounded-lg transition-all border border-slate-200 dark:border-[#333537] active:scale-95 shadow-sm whitespace-nowrap"
                                                        >
                                                            <ChartBarIcon className="w-3.5 h-3.5 text-emerald-500" />
                                                            Excel
                                                        </button>
                                                        <button
                                                            onClick={() => copyReportData(message.reportData!)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#131314] hover:bg-slate-100 dark:hover:bg-[#2a2b2c] text-slate-700 dark:text-[#e3e3e3] text-xs font-medium rounded-lg transition-all border border-slate-200 dark:border-[#333537] active:scale-95 shadow-sm whitespace-nowrap"
                                                            title="Copy as Tab-Separated Values"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                                                            Copy
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Chips if only initial message and not typing */}
                        {messages.length <= 1 && !isTyping && (
                            <div className={`flex flex-wrap gap-2 pt-1 ${isFullScreen ? '' : 'pl-10'}`}>
                                {suggestedChips.map((chip, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSendMessage(chip.label)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-[12.5px] font-medium text-slate-600 dark:text-slate-400 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all active:scale-95"
                                    >
                                        <span className="text-sm">{chip.emoji}</span>
                                        <span>{chip.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Typing Indicator */}
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
                        <div ref={messagesEndRef} className="h-2" />
                    </div>
                )}
            </div>

            {/* Input Bar */}
            <div className={`absolute bottom-0 left-0 right-0 pt-6 pb-4 px-4 sm:px-6 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#131314] dark:via-[#131314]/95 pointer-events-none z-30`}>
                <div className={`${isFullScreen ? 'max-w-2xl mx-auto' : ''} pointer-events-auto`}>

                    {isRecording && !isFullScreen && (
                        <div className="mb-2 text-center">
                            <span className="text-[11px] font-medium text-red-500 animate-pulse inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                Listening...
                            </span>
                        </div>
                    )}

                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
                        <div className={`
                            relative flex items-end gap-2 p-1.5 rounded-2xl transition-all duration-200
                            ${isFullScreen
                                ? `bg-[#f0f4f9] dark:bg-[#1e1f20] ${isRecording ? 'ring-2 ring-red-500/50' : 'focus-within:bg-white dark:focus-within:bg-[#1e1f20] focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.07)] outline outline-1 outline-transparent focus-within:outline-[#dadde1] dark:focus-within:outline-[#333537]'}`
                                : `bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] focus-within:border-indigo-300 dark:focus-within:border-indigo-500/30 ${isRecording ? 'border-red-300 dark:border-red-500/30 ring-2 ring-red-500/20' : ''}`
                            }
                        `}>

                            <button
                                type="button"
                                onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
                                className={`p-2.5 rounded-xl transition-all active:scale-95 flex-shrink-0 ${isRecording
                                    ? 'bg-red-50 dark:bg-red-500/10 text-red-500'
                                    : (isFullScreen ? 'text-[#444746] dark:text-[#c4c7c5] hover:bg-[#e1e5ea] dark:hover:bg-[#2a2b2c] rounded-full' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-white/5')
                                    }`}
                                title={isRecording ? "Stop listening" : "Voice input"}
                            >
                                {isRecording ? <StopIcon className={`w-4 h-4 ${isFullScreen ? '' : 'animate-pulse'}`} /> : <MicrophoneIcon className="w-4 h-4" />}
                            </button>

                            <div className="flex-1 min-h-[36px] flex flex-col justify-center px-1.5">
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder={isRecording ? "Listening..." : "Ask your business assistant..."}
                                    rows={1}
                                    className={`w-full bg-transparent border-none focus:ring-0 resize-none overflow-y-auto custom-scrollbar py-2 focus:outline-none leading-relaxed
                                        ${isFullScreen ? 'text-[#1f1f1f] dark:text-[#e3e3e3] placeholder-[#9aa0a6] dark:placeholder-[#5f6368] text-sm' : 'text-[14px] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500'}
                                    `}
                                    style={{ minHeight: '36px', maxHeight: '120px' }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className={`p-2.5 rounded-xl transition-all active:scale-95 flex-shrink-0
                                    ${(!input.trim() || isTyping)
                                        ? (isFullScreen ? 'text-[#9aa0a6] dark:text-[#5f6368] cursor-not-allowed rounded-full bg-transparent' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed bg-slate-100 dark:bg-white/5')
                                        : (isFullScreen ? 'text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 shadow-sm rounded-full' : 'text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-sm')
                                    }`}
                                title="Send message"
                            >
                                <PaperAirplaneIcon className={`w-4 h-4 ${!isFullScreen ? '-rotate-45 -translate-y-0.5 translate-x-0.5' : ''}`} />
                            </button>
                        </div>
                    </form>

                    {isFullScreen && (
                        <p className="text-center text-[10px] text-[#9aa0a6] dark:text-[#5f6368] mt-2 hidden sm:block">
                            SalePilot AI can make mistakes. Verify important info.
                        </p>
                    )}
                </div>
            </div>

        </div>
    );
};
