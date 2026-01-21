import { useState } from 'react';
import PlusIcon from './icons/PlusIcon';
import XMarkIcon from './icons/XMarkIcon';
import Bars3Icon from './icons/Bars3Icon';

interface HeaderProps {
    title: string;
    buttonText?: string;
    onButtonClick?: () => void;
    onMenuClick?: () => void;
    searchTerm?: string;
    setSearchTerm?: (term: string) => void;
    showArchivedToggle?: boolean;
    showArchived?: boolean;
    setShowArchived?: (show: boolean) => void;
    searchLeftContent?: React.ReactNode;
    onSearch?: (term: string) => void;
    className?: string;
    rightContent?: React.ReactNode;
    hideSearchOnMobile?: boolean; // Kept for compatibility

    // New props for controlling search interaction
    isSearchActive?: boolean;
    setIsSearchActive?: (active: boolean) => void;
    showSearch?: boolean;
}

export default function Header({
    title,
    buttonText,
    onButtonClick,
    onMenuClick,
    searchTerm,
    setSearchTerm,
    showArchivedToggle = false,
    showArchived,
    setShowArchived,
    rightContent,
    searchLeftContent,
    onSearch,
    className = "",
    // If parent doesn't control state, we use internal state
    isSearchActive: propIsSearchActive,
    setIsSearchActive: propSetIsSearchActive,
    showSearch = true,
}: HeaderProps) {
    const [internalIsSearchActive, setInternalIsSearchActive] = useState(false);

    // Use prop state if provided, otherwise internal
    const isSearchActive = propIsSearchActive !== undefined ? propIsSearchActive : internalIsSearchActive;
    const setIsSearchActive = propSetIsSearchActive || setInternalIsSearchActive;

    const handleClear = () => {
        if (setSearchTerm) setSearchTerm('');
        if (onSearch) onSearch('');
    };

    return (
        <header className={`glass-effect border-b border-gray-200/40 sticky top-0 z-30 transition-all duration-300 ${className}`}>
            <div className="px-4 h-16 flex items-center justify-between">
                {isSearchActive ? (
                    <div className="flex items-center w-full animate-fadeIn transition-all duration-200">
                        <div className="relative flex-1">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                autoFocus
                                placeholder="Search..."
                                className="w-full py-2 pl-10 pr-4 bg-gray-100/50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 text-sm backdrop-blur-sm"
                                value={searchTerm || ''}
                                onChange={(e) => {
                                    if (setSearchTerm) setSearchTerm(e.target.value);
                                    if (onSearch) onSearch(e.target.value);
                                }}
                            />
                            {/* Clear Button inside input */}
                            {searchTerm && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleClear();
                                    }}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setIsSearchActive(false);
                                handleClear();
                            }}
                            className="ml-3 text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center flex-1 min-w-0 mr-2">
                            {onMenuClick && (
                                <button
                                    onClick={onMenuClick}
                                    className="mr-3 -ml-1 p-2 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
                                >
                                    <span className="sr-only">Open menu</span>
                                    <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                                </button>
                            )}
                            <h1 className="text-xl font-bold text-gray-700 truncate">{title}</h1>
                        </div>

                        <div className="flex items-center gap-2">
                            {showArchivedToggle && setShowArchived && (
                                <div className="hidden sm:flex items-center mr-2">
                                    <input
                                        id="show-archived"
                                        type="checkbox"
                                        checked={showArchived}
                                        onChange={(e) => setShowArchived(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="show-archived" className="ml-2 text-sm text-gray-700">
                                        Archived
                                    </label>
                                </div>
                            )}

                            {searchLeftContent}
                            {rightContent}

                            {showSearch && (
                                <button
                                    onClick={() => setIsSearchActive(true)}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                                    aria-label="Search"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            )}

                            {buttonText && onButtonClick && (
                                <button
                                    id="header-action-button"
                                    onClick={onButtonClick}
                                    className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <PlusIcon className="w-5 h-5 mr-1" />
                                    <span className="hidden sm:inline">{buttonText}</span>
                                    <span className="sm:hidden">Add</span>
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}
