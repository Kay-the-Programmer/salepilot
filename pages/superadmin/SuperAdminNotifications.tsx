import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
// Note: PaperAirplane and Eye might not be exact matches, checking available icons
import { ClockIcon, EyeIcon, EnvelopeIcon } from '../../components/icons';

// Types (reusing from previous monolithic definition)
interface SystemNotification {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    createdBy: string;
}

interface NotificationDetail {
    notification: SystemNotification;
    statuses: { storeName: string; isRead: boolean; sentAt: string }[];
}

const SuperAdminNotifications: React.FC = () => {
    const [notifications, setNotifications] = useState<SystemNotification[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    // Detail Modal State
    const [selectedNotif, setSelectedNotif] = useState<NotificationDetail | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const resp = await api.get<{ notifications: SystemNotification[] }>("/superadmin/notifications");
            setNotifications(resp.notifications || []);
        } catch (e: any) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) return;

        setSending(true);
        try {
            await api.post('/superadmin/notifications', { title, message });
            setTitle('');
            setMessage('');
            alert('Broadcast Sent Successfully!');
            loadNotifications(); // Refresh history
        } catch (error: any) {
            alert(error.message || 'Failed to send broadcast');
        } finally {
            setSending(false);
        }
    };

    const viewStatus = async (id: string) => {
        try {
            const resp = await api.get<NotificationDetail>(`/superadmin/notifications/${id}/status`);
            setSelectedNotif(resp);
            setIsModalOpen(true);
        } catch (e) {
            alert("Failed to fetch delivery details");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6">

            {/* Create Broadcast Sequi */}
            <div className="lg:w-1/3">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <EnvelopeIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">New Broadcast</h2>
                            <p className="text-xs text-gray-500">Notify all stores immediately</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSend} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. System Maintenance Update"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-40 resize-none"
                            placeholder="Type your message here..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={sending}
                        className="w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {sending ? 'Sending...' : 'Send Broadcast'}
                    </button>
                </form>
            </div>

            {/* History List */}
            <div className="lg:w-2/3 flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Broadcast History</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {notifications.length === 0 && !loading && (
                        <div className="text-center text-gray-400 py-12">No broadcasts sent yet.</div>
                    )}
                    {notifications.map(n => (
                        <div key={n.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-indigo-200 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-gray-900">{n.title}</h3>
                                <span className="text-xs text-gray-500 flex items-center gap-1 bg-white px-2 py-1 rounded">
                                    <ClockIcon className="w-3 h-3" />
                                    {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">{n.message}</p>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => viewStatus(n.id)}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                                >
                                    <EyeIcon className="w-3 h-3" /> View Delivery Status
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status Modal */}
            {
                isModalOpen && selectedNotif && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-gray-900">Delivery Status</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    ✕
                                </button>
                            </div>
                            <div className="p-0 overflow-y-auto flex-1">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {selectedNotif.statuses.map((s, i) => (
                                            <tr key={i}>
                                                <td className="px-6 py-4 text-sm text-gray-900">{s.storeName}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    {s.isRead ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                            Read
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                                            Unseen
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
};

export default SuperAdminNotifications;
