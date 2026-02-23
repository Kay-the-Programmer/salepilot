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
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import { InputField } from '../components/ui/InputField';
import Pagination from '../components/ui/Pagination';

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
    const [pageSize, setPageSize] = useState(25);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [sortBy, setSortBy] = useState('Newest First');

    // Resizable panel state
    const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
        const saved = localStorage.getItem('auditlog-panel-width');
        return saved ? parseFloat(saved) : 60;
    });
    const [isResizing, setIsResizing] = useState(false);

    const mainContentRef = useRef<HTMLDivElement>(null);

    // Handle resizing
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = (e.clientX / window.innerWidth) * 100;
            if (newWidth >= 40 && newWidth <= 75) {
                setLeftPanelWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            localStorage.setItem('auditlog-panel-width', leftPanelWidth.toString());
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, leftPanelWidth]);

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

    const totalItems = filteredLogs.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (currentPage < 1 && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [currentPage, totalPages]);

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredLogs.slice(startIndex, endIndex);
    }, [filteredLogs, currentPage, pageSize]);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
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
    };

    const handleBackToList = () => {
        setSelectedLog(null);
    };

    const getActionColor = (action: string) => {
        if (action.includes('Deleted')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        if (action.includes('Created')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (action.includes('Updated')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        if (action.includes('Viewed')) return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
        if (action.includes('Logged')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
        if (action.includes('CANCELLED')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
        if (action.includes('STARTED')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
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

    // Unified header that works for both desktop and mobile
    const HeaderContent = () => (
        <div className="flex items-center gap-2">
            {/* Event count badge - hidden on mobile when detail is shown */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 border border-slate-700/50 rounded-lg ${selectedLog ? 'md:flex' : ''}`}>
                <span className="text-xs text-slate-400">{totalItems}</span>
                <span className="text-xs text-slate-500">events</span>
            </div>

            {/* Filter button with badge */}
            <button
                onClick={() => setShowFilters(!showFilters)}
                className={`relative p-2 rounded-lg border transition-colors shadow-sm ${activeFilterCount > 0
                    ? 'bg-blue-900/30 border-blue-700/50 text-blue-400'
                    : 'bg-slate-800/80 border-slate-700/50 text-slate-400 hover:bg-slate-700/80 hover:text-slate-300'
                    }`}
            >
                <FilterIcon className="w-5 h-5" />
                {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {/* View toggle */}
            <button
                onClick={() => setViewMode(viewMode === 'list' ? 'cards' : 'list')}
                className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-400 hover:bg-slate-700/80 hover:text-slate-300 shadow-sm transition-colors active:scale-95 transition-all duration-300"
            >
                {viewMode === 'list' ? <GridIcon className="w-5 h-5" /> : <ListIcon className="w-5 h-5" />}
            </button>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-slate-950 overflow-hidden">
            {/* Single unified header */}
            <Header
                title="Audit Trail"
                showSearch={false}
                rightContent={<HeaderContent />}
            />

            {/* Filter Panel Modal */}
            {showFilters && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowFilters(false)}
                    />
                    <div className="relative bg-slate-900 w-full sm:max-w-md max-h-[90vh] sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden flex flex-col animate-fade-in-up border border-slate-800/50" style={{ backdropFilter: 'blur(2px)' }}>
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                            <h3 className="text-lg font-bold text-white">Filter & Sort</h3>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 active:scale-95 transition-all duration-300"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Sort Order</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {SORT_OPTIONS.map(option => (
                                        <button
                                            key={option}
                                            onClick={() => setSortBy(option)}
                                            className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${sortBy === option
                                                ? 'border-blue-500/50 bg-blue-900/30 text-blue-400'
                                                : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Filters</label>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Personnel</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                            <select
                                                value={selectedUserId}
                                                onChange={e => setSelectedUserId(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm font-medium text-white appearance-none"
                                            >
                                                <option value="">All Personnel</option>
                                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                            <ChevronDownIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    <InputField
                                        label="Action Scan"
                                        value={actionFilter}
                                        onChange={e => setActionFilter(e.target.value)}
                                        placeholder="Search activities..."
                                        icon={<SearchIcon className="w-4 h-4" />}
                                        className="rounded-xl border-slate-700"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Date Range</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputField
                                        label="From"
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="rounded-xl border-slate-700"
                                    />
                                    <InputField
                                        label="To"
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="rounded-xl border-slate-700"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex gap-3">
                            <button
                                onClick={resetFilters}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition-all active:scale-95 transition-all duration-300"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-all shadow-md active:scale-95 transition-all duration-300"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content with Two-Panel Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Log List */}
                <div
                    className={`flex flex-col h-full bg-slate-950 transition-all duration-300 ${selectedLog ? 'hidden md:flex' : 'flex w-full'}`}
                    style={{ width: selectedLog ? (typeof window !== 'undefined' && window.innerWidth < 768 ? '0%' : `${leftPanelWidth}%`) : '100%', minWidth: selectedLog ? '400px' : 'none' }}
                >
                    {/* Filter status bar - shows active filters and clear button */}
                    {activeFilterCount > 0 && (
                        <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                            </span>
                            <button
                                onClick={resetFilters}
                                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Clear all
                            </button>
                        </div>
                    )}

                    <main
                        ref={mainContentRef}
                        className="flex-1 overflow-y-auto smooth-scroll"
                    >
                        {/* Content Area */}
                        <div className="bg-slate-900/80 border-b border-slate-800/50 overflow-hidden" style={{ backdropFilter: 'blur(2px)' }}>
                            {viewMode === 'list' ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-800/50">
                                                <th className="px-4 md:px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800">Personnel</th>
                                                <th className="px-4 md:px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800">Action</th>
                                                <th className="hidden lg:table-cell px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800">Details</th>
                                                <th className="px-4 md:px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800 text-right">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {paginatedLogs.map(log => (
                                                <tr
                                                    key={log.id}
                                                    onClick={() => handleLogClick(log)}
                                                    className={`group hover:bg-slate-800/30 transition-colors cursor-pointer ${selectedLog?.id === log.id ? 'bg-slate-800/50' : ''}`}
                                                >
                                                    <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-2 md:gap-3">
                                                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs md:text-sm group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0 active:scale-95 transition-all duration-300">
                                                                {log.userName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-sm font-semibold text-white truncate max-w-[100px] md:max-w-none">{log.userName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                                                        <span className={`px-2 md:px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider border ${getActionColor(log.action)}`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="hidden lg:table-cell px-6 py-3">
                                                        <p className="text-sm text-slate-400 line-clamp-1 max-w-sm">
                                                            {log.details}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-3 text-right whitespace-nowrap">
                                                        <p className="text-sm font-semibold text-white">{getTimeAgo(log.timestamp)}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">
                                                            {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                                    {paginatedLogs.map(log => (
                                        <div
                                            key={log.id}
                                            onClick={() => handleLogClick(log)}
                                            className={`p-4 md:p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl md:rounded-2xl hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer group animate-fade-in ${selectedLog?.id === log.id ? 'border-blue-500/50 bg-slate-800/80' : ''}`}
                                        >
                                            <div className="flex items-start justify-between mb-3 md:mb-4">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-700 text-slate-400 flex items-center justify-center font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-all active:scale-95 transition-all duration-300">
                                                        {log.userName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white text-sm">{log.userName}</h4>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Activity</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400 line-clamp-2 mb-3 md:mb-4 leading-relaxed">
                                                {log.details}
                                            </p>
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                                                <div className="flex items-center gap-1.5">
                                                    <ClockIcon className="w-3.5 h-3.5 text-slate-600" />
                                                    <span className="text-[11px] font-bold text-white">{getTimeAgo(log.timestamp)}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-bold">
                                                    {new Date(log.timestamp).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {paginatedLogs.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                                        <ShieldCheckIcon className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">No events found</h3>
                                    <p className="text-sm text-slate-400 max-w-xs mt-1">
                                        Try adjusting your filters to find what you're looking for.
                                    </p>
                                    {activeFilterCount > 0 && (
                                        <button
                                            onClick={resetFilters}
                                            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md active:scale-95 transition-all duration-300"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </main>

                    {/* Pagination */}
                    {totalItems > 0 && (
                        <Pagination
                            total={totalItems}
                            page={currentPage}
                            pageSize={pageSize}
                            onPageChange={handlePageChange}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setCurrentPage(1);
                            }}
                            label="events"
                            className="border-t border-slate-800 bg-slate-900 sticky bottom-0 z-10"
                            compact={true}
                        />
                    )}
                </div>

                {/* Resize Handle (Desktop Only) */}
                {selectedLog && (
                    <div
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setIsResizing(true);
                        }}
                        className="hidden md:block w-1 hover:w-2 bg-slate-700 hover:bg-blue-600 cursor-col-resize transition-all duration-200 z-10 active:bg-blue-600 active:scale-95 transition-all duration-300"
                    />
                )}

                {/* Right Panel: Log Detail View */}
                <div
                    className={`flex-1 flex flex-col bg-slate-900/80 h-full relative ${!selectedLog ? 'hidden md:flex md:bg-slate-900/50' : 'flex w-full overflow-hidden'}`}
                    style={selectedLog ? { width: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : `${100 - leftPanelWidth}%` } : {}}
                >
                    {selectedLog ? (
                        <div className="h-full overflow-y-auto scroll-smooth" style={{ backdropFilter: 'blur(2px)' }}>
                            {/* Detail Header - Mobile shows back, Desktop shows close */}
                            <div className="sticky top-0 z-10 px-4 md:px-6 py-3 md:py-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleBackToList}
                                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors md:hidden active:scale-95 transition-all duration-300"
                                    >
                                        <ArrowLeftIcon className="w-5 h-5" />
                                    </button>
                                    <h3 className="text-lg font-bold text-white">Event Details</h3>
                                </div>
                                <button
                                    onClick={handleBackToList}
                                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hidden md:block active:scale-95 transition-all duration-300"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4 md:p-6 space-y-5 md:space-y-6">
                                {/* User Info */}
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-blue-900/30 text-blue-400 flex items-center justify-center font-bold text-xl md:text-2xl">
                                        {selectedLog.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-base md:text-lg">{selectedLog.userName}</h4>
                                        <p className="text-xs text-slate-400">ID: {selectedLog.userId.slice(0, 8)}</p>
                                    </div>
                                </div>

                                {/* Action & Details */}
                                <div className="p-4 md:p-5 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-3 md:mb-4 ${getActionColor(selectedLog.action)}`}>
                                        {selectedLog.action}
                                    </span>
                                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {selectedLog.details}
                                    </p>
                                </div>

                                {/* Timestamp Info */}
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <div className="p-3 md:p-4 bg-slate-800 border border-slate-700 rounded-xl shadow-sm">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                            <CalendarIcon className="w-3 h-3" /> Date
                                        </p>
                                        <p className="text-sm font-bold text-white">
                                            {new Date(selectedLog.timestamp).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                        </p>
                                    </div>
                                    <div className="p-3 md:p-4 bg-slate-800 border border-slate-700 rounded-xl shadow-sm">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                            <ClockIcon className="w-3 h-3" /> Time
                                        </p>
                                        <p className="text-sm font-bold text-white">
                                            {new Date(selectedLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Time Ago Badge */}
                                <div className="flex justify-center">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-full">
                                        <ClockIcon className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm font-semibold text-white">{getTimeAgo(selectedLog.timestamp)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                                <ShieldCheckIcon className="w-10 h-10 text-slate-600" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Select an Event</h3>
                            <p className="text-sm text-slate-400 max-w-xs">
                                Click on any log entry to view its details here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogPage;