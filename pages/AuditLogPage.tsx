import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AuditLog, User } from '../types';
import Header from '../components/Header';
import FilterIcon from '../components/icons/FilterIcon';
import XMarkIcon from '../components/icons/XMarkIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import UserIcon from '../components/icons/UserIcon';
import SearchIcon from '../components/icons/SearchIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';
import ChevronDoubleLeftIcon from '../components/icons/ChevronDoubleLeftIcon';
import ChevronDoubleRightIcon from '../components/icons/ChevronDoubleRightIcon';
import ListIcon from '../components/icons/ListIcon';
import GridIcon from '../components/icons/GridIcon';
import SortIcon from '../components/icons/SortIcon';
import ClockIcon from '../components/icons/ClockIcon';

interface AuditLogPageProps {
    logs: AuditLog[];
    users: User[];
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_ITEMS_PER_PAGE = 25;
const SORT_OPTIONS = ['Newest First', 'Oldest First', 'User A-Z', 'Action A-Z'];

const AuditLogPage: React.FC<AuditLogPageProps> = ({ logs, users }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showLogDetail, setShowLogDetail] = useState(false);
    const [sortBy, setSortBy] = useState('Newest First');
    const [showSortOptions, setShowSortOptions] = useState(false);

    const mainContentRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout>();

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

