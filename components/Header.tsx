
import React from 'react';
import PlusIcon from './icons/PlusIcon';

interface HeaderProps {
    title: string;
    buttonText?: string;
    onButtonClick?: () => void;
    searchTerm?: string;
    setSearchTerm?: (term: string) => void;
    showArchivedToggle?: boolean;
    showArchived?: boolean;
    setShowArchived?: (show: boolean) => void;
    rightContent?: React.ReactNode;
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
    rightContent
}) => {
    return (
        <header className="bg-gray-100 z-10">
            <div className="mx-auto px-4  sm:px-6 lg:px-4">
                <div className={`${rightContent ? 'flex items-center justify-between' : 'flex flex-col md:flex-row md:items-center md:justify-between'} gap-3 md:gap-4 py-3`}>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl lg:py-4 sm:py-0 md:py-2  font-bold leading-7 text-gray-700 sm:truncate">
                            {title}
                        </h1>
                    </div>
                    <div className={`${rightContent ? 'flex items-center gap-3 ml-0 md:ml-6' : 'flex items-center flex-wrap gap-3 ml-0 md:ml-6 w-full md:w-auto'}`}>
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
                        {typeof searchTerm !== 'undefined' && setSearchTerm && (
                            <div className="relative flex-1 min-w-0 w-full md:w-64">
                                 <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                    </svg>
                                </span>
                               <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
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
