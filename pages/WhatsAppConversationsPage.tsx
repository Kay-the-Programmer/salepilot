import { useState } from 'react';
import ConversationList from '../components/whatsapp/ConversationList';
import ChatWindow from '../components/whatsapp/ChatWindow';

import { User } from '../types';

interface WhatsAppConversationsPageProps {
    showSnackbar: (msg: string, type: 'success' | 'error' | 'info') => void;
    currentUser: User;
    superMode?: 'superadmin' | 'store';
}

export default function WhatsAppConversationsPage({ showSnackbar, currentUser, superMode }: WhatsAppConversationsPageProps) {
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const isSystem = currentUser.role === 'superadmin' && superMode === 'superadmin';


    return (
        <div className="h-full flex overflow-hidden bg-white">
            <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                <ConversationList
                    onSelectConversation={setSelectedConversationId}
                    selectedId={selectedConversationId}
                    isSystem={isSystem}
                />
            </div>

            <div className={`flex-1 flex flex-col ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversationId ? (
                    <ChatWindow
                        conversationId={selectedConversationId}
                        onBack={() => setSelectedConversationId(null)}
                        showSnackbar={showSnackbar}
                        isSystem={isSystem}
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
