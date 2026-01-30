
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { WhatsAppConversation } from '../../types';
import LoadingSpinner from '../LoadingSpinner';
import { MagnifyingGlassIcon } from '../icons';

interface ConversationListProps {
    onSelectConversation: (id: string) => void;
    selectedId: string | null;
}

export default function ConversationList({ onSelectConversation, selectedId }: ConversationListProps) {
    const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchConversations = async () => {
        try {
            const data = await api.get<WhatsAppConversation[]>('/whatsapp/conversations');
            setConversations(data || []);
        } catch (error) {
            console.error('Failed to load conversations', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filtered = conversations.filter(c =>
        (c.customer_name?.toLowerCase().includes(search.toLowerCase()) || c.customer_phone.includes(search))
    );

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-3">Messages</h2>
                <div className="relative">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <LoadingSpinner />
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No recent conversations
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filtered.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => onSelectConversation(conv.id)}
                                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedId === conv.id ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-gray-900 truncate pr-2">
                                        {conv.customer_name || conv.customer_phone}
                                    </h3>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-gray-500 truncate flex-1">
                                        {conv.customer_phone}
                                    </p>
                                    {conv.status === 'active' && <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
