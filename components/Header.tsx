import { useState, useRef, useEffect } from 'react';
import PlusIcon from './icons/PlusIcon';
import XMarkIcon from './icons/XMarkIcon';
import Bars3Icon from './icons/Bars3Icon';

interface HeaderProps {
    title: string | React.ReactNode;
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
    hideSearchOnDesktop?: boolean;

    /** Suggestions shown below the search bar when active on mobile */
    searchSuggestions?: string[];
    /** Called when user taps a suggestion */
    onSuggestionSelect?: (suggestion: string) => void;
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
    isSearchActive: propIsSearchActive,
    setIsSearchActive: propSetIsSearchActive,
    showSearch = true,
    hideSearchOnDesktop = false,
    searchSuggestions = [],
    onSuggestionSelect,
}: HeaderProps) {
    const [internalIsSearchActive, setInternalIsSearchActive] = useState(false);
    const mobileInputRef = useRef<HTMLInputElement>(null);

    const isSearchActive = propIsSearchActive !== undefined ? propIsSearchActive : internalIsSearchActive;
    const setIsSearchActive = propSetIsSearchActive || setInternalIsSearchActive;

    const handleClear = () => {
        if (setSearchTerm) setSearchTerm('');
        if (onSearch) onSearch('');
    };

    useEffect(() => {
        if (isSearchActive) {
            setTimeout(() => mobileInputRef.current?.focus(), 50);
        }
    }, [isSearchActive]);

    const hasSuggestions = isSearchActive && searchSuggestions.length > 0;

    return (
        <header className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/20 dark:border-white/5 sticky top-0 z-30 transition-all duration-300 ${className}`}>
            <div className="px-4 h-16 flex items-center justify-between relative">

                {/* ── Mobile: full-width search overlay ── */}
                {showSearch && (
                    <div
                        className={`md:hidden absolute inset-x-0 top-0 h-16 z-10 flex items-center px-3 gap-2 transition-all duration-300 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl ${isSearchActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    >
                        <div className="flex-1 relative">
                            <div className="flex items-center w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full px-3 h-10 border border-slate-200/60 dark:border-white/10 shadow-[inset_0_1px_4px_rgba(0,0,0,0.03)]">
                                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    ref={mobileInputRef}
                                    type="text"
                                    placeholder="Search products…"
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm py-1 ml-2 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                                    value={searchTerm || ''}
                                    onChange={(e) => {
                                        if (setSearchTerm) setSearchTerm(e.target.value);
                                        if (onSearch) onSearch(e.target.value);
                                    }}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={handleClear}
                                        className="shrink-0 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        aria-label="Clear search"
                                    >
                                        <XMarkIcon className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                                    </button>
                                )}
                            </div>

                            {/* Suggestions Dropdown */}
                            {hasSuggestions && (
                                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden z-50 max-h-64 overflow-y-auto">
                                    {searchSuggestions.map((suggestion, i) => (
                                        <button
                                            key={i}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => {
                                                if (setSearchTerm) setSearchTerm(suggestion);
                                                if (onSearch) onSearch(suggestion);
                                                if (onSuggestionSelect) onSuggestionSelect(suggestion);
                                                mobileInputRef.current?.focus();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-sm text-slate-700 dark:text-slate-200 border-b border-slate-100/60 dark:border-white/5 last:border-0 active:bg-slate-100 dark:active:bg-slate-700/80"
                                        >
                                            <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <span className="truncate">{suggestion}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => { setIsSearchActive(false); handleClear(); }}
                            className="shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {/* ── Left: Title ── */}
                {title && (
                    <div className={`flex items-center flex-1 min-w-0 mr-4 transition-opacity duration-200 ${showSearch && isSearchActive ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100'}`}>
                        {onMenuClick && (
                            <button
                                onClick={onMenuClick}
                                className="mr-3 -ml-1 p-2 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
                            >
                                <span className="sr-only">Open menu</span>
                                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                            </button>
                        )}
                        {typeof title === 'string' ? (
                            <h1 className="text-[17px] md:text-2xl font-semibold tracking-tight text-brand-text truncate">{title}</h1>
                        ) : (
                            title
                        )}
                    </div>
                )}

                {/* ── Right: Actions ── */}
                <div className={`flex items-center gap-2 transition-opacity duration-200 ${showSearch && isSearchActive ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100'}`}>
                    {showArchivedToggle && setShowArchived && (
                        <div className="hidden sm:flex items-center mr-2">
                            <input
                                id="show-archived"
                                type="checkbox"
                                checked={showArchived}
                                onChange={(e) => setShowArchived(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="show-archived" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                Archived
                            </label>
                        </div>
                    )}

                    {(searchLeftContent || rightContent || showSearch || (buttonText && onButtonClick)) && (
                        <div className="flex items-center gap-1 sm:gap-3 p-1 rounded-full bg-slate-100/50 dark:bg-slate-800/40 border border-white/20 dark:border-white/5 backdrop-blur-2xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] dark:shadow-none">
                            {searchLeftContent}
                            {rightContent}

                            {showSearch && (
                                <div className={`flex items-center transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isSearchActive ? 'w-48 lg:w-72' : 'w-10'} ${hideSearchOnDesktop ? 'md:hidden' : ''}`}>
                                    {/* Desktop: inline expanding search */}
                                    <div className="hidden md:flex items-center w-full">
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
                                                className="p-2.5 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary-dark rounded-full hover:bg-white dark:hover:bg-slate-700/50 shadow-sm border border-transparent hover:border-slate-200/50 dark:hover:border-white/5 transition-all active:scale-90 duration-300 group"
                                                aria-label="Search"
                                            >
                                                <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    {/* Mobile: icon button only — overlay handles the full-width input */}
                                    <button
                                        onClick={() => setIsSearchActive(true)}
                                        className={`md:hidden p-2.5 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary-dark rounded-full hover:bg-white dark:hover:bg-slate-700/50 transition-all active:scale-90 duration-300 group ${hideSearchOnDesktop ? '' : ''}`}
                                        aria-label="Search"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {buttonText && onButtonClick && (
                                <button
                                    id="header-action-button"
                                    onClick={onButtonClick}
                                    className="ml-1 flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-full text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 whitespace-nowrap"
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
