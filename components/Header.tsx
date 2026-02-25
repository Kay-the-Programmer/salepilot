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
        <header className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/20 dark:border-white/5 sticky top-0 z-30 transition-all duration-300 ${className}`}>
            <div className="px-4 h-16 flex items-center justify-between">
                {title && (
                    <div className="flex items-center flex-1 min-w-0 mr-4">
                        {onMenuClick && (
                            <button
                                onClick={onMenuClick}
                                className="mr-3 -ml-1 p-2 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
                            >
                                <span className="sr-only">Open menu</span>
                                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                            </button>
                        )}
                        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase dark:text-white truncate">{title}</h1>
                    </div>
                )}

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
                            <label htmlFor="show-archived" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                Archived
                            </label>
                        </div>
                    )}

                    {(searchLeftContent || rightContent || showSearch || (buttonText && onButtonClick)) && (
                        <div className="flex items-center gap-3 p-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/60 border border-white/50 dark:border-white/10 backdrop-blur-md shadow-[0_2px_10px_rgb(0,0,0,0.05)] dark:shadow-none" >
                            {searchLeftContent}
                            {rightContent}

                            {showSearch && (
                                <div className={`flex items-center transition-all duration-300 ${isSearchActive ? 'w-48 lg:w-64' : 'w-10'}`}>
                                    {isSearchActive ? (
                                        <div className="flex items-center w-full bg-white dark:bg-slate-900/60 rounded-full px-3 h-10 border border-slate-200/60 dark:border-white/10 shadow-inner animate-fadeIn">
                                            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Search..."
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm py-1 ml-1.5 dark:text-white"
                                                value={searchTerm || ''}
                                                onChange={(e) => {
                                                    if (setSearchTerm) setSearchTerm(e.target.value);
                                                    if (onSearch) onSearch(e.target.value);
                                                }}
                                            />
                                            <button onClick={() => { setIsSearchActive(false); handleClear(); }}>
                                                <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsSearchActive(true)}
                                            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-white dark:hover:bg-slate-700 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all active:scale-90 duration-300"
                                            aria-label="Search"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}

                            {buttonText && onButtonClick && (
                                <button
                                    id="header-action-button"
                                    onClick={onButtonClick}
                                    className="ml-1 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 whitespace-nowrap"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{buttonText}</span>
                                    <span className="sm:hidden">Add</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
