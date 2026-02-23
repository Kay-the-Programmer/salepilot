
import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { WhatsAppMessage } from '../../types';
import LoadingSpinner from '../LoadingSpinner';
import { ArrowLeftIcon, ArrowUpTrayIcon } from '../icons'; // Adjust imports

interface ChatWindowProps {
    conversationId: string;
    onBack: () => void;
    showSnackbar: (msg: string, type: 'success' | 'error' | 'info') => void;
    isSystem?: boolean;
}

export default function ChatWindow({ conversationId, onBack, showSnackbar, isSystem }: ChatWindowProps) {
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll frequently for chat
        return () => clearInterval(interval);
    }, [conversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const url = isSystem
                ? `/whatsapp/conversations/${conversationId}/messages?system=true`
                : `/whatsapp/conversations/${conversationId}/messages`;
            const data = await api.get<WhatsAppMessage[]>(url);
            setMessages(data || []);
            if (isLoading) setIsLoading(false);
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        try {
            await api.post('/whatsapp/send', {
                conversationId,
                content: newMessage,
                system: isSystem
            });
            setNewMessage('');
            fetchMessages(); // Instant refresh
        } catch (error: any) {
            showSnackbar(error.message || 'Failed to send message', 'error');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
                <button onClick={onBack} className="md:hidden p-2 text-gray-500">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h2 className="font-bold text-gray-800">Support Chat</h2>
                    <p className="text-xs text-gray-500">WhatsApp Business</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[75%] p-3 rounded-2xl shadow-sm text-sm ${msg.direction === 'outbound'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 rounded-bl-none'
                                    }`}
                            >
                                <p>{msg.content}</p>
                                <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${msg.direction === 'outbound' ? 'text-blue-100' : 'text-gray-400'
                                    }`}>
                                    {msg.is_ai_generated && <span>🤖 AI • </span>}
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={isSending || !newMessage.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium active:scale-95 transition-all duration-300"
                    >
                        {isSending ? '...' : 'Send'}
                    </button>
                </div>
            </form>
        </div>
    );
}
