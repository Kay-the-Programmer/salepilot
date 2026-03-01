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
                        <div className="flex items-center gap-1 sm:gap-3 p-1 rounded-full bg-slate-100/50 dark:bg-slate-800/40 border border-white/20 dark:border-white/5 backdrop-blur-2xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] dark:shadow-none" >
                            {searchLeftContent}
                            {rightContent}

                            {showSearch && (
                                <div className={`flex items-center transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isSearchActive ? 'w-48 lg:w-72' : 'w-10'}`}>
                                    {isSearchActive ? (
                                        <div className="flex items-center w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-full px-3 h-10 border border-slate-200/40 dark:border-white/10 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)] animate-in fade-in zoom-in-95 duration-300">
                                            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Search..."
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm py-1 ml-2 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                                                value={searchTerm || ''}
                                                onChange={(e) => {
                                                    if (setSearchTerm) setSearchTerm(e.target.value);
                                                    if (onSearch) onSearch(e.target.value);
                                                }}
                                            />
                                            <button
                                                onClick={() => { setIsSearchActive(false); handleClear(); }}
                                                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                <XMarkIcon className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsSearchActive(true)}
                                            className="p-2.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-full hover:bg-white dark:hover:bg-slate-700/50 shadow-sm border border-transparent hover:border-slate-200/50 dark:hover:border-white/5 transition-all active:scale-90 duration-300 group"
                                            aria-label="Search"
                                        >
                                            <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                    className="ml-1 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 whitespace-nowrap"
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
