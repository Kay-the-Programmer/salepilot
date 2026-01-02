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

interface AuditLogPageProps {
    logs: AuditLog[];
    users: User[];
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_ITEMS_PER_PAGE = 25;

const AuditLogPage: React.FC<AuditLogPageProps> = ({ logs, users }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
    const [showPagination, setShowPagination] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    
    const mainContentRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout>();

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
        setShowFilters(false);
        setCurrentPage(1);
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

    // Scroll handler for showing/hiding pagination
    useEffect(() => {
        const handleScroll = () => {
            if (!mainContentRef.current || totalPages <= 1) return;

            const currentScrollY = mainContentRef.current.scrollTop;
            const isScrollingUp = currentScrollY < lastScrollY;
            
            // Show pagination when scrolling up, hide when scrolling down
            if (isScrollingUp && !showPagination) {
                setShowPagination(true);
            } else if (!isScrollingUp && currentScrollY > 100 && showPagination) {
                setShowPagination(false);
            }
            
            setLastScrollY(currentScrollY);
            setIsScrolling(true);

            // Clear previous timeout
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            // Set timeout to reset scrolling state
            scrollTimeoutRef.current = setTimeout(() => {
                setIsScrolling(false);
            }, 150);
        };

        const contentElement = mainContentRef.current;
        if (contentElement) {
            contentElement.addEventListener('scroll', handleScroll);
            return () => contentElement.removeEventListener('scroll', handleScroll);
        }
    }, [lastScrollY, showPagination, totalPages]);

    // Always show pagination when page changes
    useEffect(() => {
        if (totalPages > 1) {
            setShowPagination(true);
        }
    }, [currentPage, totalPages]);

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const delta = 2; // Number of pages to show around current page
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - delta && i <= currentPage + delta)
            ) {
                range.push(i);
            }
        }

        range.forEach((i) => {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        });

        return rangeWithDots;
    };

    return (
        <div className="flex flex-col h-full bg-gray-100">
            <Header 
                title="Audit Trail" 
                rightContent={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="relative p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                        >
                            <FilterIcon className="w-5 h-5 text-gray-600" />
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setViewMode(viewMode === 'list' ? 'cards' : 'list')}
                            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium"
                        >
                            {viewMode === 'list' ? 'Cards' : 'List'}
                        </button>
                    </div>
                }
            />

            {/* Mobile Filter Panel */}
            {showFilters && (
                <div className="md:hidden fixed inset-0 z-50 bg-white p-4 overflow-y-auto">
                    <div className="sticky top-0 bg-white pb-4 border-b">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="p-2 rounded-lg hover:bg-gray-100"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <UserIcon className="w-4 h-4 inline mr-2" />
                                    User
                                </label>
                                <select 
                                    value={selectedUserId} 
                                    onChange={e => setSelectedUserId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">All Users</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <SearchIcon className="w-4 h-4 inline mr-2" />
                                    Action Contains
                                </label>
                                <input 
                                    type="text" 
                                    value={actionFilter} 
                                    onChange={e => setActionFilter(e.target.value)}
                                    placeholder="e.g., Product Deleted"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    <CalendarIcon className="w-4 h-4 inline mr-2" />
                                    Date Range
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">From</label>
                                        <input 
                                            type="date" 
                                            value={startDate} 
                                            onChange={e => setStartDate(e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">To</label>
                                        <input 
                                            type="date" 
                                            value={endDate} 
                                            onChange={e => setEndDate(e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="sticky bottom-0 bg-white pt-4 border-t">
                        <div className="flex gap-3">
                            <button
                                onClick={resetFilters}
                                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                            >
                                Reset All
                            </button>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main 
                ref={mainContentRef}
                className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth"
            >
                <div className="p-4 md:p-6">
                    {/* Desktop Filters - Hidden on Mobile */}
                    <div className="hidden md:block mb-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">User</label>
                                    <select 
                                        value={selectedUserId} 
                                        onChange={e => setSelectedUserId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">All Users</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Action Contains</label>
                                    <input 
                                        type="text" 
                                        value={actionFilter} 
                                        onChange={e => setActionFilter(e.target.value)}
                                        placeholder="e.g., Product Deleted"
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
                                    <input 
                                        type="date" 
                                        value={startDate} 
                                        onChange={e => setStartDate(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
                                    <input 
                                        type="date" 
                                        value={endDate} 
                                        onChange={e => setEndDate(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        onClick={resetFilters}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 text-sm"
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Summary Bar */}
                    <div className="md:hidden mb-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">Audit Logs</h3>
                                    <p className="text-xs text-gray-500">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowFilters(true)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                                >
                                    <FilterIcon className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium">Filter</span>
                                    {activeFilterCount > 0 && (
                                        <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Active Filters Preview */}
                            {(startDate || endDate || selectedUserId || actionFilter) && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedUserId && (
                                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs">
                                                User: {users.find(u => u.id === selectedUserId)?.name}
                                                <button onClick={() => setSelectedUserId('')}>
                                                    <XMarkIcon className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}
                                        {actionFilter && (
                                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs">
                                                Action: {actionFilter}
                                                <button onClick={() => setActionFilter('')}>
                                                    <XMarkIcon className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}
                                        {startDate && (
                                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs">
                                                From: {formatDateForDisplay(startDate)}
                                                <button onClick={() => setStartDate('')}>
                                                    <XMarkIcon className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}
                                        {endDate && (
                                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs">
                                                To: {formatDateForDisplay(endDate)}
                                                <button onClick={() => setEndDate('')}>
                                                    <XMarkIcon className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pagination Control - Top */}
                    {totalPages > 1 && (
                        <div className={`mb-4 transition-all duration-300 ease-in-out ${showPagination ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="text-sm text-gray-600">
                                            Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            <span className="font-semibold">{totalItems}</span> total logs
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600 whitespace-nowrap">Show:</label>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1); // Reset to first page when changing items per page
                                            }}
                                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            {ITEMS_PER_PAGE_OPTIONS.map(option => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    {viewMode === 'list' ? (
                        // List View
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Timestamp
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Action
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Details
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {paginatedLogs.map(log => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 font-medium">
                                                        {new Date(log.timestamp).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(log.timestamp).toLocaleTimeString([], { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                                            <span className="text-blue-600 text-sm font-medium">
                                                                {log.userName.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {log.userName}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        log.action.includes('Deleted') ? 'bg-red-100 text-red-800' :
                                                        log.action.includes('Created') ? 'bg-green-100 text-green-800' :
                                                        log.action.includes('Updated') ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 max-w-md truncate">
                                                        {log.details}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile List View */}
                            <div className="md:hidden divide-y divide-gray-200">
                                {paginatedLogs.map(log => (
                                    <div key={log.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                                    <span className="text-blue-600 font-medium">
                                                        {log.userName.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{log.userName}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(log.timestamp).toLocaleDateString()} • 
                                                        {new Date(log.timestamp).toLocaleTimeString([], { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                log.action.includes('Deleted') ? 'bg-red-100 text-red-800' :
                                                log.action.includes('Created') ? 'bg-green-100 text-green-800' :
                                                log.action.includes('Updated') ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 mt-2 pl-13">
                                            {log.details}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {paginatedLogs.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <SearchIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No logs found</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto">
                                        {activeFilterCount > 0 
                                            ? "Try adjusting your filters to see more results."
                                            : "No audit logs have been recorded yet."}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Card View
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedLogs.map(log => (
                                <div key={log.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                                <span className="text-blue-600 font-medium">
                                                    {log.userName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{log.userName}</div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(log.timestamp).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                    
                                    <div className="mb-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            log.action.includes('Deleted') ? 'bg-red-100 text-red-800' :
                                            log.action.includes('Created') ? 'bg-green-100 text-green-800' :
                                            log.action.includes('Updated') ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {log.action}
                                        </span>
                                    </div>
                                    
                                    <div className="text-sm text-gray-600 line-clamp-3">
                                        {log.details}
                                    </div>
                                    
                                    <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                                        {new Date(log.timestamp).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Bar - Bottom (with scroll-aware behavior) */}
                    {totalPages > 1 && (
                        <div className={`sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 transition-all duration-300 ease-in-out ${showPagination ? 'translate-y-0' : 'translate-y-full'}`}>
                            <div className="p-3">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                    {/* Items per page and info */}
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div>
                                            Showing <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-semibold">{totalItems}</span>
                                        </div>
                                        <div className="hidden sm:block">
                                            Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                                        </div>
                                    </div>

                                    {/* Pagination Controls */}
                                    <div className="flex items-center gap-1">
                                        {/* First Page */}
                                        <button
                                            onClick={() => handlePageChange(1)}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="First page"
                                        >
                                            <ChevronDoubleLeftIcon className="w-5 h-5" />
                                        </button>

                                        {/* Previous Page */}
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Previous page"
                                        >
                                            <ChevronLeftIcon className="w-5 h-5" />
                                        </button>

                                        {/* Page Numbers */}
                                        <div className="flex items-center gap-1 mx-2">
                                            {getPageNumbers().map((pageNum, index) => (
                                                typeof pageNum === 'number' ? (
                                                    <button
                                                        key={index}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`min-w-[2.5rem] h-10 rounded-lg text-sm font-medium transition-colors ${
                                                            currentPage === pageNum
                                                                ? 'bg-blue-600 text-white border border-blue-600'
                                                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                ) : (
                                                    <span key={index} className="px-2 text-gray-400">
                                                        {pageNum}
                                                    </span>
                                                )
                                            ))}
                                        </div>

                                        {/* Next Page */}
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Next page"
                                        >
                                            <ChevronRightIcon className="w-5 h-5" />
                                        </button>

                                        {/* Last Page */}
                                        <button
                                            onClick={() => handlePageChange(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Last page"
                                        >
                                            <ChevronDoubleRightIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Quick Jump for Desktop */}
                                    <div className="hidden lg:flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Go to:</span>
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
                                        <span className="text-sm text-gray-600">/ {totalPages}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Floating Mobile Pagination Button (for quick access) */}
                {totalPages > 1 && !showPagination && (
                    <button
                        onClick={() => setShowPagination(true)}
                        className="flex mb-50 right-4 md:hidden z-50 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                        aria-label="Show pagination"
                    >
                        <span className="text-sm font-semibold">{currentPage}</span>
                    </button>
                )}
            </main>
        </div>
    );
};

export default AuditLogPage;