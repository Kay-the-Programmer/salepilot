
import React, { useState, useMemo } from 'react';
import { AuditLog, User } from '../types';
import Header from '../components/Header';

interface AuditLogPageProps {
    logs: AuditLog[];
    users: User[];
}

const AuditLogPage: React.FC<AuditLogPageProps> = ({ logs, users }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            if (selectedUserId && log.userId !== selectedUserId) return false;
            if (actionFilter && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;
            
            const logDate = new Date(log.timestamp);
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0,0,0,0);
                if (logDate < start) return false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (logDate > end) return false;
            }

            return true;
        });
    }, [logs, startDate, endDate, selectedUserId, actionFilter]);
    
    const resetFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedUserId('');
        setActionFilter('');
    };

    return (
        <div className="flex flex-col h-full bg-gray-100">
            <Header title="Audit Trail" />
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
                <div className="p-4 sm:p-6 lg:p-4">
                    <div className="bg-gray-100 p-0 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <select id="user-filter" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2">
                                    <option value="">All Users</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <input type="text" id="action-filter" value={actionFilter} onChange={e => setActionFilter(e.target.value)} placeholder="e.g., Product Deleted" className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 p-2 focus:ring-blue-500 sm:text-sm"/>
                            </div>
                            <div>
                                <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"/>
                            </div>
                             <div>
                                <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"/>
                            </div>
                            <div className="flex items-end">
                                <button onClick={resetFilters} className="w-full justify-center mt-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Reset</button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-300">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Timestamp</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">User</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Action</th>
                                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {filteredLogs.map(log => (
                                                <tr key={log.id}>
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">{new Date(log.timestamp).toLocaleString()}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">{log.userName}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{log.action}</td>
                                                    <td className="px-3 py-4 text-sm text-gray-500">{log.details}</td>
                                                </tr>
                                            ))}
                                            {filteredLogs.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="text-center py-10 text-gray-500">
                                                        No audit logs found for the selected filters.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AuditLogPage;