    const formatDateForDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    };

    const handleLogClick = (log: AuditLog) => {
        setSelectedLog(log);
        setShowLogDetail(true);
    };

    const getActionColor = (action: string) => {
        if (action.includes('Deleted')) return 'bg-red-100 text-red-800 border-red-200';
        if (action.includes('Created')) return 'bg-green-100 text-green-800 border-green-200';
        if (action.includes('Updated')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (action.includes('Viewed')) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (action.includes('Logged')) return 'bg-purple-100 text-purple-800 border-purple-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
        <div className="flex flex-col h-full bg-gray-50 relative overflow-hidden">
            <Header
                title="Audit Trail"
                showBackButton={false}
                rightContent={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="relative p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                            <FilterIcon className="w-5 h-5 text-gray-600" />
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setViewMode(viewMode === 'list' ? 'cards' : 'list')}
                            className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                            aria-label={viewMode === 'list' ? 'Switch to card view' : 'Switch to list view'}
                        >
                            {viewMode === 'list' ? (
                                <GridIcon className="w-5 h-5 text-gray-600" />
                            ) : (
                                <ListIcon className="w-5 h-5 text-gray-600" />
                            )}
                        </button>
                    </div>
                }
            />

            {/* Mobile Filter Panel - Bottom Sheet */}
            {showFilters && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    <div
                        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-h-[85vh] sm:max-w-md flex flex-col shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag handle */}
                        <div className="sm:hidden pt-3 pb-1 flex justify-center">
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                        </div>

                        {/* Header */}
                        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 sm:px-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">Filters</h3>
                                    <p className="text-sm text-gray-500">Refine audit log results</p>
                                </div>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="p-2 -m-2 text-gray-500 hover:text-gray-700 active:bg-gray-100 rounded-full transition-colors"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Filter content */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-6">
                            {/* Sort Options */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <SortIcon className="w-4 h-4" />
                                    Sort By
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {SORT_OPTIONS.map(option => (
                                        <button
                                            key={option}
                                            onClick={() => {
                                                setSortBy(option);
                                                setShowSortOptions(false);
                                            }}
                                            className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${sortBy === option
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* User Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" />
                                    User
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedUserId}
                                        onChange={e => setSelectedUserId(e.target.value)}
                                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                                    >
                                        <option value="">All Users</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Action Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <SearchIcon className="w-4 h-4" />
                                    Action Contains
                                </label>
                                <input
                                    type="text"
                                    value={actionFilter}
                                    onChange={e => setActionFilter(e.target.value)}
                                    placeholder="e.g., 'Product', 'Sale', 'User'"
                                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Date Range */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4" />
                                    Date Range
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-2">From Date</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-2">To Date</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="sticky bottom-0 bg-white px-4 py-4 sm:px-6 border-t border-gray-200">
                            <div className="flex gap-3">
                                <button
                                    onClick={resetFilters}
                                    className="flex-1 px-4 py-3.5 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                >
                                    Reset All
                                </button>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="flex-1 px-4 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Log Detail Modal */}
            {showLogDetail && selectedLog && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    <div
                        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-h-[85vh] sm:max-w-md flex flex-col shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sm:hidden pt-3 pb-1 flex justify-center">
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                        </div>

                        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 sm:px-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-gray-900">Log Details</h3>
                                <button
                                    onClick={() => setShowLogDetail(false)}
                                    className="p-2 -m-2 text-gray-500 hover:text-gray-700 active:bg-gray-100 rounded-full"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="text-blue-600 font-semibold text-lg">
                                            {selectedLog.userName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{selectedLog.userName}</h4>
                                        <p className="text-sm text-gray-500">{selectedLog.userId}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4">
                                    <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium border ${getActionColor(selectedLog.action)}`}>
                                        {selectedLog.action}
                                    </span>
                                </div>

                                <div>
                                    <h5 className="text-sm font-medium text-gray-700 mb-2">Details</h5>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-gray-700 whitespace-pre-wrap">{selectedLog.details}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 rounded-xl p-4">
                                        <p className="text-xs text-blue-600 font-medium mb-1">Date</p>
                                        <p className="text-sm text-gray-900">
                                            {new Date(selectedLog.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-4">
                                        <p className="text-xs text-blue-600 font-medium mb-1">Time</p>
                                        <p className="text-sm text-gray-900">
                                            {new Date(selectedLog.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <main
                ref={mainContentRef}
                className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth"
            >
                <div className="p-4 md:p-6">
                    {/* Mobile Summary Bar */}
                    <div className="md:hidden mb-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Audit Logs</h3>
                                    <p className="text-sm text-gray-500">
                                        {totalItems} total • {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowFilters(true)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 active:bg-gray-100"
                                    >
                                        <FilterIcon className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm font-medium">Filter</span>
                                    </button>
                                </div>
                            </div>

                            {/* Quick Info Bar */}
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="bg-blue-50 rounded-lg p-2">
                                    <p className="text-xs text-blue-600 font-medium">Showing</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {paginatedLogs.length}
                                    </p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-2">
                                    <p className="text-xs text-green-600 font-medium">Page</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {currentPage}/{totalPages}
                                    </p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-2">
                                    <p className="text-xs text-purple-600 font-medium">Sorted By</p>
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {sortBy.split(' ')[0]}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Filters */}
                    <div className="hidden md:block mb-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                                    <select
                                        value={sortBy}
                                        onChange={e => setSortBy(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {SORT_OPTIONS.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                                    <select
                                        value={selectedUserId}
                                        onChange={e => setSelectedUserId(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">All Users</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Action Contains</label>
                                    <input
                                        type="text"
                                        value={actionFilter}
                                        onChange={e => setActionFilter(e.target.value)}
                                        placeholder="Search actions..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-4">
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                                >
                                    Reset All Filters
                                </button>
                                <div className="text-sm text-gray-500">
                                    Showing {totalItems} logs
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    {viewMode === 'list' ? (
                        // List View
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Mobile List View */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {paginatedLogs.map(log => (
                                    <div
                                        key={log.id}
                                        className="p-4 active:bg-gray-50 transition-colors"
                                        onClick={() => handleLogClick(log)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-blue-600 font-semibold">
                                                    {log.userName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-semibold text-gray-900 truncate">
                                                        {log.userName}
                                                    </h4>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                                    {log.details}
                                                </p>
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {getTimeAgo(log.timestamp)}
                                                    </span>
                                                    <span>
                                                        {new Date(log.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                                User
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                                Action
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                                Details
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                                Time
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedLogs.map(log => (
                                            <tr
                                                key={log.id}
                                                className="hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                                                onClick={() => handleLogClick(log)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                                            <span className="text-blue-600 font-semibold">
                                                                {log.userName.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{log.userName}</div>
                                                            <div className="text-sm text-gray-500">{log.userId}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getActionColor(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-gray-600 max-w-md line-clamp-2">
                                                        {log.details}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 font-medium">
                                                        {getTimeAgo(log.timestamp)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(log.timestamp).toLocaleDateString()}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {paginatedLogs.length === 0 && (
                                <div className="text-center py-16 px-4">
                                    <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                                        <SearchIcon className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No logs found</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto mb-6">
                                        {activeFilterCount > 0
                                            ? "Try adjusting your filters or search criteria."
                                            : "Audit logs will appear here as actions are performed."}
                                    </p>
                                    {activeFilterCount > 0 && (
                                        <button
                                            onClick={resetFilters}
                                            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:bg-blue-800"
                                        >
                                            Clear All Filters
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        // Card View
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedLogs.map(log => (
                                <div
                                    key={log.id}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 hover:shadow-md active:shadow-lg active:scale-[0.98] transition-all cursor-pointer"
                                    onClick={() => handleLogClick(log)}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-blue-600 font-semibold text-lg">
                                                    {log.userName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{log.userName}</h4>
                                                <p className="text-sm text-gray-500">{log.userId}</p>
                                            </div>
                                        </div>
                                        <ChevronDownIcon className="w-5 h-5 text-gray-400 transform rotate-90" />
                                    </div>

                                    <div className="mb-4">
                                        <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium border ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </div>

                                    <div className="text-sm text-gray-600 line-clamp-3 mb-4">
                                        {log.details}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <ClockIcon className="w-4 h-4" />
                                            {getTimeAgo(log.timestamp)}
                                        </span>
                                        <span>
                                            {new Date(log.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                            <div className="flex flex-col gap-4">
                                {/* Page info */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            Page {currentPage} of {totalPages}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {totalItems} total items
                                        </p>
                                    </div>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {ITEMS_PER_PAGE_OPTIONS.map(option => (
                                            <option key={option} value={option}>
                                                {option} per page
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Page navigation */}
                                <div className="flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => handlePageChange(1)}
                                        disabled={currentPage === 1}
                                        className="flex-1 p-3 rounded-xl border border-gray-300 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 flex items-center justify-center gap-2"
                                    >
                                        <ChevronDoubleLeftIcon className="w-5 h-5" />
                                        <span className="text-sm font-medium">First</span>
                                    </button>

                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="flex-1 p-3 rounded-xl border border-gray-300 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 flex items-center justify-center gap-2"
                                    >
                                        <ChevronLeftIcon className="w-5 h-5" />
                                        <span className="text-sm font-medium">Prev</span>
                                    </button>

                                    <div className="px-3 py-2 rounded-lg bg-blue-50">
                                        <span className="text-blue-600 font-semibold">{currentPage}</span>
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="flex-1 p-3 rounded-xl border border-gray-300 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 flex items-center justify-center gap-2"
                                    >
                                        <span className="text-sm font-medium">Next</span>
                                        <ChevronRightIcon className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={() => handlePageChange(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="flex-1 p-3 rounded-xl border border-gray-300 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 flex items-center justify-center gap-2"
                                    >
                                        <span className="text-sm font-medium">Last</span>
                                        <ChevronDoubleRightIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Page input for desktop */}
                                <div className="hidden sm:flex items-center justify-center gap-3">
                                    <span className="text-sm text-gray-600">Go to page:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max={totalPages}
                                        value={currentPage}
                                        onChange={(e) => {
                                            const page = parseInt(e.target.value);
                                            if (!isNaN(page) && page >= 1 && page <= totalPages) {
                                                handlePageChange(page);
                                            }
                                        }}
                                        className="w-16 p-2 rounded-lg border border-gray-300 text-center text-sm"
                                    />
                                    <span className="text-sm text-gray-600">of {totalPages}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AuditLogPage;