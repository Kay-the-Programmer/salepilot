import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    loadScannerConfig,
    saveScannerConfig,
    BarcodeScannerConfig
} from '../../../hooks/useBarcodeScanner';

// Step definitions
type WizardStep = 'welcome' | 'test' | 'configure' | 'done';

const steps: { id: WizardStep; label: string }[] = [
    { id: 'welcome', label: 'Overview' },
    { id: 'test', label: 'Test Device' },
    { id: 'configure', label: 'Configure' },
    { id: 'done', label: 'Done' },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

const StepIndicator: React.FC<{ currentStep: WizardStep }> = ({ currentStep }) => {
    const currentIdx = steps.findIndex(s => s.id === currentStep);
    return (
        <div className="flex items-center gap-0">
            {steps.map((s, idx) => {
                const done = idx < currentIdx;
                const active = idx === currentIdx;
                return (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                ${done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                {done ? '✓' : idx + 1}
                            </div>
                            <span className={`hidden sm:block text-[11px] mt-1 font-medium ${active ? 'text-blue-600 dark:text-blue-400' : done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>{s.label}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 sm:mx-2 mt-[-10px] sm:mt-[-16px] rounded transition-all ${done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} style={{ minWidth: 20 }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ─── Welcome Step ──────────────────────────────────────────────────────────────

const WelcomeStep: React.FC<{ onNext: () => void }> = ({ onNext }) => (
    <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
            <div className="text-4xl select-none">🔌</div>
            <div>
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white leading-snug">Physical Barcode Scanner Support</h3>
                <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    USB and Bluetooth barcode scanners work by emulating a keyboard. When you scan a barcode, the device types the digits very quickly and presses <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-[11px] font-mono shadow-sm">Enter</kbd>.
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
                { emoji: '🖥️', label: 'USB HID Scanners', desc: 'Plug-and-play via USB port' },
                { emoji: '📡', label: 'Bluetooth Scanners', desc: 'Pair via system Bluetooth' },
                { emoji: '📱', label: 'Wireless RF Scanners', desc: 'Connect via USB dongle' },
            ].map(item => (
                <div key={item.label} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-white/10 flex flex-col items-center text-center gap-2 shadow-sm">
                    <span className="text-2xl">{item.emoji}</span>
                    <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{item.label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                </div>
            ))}
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
            <p className="text-[13px] text-amber-800 dark:text-amber-200 font-medium">
                💡 <strong>No drivers needed.</strong> Most USB barcode scanners are automatically recognized by your operating system. Simply plug in and proceed.
            </p>
        </div>

        <button
            onClick={onNext}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-95 text-sm"
        >
            Continue → Test My Scanner
        </button>
    </div>
);

// ─── Test Step ─────────────────────────────────────────────────────────────────

const TestStep: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
    const [lastScan, setLastScan] = useState<string | null>(null);
    const [scanSpeed, setScanSpeed] = useState<number | null>(null);
    const [testValue, setTestValue] = useState('');
    const [detected, setDetected] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const lastKeyTime = useRef<number>(0);
    const firstKeyTime = useRef<number>(0);
    const charCountRef = useRef<number>(0);

    // Focus the test field automatically
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 200);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        const now = Date.now();
        if (charCountRef.current === 0) {
            firstKeyTime.current = now;
        }
        if (e.key !== 'Enter') {
            charCountRef.current++;
        }
        lastKeyTime.current = now;
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setTestValue(e.target.value);
    }, []);

    const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && testValue.trim().length >= 1) {
            const totalTime = lastKeyTime.current - firstKeyTime.current;
            const chars = charCountRef.current;
            const msPerChar = chars > 0 ? Math.round(totalTime / chars) : 0;
            setScanSpeed(msPerChar);
            setLastScan(testValue.trim());
            setDetected(true);
            setTestValue('');
            charCountRef.current = 0;
        }
    }, [testValue]);

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Test Your Scanner</h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Click in the box below, then scan any barcode with your device.</p>
            </div>

            <div
                className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-text ${detected ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40 hover:border-blue-400'}`}
                onClick={() => inputRef.current?.focus()}
            >
                <div className="p-6 flex flex-col items-center justify-center min-h-[140px] gap-3">
                    {!detected ? (
                        <>
                            <div className="text-4xl select-none animate-bounce">📷</div>
                            <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400">Waiting for scan…</p>
                            <p className="text-[12px] text-slate-400 dark:text-slate-500">Click here, then scan a barcode</p>
                        </>
                    ) : (
                        <>
                            <div className="text-4xl select-none">✅</div>
                            <p className="text-[15px] font-bold text-emerald-700 dark:text-emerald-300">Scanner Detected!</p>
                            <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-700 font-mono text-emerald-800 dark:text-emerald-200 text-[14px] shadow-sm">{lastScan}</div>
                            {scanSpeed !== null && (
                                <p className="text-[12px] text-slate-500 dark:text-slate-400">~{scanSpeed} ms/char scan speed</p>
                            )}
                        </>
                    )}
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={testValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    className="absolute inset-0 opacity-0 cursor-text"
                    aria-label="Scanner test input"
                    autoComplete="off"
                />
            </div>

            {detected && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-white/10 text-[13px] text-slate-600 dark:text-slate-300">
                    Your scanner is working correctly. Scan another barcode to re-test, or click <strong>Continue</strong> to configure settings.
                </div>
            )}

            <div className="flex gap-3">
                <button onClick={onBack} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all active:scale-95 text-sm">
                    ← Back
                </button>
                <button onClick={onNext} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-95 text-sm">
                    Continue →
                </button>
            </div>
        </div>
    );
};

// ─── Configure Step ────────────────────────────────────────────────────────────

const ConfigureStep: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
    const [config, setConfig] = useState<BarcodeScannerConfig>(loadScannerConfig);

    const handleSave = () => {
        saveScannerConfig(config);
        window.dispatchEvent(new Event('sp_scanner_config_saved'));
        onNext();
    };

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Configure Scanner</h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Adjust these settings to match your device. Defaults work for most scanners.</p>
            </div>

            {/* Enable / Disable */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-white/10 shadow-sm">
                <div>
                    <p className="text-[14px] font-semibold text-slate-900 dark:text-white">Enable External Scanner</p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Listen for USB/Bluetooth barcode input in the POS</p>
                </div>
                <button
                    onClick={() => setConfig(c => ({ ...c, enabled: !c.enabled }))}
                    className={`relative w-12 h-6 rounded-full transition-all duration-200 focus:outline-none ${config.enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                    role="switch"
                    aria-checked={config.enabled}
                >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${config.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Min Length */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-white/10 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[14px] font-semibold text-slate-900 dark:text-white">Minimum Barcode Length</p>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Ignore scans shorter than this (prevents accidental triggers)</p>
                    </div>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">{config.minLength}</span>
                </div>
                <input
                    type="range"
                    min={2}
                    max={20}
                    step={1}
                    value={config.minLength}
                    onChange={e => setConfig(c => ({ ...c, minLength: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                    <span>2 chars</span>
                    <span>20 chars</span>
                </div>
            </div>

            {/* Scan Speed Threshold */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-white/10 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[14px] font-semibold text-slate-900 dark:text-white">Max Inter-Character Delay</p>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Max ms between keystrokes to qualify as a scan. Increase if characters are being missed.</p>
                    </div>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">{config.maxInterCharDelayMs}ms</span>
                </div>
                <input
                    type="range"
                    min={20}
                    max={200}
                    step={10}
                    value={config.maxInterCharDelayMs}
                    onChange={e => setConfig(c => ({ ...c, maxInterCharDelayMs: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                    <span>20ms (fast)</span>
                    <span>200ms (slow)</span>
                </div>
            </div>

            {/* Prefix / Suffix */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-white/10 shadow-sm space-y-3">
                <p className="text-[14px] font-semibold text-slate-900 dark:text-white">Prefix / Suffix Stripping</p>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Some scanners add a fixed prefix or suffix. Enter those characters here to have them automatically removed.</p>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[12px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Prefix</label>
                        <input
                            type="text"
                            value={config.prefix}
                            onChange={e => setConfig(c => ({ ...c, prefix: e.target.value }))}
                            placeholder="e.g. %"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-[12px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Suffix</label>
                        <input
                            type="text"
                            value={config.suffix}
                            onChange={e => setConfig(c => ({ ...c, suffix: e.target.value }))}
                            placeholder="e.g. ?"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <button onClick={onBack} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all active:scale-95 text-sm">
                    ← Back
                </button>
                <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-95 text-sm">
                    Save & Continue →
                </button>
            </div>
        </div>
    );
};

// ─── Done Step ─────────────────────────────────────────────────────────────────

const DoneStep: React.FC<{ onRestart: () => void }> = ({ onRestart }) => {
    const cfg = loadScannerConfig();

    return (
        <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-4xl shadow-md">
                🎉
            </div>
            <div className="text-center">
                <h3 className="text-[20px] font-bold text-slate-900 dark:text-white">All Set!</h3>
                <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                    Your external barcode scanner is now configured. Head to the <strong>Point of Sale</strong> and scan a product barcode to try it out.
                </p>
            </div>

            <div className="w-full p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-white/10 text-[13px] text-slate-600 dark:text-slate-300 space-y-1.5">
                <div className="flex justify-between">
                    <span className="text-slate-400">Status</span>
                    <span className={`font-semibold ${cfg.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{cfg.enabled ? '✓ Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-400">Min barcode length</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{cfg.minLength} chars</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-400">Max char delay</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{cfg.maxInterCharDelayMs} ms</span>
                </div>
                {cfg.prefix && <div className="flex justify-between"><span className="text-slate-400">Prefix stripped</span><span className="font-mono font-semibold text-slate-900 dark:text-white">{cfg.prefix}</span></div>}
                {cfg.suffix && <div className="flex justify-between"><span className="text-slate-400">Suffix stripped</span><span className="font-mono font-semibold text-slate-900 dark:text-white">{cfg.suffix}</span></div>}
            </div>

            <div className="flex gap-3 w-full">
                <button onClick={onRestart} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all active:scale-95 text-sm">
                    ↺ Reconfigure
                </button>
                <a
                    href="/pos"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-95 text-sm text-center"
                >
                    Go to POS →
                </a>
            </div>
        </div>
    );
};

// ─── Main Wizard ───────────────────────────────────────────────────────────────

const BarcodeScannerSection: React.FC = () => {
    const [step, setStep] = useState<WizardStep>('welcome');

    return (
        <div className="px-4 md:px-0 pb-8">
            {/* Card wrapper */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/10 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                            <span className="text-xl">🖨️</span>
                        </div>
                        <div>
                            <h2 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">External Barcode Scanner</h2>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Setup wizard for USB/HID and Bluetooth devices</p>
                        </div>
                    </div>
                    <StepIndicator currentStep={step} />
                </div>

                {/* Body */}
                <div className="p-6">
                    {step === 'welcome' && <WelcomeStep onNext={() => setStep('test')} />}
                    {step === 'test' && <TestStep onNext={() => setStep('configure')} onBack={() => setStep('welcome')} />}
                    {step === 'configure' && <ConfigureStep onNext={() => setStep('done')} onBack={() => setStep('test')} />}
                    {step === 'done' && <DoneStep onRestart={() => setStep('welcome')} />}
                </div>
            </div>
        </div>
    );
};

export default BarcodeScannerSection;
