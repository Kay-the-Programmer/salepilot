import React from 'react';
import { SparklesIcon } from '../icons';

interface Props {
    tone: 'professional' | 'friendly' | 'urgent';
    setTone: (tone: 'professional' | 'friendly' | 'urgent') => void;
    customText: string;
    setCustomText: (text: string) => void;
    format: 'square' | 'portrait';
    setFormat: (format: 'square' | 'portrait') => void;
    onGenerate: () => void; // Optional if auto-generating
}

const CustomizationControls: React.FC<Props> = ({
    tone, setTone,
    customText, setCustomText,
    format, setFormat,
    onGenerate
}) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Poster Format */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Poster Format</label>
                    <span className="text-[10px] text-gray-400 dark:text-slate-600 font-mono">Aspect Ratio</span>
                </div>
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-800/80 rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-inner">
                    <button
                        onClick={() => setFormat('square')}
                        className={`
                            flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all duration-300
                            ${format === 'square'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xl shadow-blue-500/10'
                                : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}
                        `}
                    >
                        Square 1:1
                    </button>
                    <button
                        onClick={() => setFormat('portrait')}
                        className={`
                            flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all duration-300
                            ${format === 'portrait'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xl shadow-blue-500/10'
                                : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}
                        `}
                    >
                        Portrait 9:16
                    </button>
                </div>
            </div>

            {/* Vibe & Style */}
            <div className="space-y-4">
                <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Visual Vibe</label>
                <div className="grid grid-cols-1 gap-2">
                    {(['professional', 'friendly', 'urgent'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTone(t)}
                            className={`
                                flex items-center justify-between py-3.5 px-4 rounded-2xl text-xs font-bold capitalize border transition-all duration-300
                                ${tone === t
                                    ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-500/50 dark:border-blue-400/50 text-blue-700 dark:text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                    : 'bg-white dark:bg-slate-900/40 border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-600 shadow-sm'
                                }
                            `}
                        >
                            <span>{t}</span>
                            {tone === t && (
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Marketing Copy */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Marketing Hooks</label>
                    <span className="text-[10px] text-gray-400 dark:text-slate-600">AI Context</span>
                </div>
                <div className="relative group">
                    <textarea
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="e.g. Limited Edition Collection..."
                        className="w-full p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm xl:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 min-h-[140px] resize-none outline-none transition-all duration-300"
                    />
                    <div className="absolute right-4 bottom-4 p-2 bg-white dark:bg-slate-700 rounded-xl shadow-lg border border-gray-100 dark:border-slate-600 transition-transform duration-300 group-focus-within:scale-110">
                        <SparklesIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    </div>
                </div>
            </div>

            {/* Primary Action */}
            <div className="pt-4 sticky bottom-0 bg-white dark:bg-slate-950/80 backdrop-blur-md">
                <button
                    onClick={onGenerate}
                    className="w-full relative overflow-hidden flex items-center justify-center gap-3 py-5 px-6 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-[0.97] group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                    <SparklesIcon className="w-5 h-5 group-hover:rotate-12 transition-transform duration-500" />
                    <span>Generate Cinematic Poster</span>
                </button>

                <div className="mt-4 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Nano Banana AI Studio
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomizationControls;
