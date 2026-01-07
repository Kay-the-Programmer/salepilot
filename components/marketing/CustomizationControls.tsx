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
    format, setFormat
}) => {
    return (
        <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Poster Format</label>
                <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-200">
                    <button
                        onClick={() => setFormat('square')}
                        className={`
                            flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-all
                            ${format === 'square' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        Square (1:1)
                    </button>
                    <button
                        onClick={() => setFormat('portrait')}
                        className={`
                            flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-all
                            ${format === 'portrait' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        Portrait (9:16)
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vibe & Tone</label>
                <div className="grid grid-cols-3 gap-2">
                    {(['professional', 'friendly', 'urgent'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTone(t)}
                            className={`
                                py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition-all
                                ${tone === t
                                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                }
                            `}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marketing Message
                    <span className="text-gray-400 font-normal ml-2 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                    <textarea
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="e.g. Limited time offer! Order now."
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[80px] resize-none outline-none"
                    />
                    <SparklesIcon className="absolute right-3 bottom-3 w-4 h-4 text-blue-400 opacity-50" />
                </div>
            </div>

            <div className="text-xs text-gray-400 flex items-center gap-1">
                <SparklesIcon className="w-3 h-3" />
                <span>Tip: Choose a vibe to auto-style colors.</span>
            </div>
        </div>
    );
};

export default CustomizationControls;
