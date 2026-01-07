import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AuditLog, User } from '../types';
import Header from '../components/Header';
import FilterIcon from '../components/icons/FilterIcon';
import XMarkIcon from '../components/icons/XMarkIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import UserIcon from '../components/icons/UserIcon';
import SearchIcon from '../components/icons/SearchIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import ListIcon from '../components/icons/ListIcon';
import GridIcon from '../components/icons/GridIcon';
import ClockIcon from '../components/icons/ClockIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import { InputField } from '../components/ui/InputField';

interface AuditLogPageProps {
    logs: AuditLog[];
    users: User[];
}

const SORT_OPTIONS = ['Newest First', 'Oldest First', 'User A-Z', 'Action A-Z'];

const AuditLogPage: React.FC<AuditLogPageProps> = ({ logs, users }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(25);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showLogDetail, setShowLogDetail] = useState(false);
    const [sortBy, setSortBy] = useState('Newest First');

    const mainContentRef = useRef<HTMLDivElement>(null);

    const filteredLogs = useMemo(() => {
        let filtered = logs.filter(log => {
            if (selectedUserId && log.userId !== selectedUserId) return false;
            if (actionFilter && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;

            const logDate = new Date(log.timestamp);
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (logDate < start) return false;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (logDate > end) return false;
            }

            return true;
        });

        // Apply sorting
        switch (sortBy) {
            case 'Newest First':
                filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                break;
            case 'Oldest First':
                filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                break;
            case 'User A-Z':
                filtered.sort((a, b) => a.userName.localeCompare(b.userName));
                break;
            case 'Action A-Z':
                filtered.sort((a, b) => a.action.localeCompare(b.action));
                break;
        }

        return filtered;
    }, [logs, startDate, endDate, selectedUserId, actionFilter, sortBy]);

    // Pagination calculations
    const totalItems = filteredLogs.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Adjust current page if it's out of bounds after filtering
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (currentPage < 1 && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [currentPage, totalPages]);

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredLogs.slice(startIndex, endIndex);
    }, [filteredLogs, currentPage, itemsPerPage]);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
        // Scroll to top when page changes
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [totalPages]);

    const resetFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedUserId('');
        setActionFilter('');
        setSortBy('Newest First');
    };

    const activeFilterCount = [startDate, endDate, selectedUserId, actionFilter].filter(Boolean).length;

    const handleLogClick = (log: AuditLog) => {
        setSelectedLog(log);
        setShowLogDetail(true);
    };

    const getActionColor = (action: string) => {
        if (action.includes('Deleted')) return 'bg-rose-50 text-rose-600 border-rose-100';
        if (action.includes('Created')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (action.includes('Updated')) return 'bg-amber-50 text-amber-600 border-amber-100';
        if (action.includes('Viewed')) return 'bg-sky-50 text-sky-600 border-sky-100';
        if (action.includes('Logged')) return 'bg-indigo-50 text-indigo-600 border-indigo-100';
        return 'bg-slate-50 text-slate-600 border-slate-100';
    };

    const getTimeAgo = (timestamp: string) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 30) return `${diffDays}d ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
        return `${Math.floor(diffDays / 365)}y ago`;
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
            <Header
                title="Audit Trail"
                showSearch={false}
                rightContent={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 rounded-lg border transition-colors shadow-sm ${activeFilterCount > 0
                                ? 'bg-blue-50 border-blue-200 text-blue-600'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <FilterIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode(viewMode === 'list' ? 'cards' : 'list')}
                            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm transition-colors"
                        >
                            {viewMode === 'list' ? <GridIcon className="w-5 h-5" /> : <ListIcon className="w-5 h-5" />}
                        </button>
                    </div>
                }
            />

            {/* Filter Panel */}
            {showFilters && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowFilters(false)}
                    />
                    <div className="relative bg-white w-full sm:max-w-md max-h-[90vh] sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden flex flex-col animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <h3 className="text-lg font-bold text-gray-900">Filter History</h3>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sort Order</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {SORT_OPTIONS.map(option => (
                                        <button
                                            key={option}
                                            onClick={() => setSortBy(option)}
                                            className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${sortBy === option
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Filters</label>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5 ml-1">Personnel</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            <select
                                                value={selectedUserId}
                                                onChange={e => setSelectedUserId(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium text-gray-900 appearance-none"
                                            >
                                                <option value="">All Personnel</option>
                                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                            <ChevronDownIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <InputField
                                        label="Action Scan"
                                        value={actionFilter}
                                        onChange={e => setActionFilter(e.target.value)}
                                        placeholder="Search activities..."
                                        icon={<SearchIcon className="w-4 h-4" />}
                                        className="rounded-xl border-gray-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Date Range</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputField
                                        label="From"
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="rounded-xl border-gray-200"
                                    />
                                    <InputField
                                        label="To"
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="rounded-xl border-gray-200"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
                            <button
                                onClick={resetFilters}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Log Detail Modal */}
            {showLogDetail && selectedLog && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div
                        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowLogDetail(false)}
                    />
                    <div className="relative bg-white w-full sm:max-w-md max-h-[90vh] sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden flex flex-col animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <h3 className="text-lg font-bold text-gray-900">Log Details</h3>
                            <button
                                onClick={() => setShowLogDetail(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                                    {selectedLog.userName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{selectedLog.userName}</h4>
                                    <p className="text-xs text-gray-500">ID: {selectedLog.userId.slice(0, 8)}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-3 ${getActionColor(selectedLog.action)}`}>
                                    {selectedLog.action}
                                </span>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedLog.details}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <CalendarIcon className="w-3 h-3" /> Date
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {new Date(selectedLog.timestamp).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                    </p>
                                </div>
                                <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <ClockIcon className="w-3 h-3" /> Time
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {new Date(selectedLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-white">
                            <button
                                onClick={() => setShowLogDetail(false)}
                                className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-all shadow-md"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main
                ref={mainContentRef}
                className="flex-1 overflow-y-auto bg-gray-50 smooth-scroll"
            >
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {/* Page Info */}
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">History Log</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {totalItems} total events recorded
                            </p>
                        </div>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={resetFilters}
                                className="text-xs font-semibold text-blue-600 px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {viewMode === 'list' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">Personnel</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">Action</th>
                                            <th className="hidden md:table-cell px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">Details</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 text-right">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {paginatedLogs.map(log => (
                                            <tr
                                                key={log.id}
                                                onClick={() => handleLogClick(log)}
                                                className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                            {log.userName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-900">{log.userName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getActionColor(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="hidden md:table-cell px-6 py-4">
                                                    <p className="text-sm text-gray-600 line-clamp-1 max-w-sm">
                                                        {log.details}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <p className="text-sm font-semibold text-gray-900">{getTimeAgo(log.timestamp)}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">
                                                        {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginatedLogs.map(log => (
                                    <div
                                        key={log.id}
                                        onClick={() => handleLogClick(log)}
                                        className="p-5 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group animate-fade-in"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    {log.userName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-sm">{log.userName}</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Activity</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                                            {log.details}
                                        </p>
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                            <div className="flex items-center gap-1.5">
                                                <ClockIcon className="w-3.5 h-3.5 text-gray-300" />
                                                <span className="text-[11px] font-bold text-gray-900">{getTimeAgo(log.timestamp)}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold">
                                                {new Date(log.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {paginatedLogs.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                    <ShieldCheckIcon className="w-8 h-8 text-gray-200" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">No events found</h3>
                                <p className="text-sm text-gray-500 max-w-xs mt-1">
                                    Try adjusting your filters to find what you're looking for.
                                </p>
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={resetFilters}
                                        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md"
                                    >
                                        Clear History Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                            <p className="text-xs text-gray-500 font-medium order-2 sm:order-1">
                                Showing page <span className="text-gray-900 font-bold">{currentPage}</span> of <span className="text-gray-900 font-bold">{totalPages}</span>
                            </p>
                            <div className="flex items-center gap-2 order-1 sm:order-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-xs hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm"
                                >
                                    Previous
                                </button>

                                <div className="hidden sm:flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => {
                                        const page = i + 1;
                                        if (totalPages <= 7 || page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => handlePageChange(page)}
                                                    className={`w-9 h-9 rounded-lg font-bold text-xs transition-all ${currentPage === page
                                                        ? 'bg-blue-600 text-white shadow-md'
                                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        }
                                        if (page === 2 || page === totalPages - 1) {
                                            return <span key={page} className="text-gray-300 px-1">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 transition-all shadow-md"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AuditLogPage;