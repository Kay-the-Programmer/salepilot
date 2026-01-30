
import { useState, useEffect } from 'react';
import { StoreSettings } from '../types';
import ConversationList from '../components/whatsapp/ConversationList';
import ChatWindow from '../components/whatsapp/ChatWindow';

interface WhatsAppConversationsPageProps {
    storeSettings: StoreSettings | null;
    showSnackbar: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function WhatsAppConversationsPage({ storeSettings, showSnackbar }: WhatsAppConversationsPageProps) {
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

    return (
        <div className="h-full flex overflow-hidden bg-white">
            <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                <ConversationList
                    onSelectConversation={setSelectedConversationId}
                    selectedId={selectedConversationId}
                />
            </div>

            <div className={`flex-1 flex flex-col ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversationId ? (
                    <ChatWindow
                        conversationId={selectedConversationId}
                        onBack={() => setSelectedConversationId(null)}
                        showSnackbar={showSnackbar}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">💬</span>
                        </div>
                        <p className="text-lg font-medium text-gray-500">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}
