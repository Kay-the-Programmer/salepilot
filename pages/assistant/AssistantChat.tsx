import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { api } from '../../services/api';
import { dbService } from '../../services/dbService';
import type { CurrencyContext } from './insights';
import { greetingWord } from './insights';

/* These mirror the shapes used by the original components/ai/AiChat.tsx so the
   IndexedDB 'aiHistory' store stays compatible across both surfaces. */
interface ReportData {
  title?: string;
  headers: string[];
  rows: any[][];
}
interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
  reportData?: ReportData;
}
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

interface AssistantChatProps {
  userName?: string;
  currency: CurrencyContext;
  /** When set, the chat auto-sends this query once on mount (from the dashboard input). */
  initialQuery?: string;
  onConsumedInitialQuery?: () => void;
}

const SUGGESTED = [
  { label: 'Sales trends', icon: 'trending_up' },
  { label: 'Low-stock alerts', icon: 'inventory_2' },
  { label: 'Top customers', icon: 'group' },
  { label: 'Full business report', icon: 'description' },
  { label: 'Growth ideas', icon: 'lightbulb' },
];

const AssistantChat: React.FC<AssistantChatProps> = ({
  userName,
  currency,
  initialQuery,
  onConsumedInitialQuery,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [history, setHistory] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const initialFired = useRef(false);

  const greetingMessage = useCallback((): Message => ({
    id: 'greeting',
    type: 'ai',
    content: `${greetingWord()}${userName ? `, ${userName}` : ''}! 👋\n\nI'm your SalePilot business assistant. Ask me about sales, stock, customers or growth — or tap a suggestion below.`,
    timestamp: Date.now(),
  }), [userName]);

  const loadHistory = useCallback(async () => {
    try {
      const saved = await dbService.getAll<Conversation>('aiHistory');
      setHistory(saved.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      console.error('Failed to load AI history', e);
    }
  }, []);

  useEffect(() => {
    setMessages([greetingMessage()]);
    loadHistory();
    if (typeof window !== 'undefined' && window.speechSynthesis) synthRef.current = window.speechSynthesis;
    return () => { synthRef.current?.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea.
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  }, [input]);

  const buildHistoryPayload = (msgs: Message[]) =>
    msgs.slice(-10).map((m) => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }));

  const saveConversation = useCallback(async (msgs: Message[], convId: string | null) => {
    const realMsgs = msgs.filter((m) => m.id !== 'greeting');
    if (realMsgs.length < 1) return;
    try {
      const firstUser = realMsgs.find((m) => m.type === 'user')?.content || 'New conversation';
      const id = convId || Date.now().toString();
      const conv: Conversation = {
        id,
        title: firstUser.slice(0, 40) + (firstUser.length > 40 ? '…' : ''),
        messages: msgs,
        timestamp: Date.now(),
      };
      await dbService.put('aiHistory', conv);
      loadHistory();
      return id;
    } catch (e) {
      console.error('Failed to save AI conversation', e);
    }
  }, [loadHistory]);

  const handleSend = useCallback(async (textOverride?: string) => {
    const userText = (textOverride ?? input).trim();
    if (!userText || isTyping) return;

    const userMessage: Message = { id: Date.now().toString(), type: 'user', content: userText, timestamp: Date.now() };
    const withUser = [...messages, userMessage];
    setMessages(withUser);
    setInput('');
    setIsTyping(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(8);

    try {
      const result = await api.post<{ response: string }>('/ai/chat', {
        query: userText,
        context: { currency },
        history: buildHistoryPayload(withUser),
      });

      // The shared api client queues POSTs and returns an `offline` stub instead
      // of throwing when the server is unreachable — surface that clearly.
      if (!result || (result as any).offline || typeof (result as any).response !== 'string' || !(result as any).response.trim()) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: "### Can't reach the assistant 📡\n\nI couldn't connect to SalePilot AI right now. Please check your internet connection and try again.",
          timestamp: Date.now(),
        }]);
        return;
      }

      let content = result.response.replace(/<THINKING>[\s\S]*?<\/THINKING>/, '').trim();
      let reportData: ReportData | undefined;

      // Same <REPORT_DATA> contract as the original assistant.
      const match = content.match(/<REPORT_DATA>([\s\S]*?)<\/REPORT_DATA>/);
      if (match) {
        try {
          reportData = JSON.parse(match[1].trim());
          if (reportData?.headers && reportData?.rows) {
            let md = `\n\n### ${reportData.title || 'Report'}\n\n`;
            md += `| ${reportData.headers.join(' | ')} |\n`;
            md += `| ${reportData.headers.map(() => '---').join(' | ')} |\n`;
            reportData.rows.forEach((r) => { md += `| ${r.join(' | ')} |\n`; });
            content = content.replace(/<REPORT_DATA>[\s\S]*?<\/REPORT_DATA>/, md);
          } else {
            content = content.replace(/<REPORT_DATA>[\s\S]*?<\/REPORT_DATA>/, '').trim();
          }
        } catch {
          content = content.replace(/<REPORT_DATA>[\s\S]*?<\/REPORT_DATA>/, '').trim();
        }
      }

      const aiMessage: Message = { id: (Date.now() + 1).toString(), type: 'ai', content, timestamp: Date.now(), reportData };
      const finalMsgs = [...withUser, aiMessage];
      setMessages(finalMsgs);
      const id = await saveConversation(finalMsgs, conversationId);
      if (id && !conversationId) setConversationId(id);
    } catch (error: any) {
      let content = "Sorry, I couldn't process that just now. Please try again.";
      if (error?.status === 403 || (error?.message || '').toLowerCase().includes('limit reached')) {
        content = '### AI limit reached ⚠️\n\nYou\'ve hit your monthly AI request limit. Upgrade your plan to keep using the assistant.';
      } else if (error?.status === 402) {
        content = '### Subscription required 💳\n\nYour subscription is inactive or expired. Update billing to continue using AI features.';
      }
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), type: 'ai', content, timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, currency, conversationId, saveConversation]);

  // Auto-send the query the user typed on the dashboard.
  useEffect(() => {
    if (initialQuery && !initialFired.current) {
      initialFired.current = true;
      handleSend(initialQuery);
      onConsumedInitialQuery?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  /* ----------------------------- voice ----------------------------- */
  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice recognition is not supported in this browser.'); return; }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setIsRecording(true);
    rec.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsRecording(false); };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    rec.start();
  };
  const stopVoice = () => { recognitionRef.current?.stop(); setIsRecording(false); };

  const speak = (msg: Message) => {
    if (!synthRef.current) return;
    if (speakingId === msg.id) { synthRef.current.cancel(); setSpeakingId(null); return; }
    synthRef.current.cancel();
    const plain = msg.content.replace(/[#*`_>|-]/g, ' ').replace(/\s+/g, ' ').trim();
    const u = new SpeechSynthesisUtterance(plain);
    u.onend = () => setSpeakingId(null);
    u.onerror = () => setSpeakingId(null);
    setSpeakingId(msg.id);
    synthRef.current.speak(u);
  };

  /* --------------------------- exports ---------------------------- */
  const downloadPDF = (data: ReportData) => {
    const doc = new jsPDF() as any;
    doc.setFontSize(18);
    doc.text(data.title || 'Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(120);
    doc.text(`Generated by SalePilot Assistant on ${new Date().toLocaleDateString()}`, 14, 30);
    doc.autoTable({ head: [data.headers], body: data.rows, startY: 40, theme: 'striped', headStyles: { fillColor: [0, 101, 75] } });
    doc.save(`${(data.title || 'Report').replace(/\s+/g, '_')}.pdf`);
  };
  const downloadExcel = (data: ReportData) => {
    const ws = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${(data.title || 'Report').replace(/\s+/g, '_')}.xlsx`);
  };
  const copyReport = (data: ReportData) => {
    const text = `${data.title || 'Report'}\n\n${data.headers.join('\t')}\n${data.rows.map((r) => r.join('\t')).join('\n')}`;
    navigator.clipboard.writeText(text);
  };

  /* --------------------------- history ---------------------------- */
  const newChat = () => {
    synthRef.current?.cancel();
    setMessages([greetingMessage()]);
    setConversationId(null);
    setShowHistory(false);
  };
  const loadConversation = (conv: Conversation) => {
    setMessages(conv.messages);
    setConversationId(conv.id);
    setShowHistory(false);
  };
  const deleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const store = await (dbService as any).getStore('aiHistory', 'readwrite');
      store.delete(id);
      loadHistory();
      if (conversationId === id) newChat();
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  const onlyGreeting = messages.length === 1 && messages[0].id === 'greeting';

  return (
    <div className="flex flex-col h-full relative">
      {/* Sub-header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 m3-bg-surface border-b m3-border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 22 }}>auto_awesome</span>
          <div className="leading-tight">
            <p className="text-sm font-bold m3-text-on-surface">SalePilot Assistant</p>
            <p className="text-[11px] m3-text-primary font-medium">Online · grounded on your store data</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHistory((s) => !s)}
            className={`p-2 rounded-full transition active:scale-90 ${showHistory ? 'm3-bg-surface-high m3-text-primary' : 'm3-text-on-surface-variant hover:m3-bg-surface-high'}`}
            title="History"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>history</span>
          </button>
          <button
            onClick={newChat}
            className="p-2 rounded-full m3-text-on-surface-variant hover:m3-bg-surface-high transition active:scale-90"
            title="New chat"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_comment</span>
          </button>
        </div>
      </div>

      {/* History drawer */}
      {showHistory && (
        <div className="absolute inset-0 z-30 m3-bg flex flex-col sp-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b m3-border-outline-variant">
            <p className="font-bold m3-text-on-surface">Conversations</p>
            <button onClick={() => setShowHistory(false)} className="p-2 rounded-full m3-text-on-surface-variant hover:m3-bg-surface-high">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto sp-scroll p-3 space-y-2">
            {history.length === 0 && (
              <p className="text-sm m3-text-on-surface-variant text-center mt-8">No saved conversations yet.</p>
            )}
            {history.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv)}
                className="w-full text-left p-3 rounded-xl m3-bg-surface-container hover:m3-bg-surface-high transition flex items-center justify-between gap-2 group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium m3-text-on-surface truncate">{conv.title}</p>
                  <p className="text-[11px] m3-text-on-surface-variant">{new Date(conv.timestamp).toLocaleString()}</p>
                </div>
                <span
                  onClick={(e) => deleteConversation(e, conv.id)}
                  className="material-symbols-outlined m3-text-outline hover:m3-text-error opacity-0 group-hover:opacity-100 transition"
                  style={{ fontSize: 18 }}
                >
                  delete
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto sp-scroll px-4 py-4">
        <div className="md:max-w-3xl md:mx-auto w-full space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex sp-fade-in ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] md:max-w-[75%] rounded-2xl px-4 py-3 text-[13.5px] shadow-sm ${m.type === 'user' ? 'chat-bubble-user rounded-br-md' : 'chat-bubble-ai rounded-bl-md'}`}>
              {m.type === 'ai' ? (
                <div className="md-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              )}

              {m.reportData && (
                <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t m3-border-outline-variant">
                  <span className="text-[11px] m3-text-on-surface-variant mr-auto truncate">
                    {m.reportData.title || 'Data export'}
                  </span>
                  <button onClick={() => downloadPDF(m.reportData!)} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg m3-bg-primary m3-text-on-primary active:scale-95 transition">PDF</button>
                  <button onClick={() => downloadExcel(m.reportData!)} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg m3-bg-surface-high m3-text-on-surface active:scale-95 transition">Excel</button>
                  <button onClick={() => copyReport(m.reportData!)} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg m3-bg-surface-high m3-text-on-surface active:scale-95 transition">Copy</button>
                </div>
              )}

              {m.type === 'ai' && m.id !== 'greeting' && (
                <button
                  onClick={() => speak(m)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] m3-text-on-surface-variant hover:m3-text-primary transition"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    {speakingId === m.id ? 'stop_circle' : 'volume_up'}
                  </span>
                  {speakingId === m.id ? 'Stop' : 'Listen'}
                </button>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start sp-fade-in">
            <div className="chat-bubble-ai rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full m3-bg-primary viz-bar" style={{ animationDelay: '0s' }} />
              <span className="w-2 h-2 rounded-full m3-bg-primary viz-bar" style={{ animationDelay: '0.15s' }} />
              <span className="w-2 h-2 rounded-full m3-bg-primary viz-bar" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}

        {onlyGreeting && (
          <div className="flex flex-wrap gap-2 pt-2 sp-fade-in">
            {SUGGESTED.map((c) => (
              <button
                key={c.label}
                onClick={() => handleSend(c.label)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full m3-bg-surface-container hover:m3-bg-surface-high m3-text-on-surface text-[12.5px] font-medium transition active:scale-95"
              >
                <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 16 }}>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 pt-2 pb-3 m3-bg-surface border-t m3-border-outline-variant">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="ai-input-glow flex items-end gap-1 m3-bg-surface-lowest border m3-border-outline-variant rounded-3xl p-1.5 shadow-sm transition md:max-w-3xl md:mx-auto w-full"
        >
          <span className="material-symbols-outlined m3-text-primary pl-2 pb-2 self-end" style={{ fontSize: 22 }}>auto_awesome</span>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            rows={1}
            placeholder={isRecording ? 'Listening…' : 'Ask about sales, stock, customers…'}
            className="flex-1 resize-none bg-transparent border-none focus:ring-0 outline-none py-2 px-1 text-[14px] m3-text-on-surface m3-placeholder max-h-[120px]"
          />
          <button
            type="button"
            onClick={isRecording ? stopVoice : startVoice}
            className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full transition active:scale-90 ${isRecording ? 'm3-bg-error-container m3-text-error animate-pulse' : 'm3-text-on-surface-variant hover:m3-bg-surface-high'}`}
            title={isRecording ? 'Stop' : 'Voice input'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{isRecording ? 'stop' : 'mic'}</span>
          </button>
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full m3-bg-primary m3-text-on-primary disabled:opacity-40 transition active:scale-90"
            title="Send"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_upward</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssistantChat;
