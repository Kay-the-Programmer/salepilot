import React, { useEffect, useState } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';

declare global {
    interface Window {
        electronAPI?: {
            minimize: () => void;
            maximize: () => void;
            unmaximize: () => void;
            close: () => void;
            isMaximized: () => Promise<boolean>;
        };
    }
}

const TitleBar: React.FC = () => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [isElectron, setIsElectron] = useState(false);

    useEffect(() => {
        const checkElectron = () => {
            if (window.electronAPI) {
                setIsElectron(true);
                window.electronAPI.isMaximized().then(setIsMaximized);
            }
        };
        checkElectron();

        // In a real app, you might want to listen for resize events to update isMaximized
    }, []);

    if (!isElectron) return null;

    const handleMinimize = () => window.electronAPI?.minimize();
    const handleMaximize = () => {
        if (isMaximized) {
            window.electronAPI?.unmaximize();
        } else {
            window.electronAPI?.maximize();
        }
        setIsMaximized(!isMaximized);
    };
    const handleClose = () => window.electronAPI?.close();

    return (
        <div className="flex items-center justify-between h-8 glass-panel-dark text-white select-none overflow-hidden" style={{ WebkitAppRegion: 'drag' } as any}>
            <div className="flex items-center px-3 gap-2">
                <img src="/vite.svg" alt="SalePilot" className="w-4 h-4" />
                <span className="text-xs font-medium opacity-80">SalePilot</span>
            </div>

            <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button
                    onClick={handleMinimize}
                    className="p-2 hover:bg-gray-800 transition-colors h-full flex items-center justify-center w-10"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <button
                    onClick={handleMaximize}
                    className="p-2 hover:bg-gray-800 transition-colors h-full flex items-center justify-center w-10"
                >
                    {isMaximized ? <Copy className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                </button>
                <button
                    onClick={handleClose}
                    className="p-2 hover:bg-red-600 transition-colors h-full flex items-center justify-center w-10"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default TitleBar;
