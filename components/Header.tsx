import React, { useState, useEffect } from 'react';
import PlusIcon from './icons/PlusIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import XMarkIcon from './icons/XMarkIcon';

interface HeaderProps {
    title: string;
    buttonText?: string;
    onButtonClick?: () => void;
    searchTerm?: string;
    setSearchTerm?: (term: string) => void;
    showArchivedToggle?: boolean;
    showArchived?: boolean;
    setShowArchived?: (show: boolean) => void;
    searchLeftContent?: React.ReactNode;
    onSearch?: (term: string) => void;
    className?: string;
    rightContent?: React.ReactNode;
    hideSearchOnMobile?: boolean;
}

const Header: React.FC<HeaderProps> = ({
    title,
    buttonText,
    onButtonClick,
    searchTerm,
    setSearchTerm,
    showArchivedToggle = false,
    showArchived,
    setShowArchived,
    rightContent,
    searchLeftContent,
    onSearch,
    className = "",
    hideSearchOnMobile = false
}) => {
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');

    useEffect(() => {
        setLocalSearchTerm(searchTerm || '');
    }, [searchTerm]);

    const handleSearch = () => {
        if (setSearchTerm) {
            setSearchTerm(localSearchTerm);
        }
        if (onSearch) {
            onSearch(localSearchTerm);
        }
        setIsSearchFocused(false);
    };

    const handleClear = () => {
        setLocalSearchTerm('');
        if (setSearchTerm) setSearchTerm('');
        if (onSearch) onSearch('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <header className={`bg-gray-100 z-10 relative ${className}`}>
            {/* Mobile Search Overlay Backdrop */}
            {isSearchFocused && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden animate-fade-in"
                    onClick={() => setIsSearchFocused(false)}
                    aria-hidden="true"
                />
            )}

            <div className="mx-auto px-4 sm:px-6 lg:px-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 py-3">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl lg:py-4 sm:py-0 md:py-2 font-bold leading-7 text-gray-700 sm:truncate">
                            {title}
                        </h1>
                    </div>
                    <div className="flex items-center flex-wrap gap-3 ml-0 md:ml-6 w-full md:w-auto">
                        {showArchivedToggle && setShowArchived && (
                            <div className="flex items-center">
                                <input
                                    id="show-archived"
                                    name="show-archived"
                                    type="checkbox"
                                    checked={showArchived}
                                    onChange={(e) => setShowArchived(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="show-archived" className="ml-2 block text-sm text-gray-900">
                                    Show Archived
                                </label>
                            </div>
                        )}
                        {searchLeftContent}
                        {typeof searchTerm !== 'undefined' && setSearchTerm && (
                            <div className={`
                                transition-all duration-300 ease-in-out
                                ${hideSearchOnMobile ? 'hidden md:block' : ''}
                                ${isSearchFocused
                                    ? 'fixed inset-x-0 top-0 z-50 p-3 bg-white h-[70px] flex items-center shadow-lg md:relative md:top-auto md:left-auto md:h-auto md:shadow-none md:bg-transparent md:p-0 md:w-64 md:z-auto'
                                    : 'relative flex-1 min-w-0 w-full md:w-64'}
                            `}>
                                {isSearchFocused && (
                                    <button
                                        onClick={() => setIsSearchFocused(false)}
                                        className="mr-3 md:hidden text-gray-500 hover:text-gray-700 p-1"
                                    >
                                        <ArrowLeftIcon className="w-6 h-6" />
                                    </button>
                                )}
                                <div className="relative flex-1 w-full">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <svg className={`w-5 h-5 ${isSearchFocused ? 'text-blue-500' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none">
                                            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={localSearchTerm}
                                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onKeyDown={handleKeyDown}
                                        className={`block w-full py-2 pl-10 border rounded-md leading-5 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm
                                            ${isSearchFocused
                                                ? (localSearchTerm ? 'pr-28 border-blue-500 ring-1 ring-blue-500 bg-gray-50' : 'pr-20 border-blue-500 ring-1 ring-blue-500 bg-gray-50')
                                                : (localSearchTerm ? 'pr-10 border-gray-300 bg-white' : 'pr-3 border-gray-300 bg-white')
                                            }
                                        `}
                                    />

                                    {/* Clear Button */}
                                    {localSearchTerm && (
                                        <button
                                            onClick={handleClear}
                                            type="button"
                                            className={`absolute inset-y-0 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer
                                                ${isSearchFocused ? 'right-20 px-2' : 'right-0 px-3'}
                                            `}
                                            aria-label="Clear search"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    )}

                                    {isSearchFocused && (
                                        <button
                                            onClick={handleSearch}
                                            className="absolute inset-y-0 right-0 px-3 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 text-sm font-medium transition-colors"
                                        >
                                            Search
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        {buttonText && onButtonClick && (
                            <button
                                onClick={onButtonClick}
                                type="button"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                                {buttonText}
                            </button>
                        )}
                        {rightContent}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
