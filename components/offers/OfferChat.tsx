import { useState, useEffect, useRef } from 'react';
import { Message, messagesService } from '../../services/messagesService';
import SocketService from '../../services/socketService';
import { Send, Image as ImageIcon, Loader } from 'lucide-react';
import { buildAssetUrl } from '../../services/api';

interface OfferChatProps {
    offerId: string;
    currentUserIsSender?: boolean; // logic to determine alignment
    currentUserId: string;
}

export default function OfferChat({ offerId, currentUserId }: OfferChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadMessages();

        const socket = SocketService.getInstance();
        socket.joinOffer(offerId);

        socket.onNewMessage((msg: Message) => {
            if (msg.offer_id === offerId) {
                setMessages((prev) => [...prev, msg]);
                scrollToBottom();
            }
        });

        return () => {
            // cleanup if needed
        };
    }, [offerId]);

    const loadMessages = async () => {
        try {
            const data = await messagesService.getByOfferId(offerId);
            setMessages(data);
            scrollToBottom();
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !image) || loading) return;

        setLoading(true);
        try {
            const msg = await messagesService.sendMessage(offerId, newMessage, image || undefined);
            setMessages((prev) => [...prev, msg]);
            setNewMessage('');
            setImage(null);
            scrollToBottom();
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 border-b border-gray-200 font-medium">Chat</div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {msg.image_url && (
                                    <img
                                        src={buildAssetUrl(msg.image_url)}
                                        alt="Shared"
                                        className="mb-2 rounded-md max-h-48 object-cover"
                                    />
                                )}
                                {msg.content && <p>{msg.content}</p>}
                                <span className={`text-xs block mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-gray-200 flex items-end gap-2">
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        id="image-upload"
                        className="hidden"
                        onChange={handleImageSelect}
                    />
                    <label
                        htmlFor="image-upload"
                        className={`p-2 rounded-full cursor-pointer hover:bg-gray-100 flex items-center justify-center ${image ? 'text-blue-600' : 'text-gray-500'
                            }`}
                        title="Upload Image"
                    >
                        <ImageIcon size={20} />
                    </label>
                </div>

                <div className="flex-1 bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                    {image && (
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full truncate max-w-[150px]">
                                {image.name}
                            </span>
                            <button type="button" onClick={() => setImage(null)} className="text-gray-400 hover:text-red-500">
                                <XIcon size={12} />
                            </button>
                        </div>
                    )}
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || (!newMessage.trim() && !image)}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
            </form>
        </div>
    );
}

const XIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);
