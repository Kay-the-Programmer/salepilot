import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    loadScannerConfig,
    saveScannerConfig,
    BarcodeScannerConfig
} from '../../../hooks/useBarcodeScanner';
import '../../../pages/assistant/assistant.css';

type WizardStep = 'welcome' | 'test' | 'configure' | 'done';

const steps: { id: WizardStep; label: string }[] = [
    { id: 'welcome', label: 'Overview' },
    { id: 'test', label: 'Test' },
    { id: 'configure', label: 'Configure' },
    { id: 'done', label: 'Done' },
];

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
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${done ? 'm3-bg-primary m3-text-on-primary' : active ? 'm3-bg-primary m3-text-on-primary' : 'm3-bg-surface-high m3-text-on-surface-variant'}`}>
                                {done ? <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span> : idx + 1}
                            </div>
                            <span className={`hidden sm:block text-[11px] mt-1 font-medium ${active || done ? 'm3-text-primary' : 'm3-text-on-surface-variant'}`}>{s.label}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 sm:mx-2 mt-[-10px] sm:mt-[-16px] rounded transition-all ${done ? 'm3-bg-primary' : 'm3-bg-surface-high'}`} style={{ minWidth: 20 }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const WelcomeStep: React.FC<{ onNext: () => void }> = ({ onNext }) => (
    <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 p-4 m3-bg-primary-fixed rounded-2xl">
            <span className="material-symbols-outlined m3-text-primary shrink-0" style={{ fontSize: 28 }}>cable</span>
            <div>
                <h3 className="text-[15px] font-bold m3-text-on-surface leading-snug">Physical barcode scanner support</h3>
                <p className="text-[13px] m3-text-on-surface-variant mt-1 leading-relaxed">USB and Bluetooth scanners emulate a keyboard — when you scan, the device types the digits and presses Enter.</p>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
                { icon: 'usb', label: 'USB HID scanners', desc: 'Plug-and-play via USB' },
                { icon: 'bluetooth', label: 'Bluetooth scanners', desc: 'Pair via system Bluetooth' },
                { icon: 'wifi', label: 'Wireless RF scanners', desc: 'Connect via USB dongle' },
            ].map(item => (
                <div key={item.label} className="p-4 m3-bg-surface-lowest rounded-xl border m3-border-outline-variant flex flex-col items-center text-center gap-1.5 shadow-sm">
                    <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 26 }}>{item.icon}</span>
                    <p className="text-[13px] font-semibold m3-text-on-surface">{item.label}</p>
                    <p className="text-[11px] m3-text-on-surface-variant">{item.desc}</p>
                </div>
            ))}
        </div>
        <div className="flex items-start gap-2 p-4 m3-bg-secondary-fixed rounded-xl">
            <span className="material-symbols-outlined m3-text-secondary shrink-0" style={{ fontSize: 20 }}>lightbulb</span>
            <p className="text-[13px] m3-text-secondary font-medium"><strong>No drivers needed.</strong> Most USB scanners are recognised automatically — just plug in and continue.</p>
        </div>
        <button onClick={onNext} className="w-full py-3 m3-bg-primary m3-text-on-primary font-semibold rounded-xl shadow-sm active:scale-95 transition text-sm">Continue → Test my scanner</button>
    </div>
);

const TestStep: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
    const [lastScan, setLastScan] = useState<string | null>(null);
    const [scanSpeed, setScanSpeed] = useState<number | null>(null);
    const [testValue, setTestValue] = useState('');
    const [detected, setDetected] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const lastKeyTime = useRef<number>(0);
    const firstKeyTime = useRef<number>(0);
    const charCountRef = useRef<number>(0);

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200); }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        const now = Date.now();
        if (charCountRef.current === 0) firstKeyTime.current = now;
        if (e.key !== 'Enter') charCountRef.current++;
        lastKeyTime.current = now;
    }, []);
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setTestValue(e.target.value); }, []);
    const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && testValue.trim().length >= 1) {
            const totalTime = lastKeyTime.current - firstKeyTime.current;
            const chars = charCountRef.current;
            setScanSpeed(chars > 0 ? Math.round(totalTime / chars) : 0);
            setLastScan(testValue.trim());
            setDetected(true);
            setTestValue('');
            charCountRef.current = 0;
        }
    }, [testValue]);

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h3 className="text-[16px] font-bold m3-text-on-surface">Test your scanner</h3>
                <p className="text-[13px] m3-text-on-surface-variant mt-1">Click in the box below, then scan any barcode with your device.</p>
            </div>
            <div className={`relative rounded-2xl border-2 transition-all overflow-hidden cursor-text ${detected ? 'm3-border-primary m3-bg-primary-fixed' : 'border-dashed m3-border-outline-variant m3-bg-surface-container'}`} onClick={() => inputRef.current?.focus()}>
                <div className="p-6 flex flex-col items-center justify-center min-h-[140px] gap-2 text-center">
                    {!detected ? (
                        <>
                            <span className="material-symbols-outlined m3-text-on-surface-variant" style={{ fontSize: 40 }}>barcode_scanner</span>
                            <p className="text-[14px] font-medium m3-text-on-surface-variant">Waiting for scan…</p>
                            <p className="text-[12px] m3-text-outline">Click here, then scan a barcode</p>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 40, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            <p className="text-[15px] font-bold m3-text-primary">Scanner detected!</p>
                            <div className="px-4 py-2 m3-bg-surface-lowest rounded-xl border m3-border-outline-variant font-mono m3-text-on-surface text-[14px] shadow-sm">{lastScan}</div>
                            {scanSpeed !== null && <p className="text-[12px] m3-text-on-surface-variant">~{scanSpeed} ms/char scan speed</p>}
                        </>
                    )}
                </div>
                <input ref={inputRef} type="text" value={testValue} onChange={handleChange} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} className="absolute inset-0 opacity-0 cursor-text" aria-label="Scanner test input" autoComplete="off" />
            </div>
            {detected && <div className="p-4 m3-bg-surface-container rounded-xl text-[13px] m3-text-on-surface-variant">Your scanner is working correctly. Scan another to re-test, or continue to configure settings.</div>}
            <div className="flex gap-3">
                <button onClick={onBack} className="flex-1 py-3 m3-bg-surface-high m3-text-on-surface font-semibold rounded-xl active:scale-95 transition text-sm">← Back</button>
                <button onClick={onNext} className="flex-1 py-3 m3-bg-primary m3-text-on-primary font-semibold rounded-xl shadow-sm active:scale-95 transition text-sm">Continue →</button>
            </div>
        </div>
    );
};

const ConfigureStep: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
    const [config, setConfig] = useState<BarcodeScannerConfig>(loadScannerConfig);
    const handleSave = () => { saveScannerConfig(config); window.dispatchEvent(new Event('sp_scanner_config_saved')); onNext(); };
    const rangeCls = 'w-full h-2 m3-bg-surface-high rounded-full appearance-none cursor-pointer';
    const fieldCls = 'w-full px-3 py-2 rounded-lg border m3-border-outline-variant m3-bg-surface-container m3-text-on-surface text-sm font-mono outline-none focus:m3-border-primary';

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h3 className="text-[16px] font-bold m3-text-on-surface">Configure scanner</h3>
                <p className="text-[13px] m3-text-on-surface-variant mt-1">Adjust to match your device. Defaults work for most scanners.</p>
            </div>
            {/* Enable */}
            <div className="flex items-center justify-between p-4 m3-bg-surface-lowest rounded-xl border m3-border-outline-variant shadow-sm">
                <div><p className="text-[14px] font-semibold m3-text-on-surface">Enable external scanner</p><p className="text-[12px] m3-text-on-surface-variant mt-0.5">Listen for USB/Bluetooth input in the POS</p></div>
                <button onClick={() => setConfig(c => ({ ...c, enabled: !c.enabled }))} role="switch" aria-checked={config.enabled} className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${config.enabled ? 'm3-bg-primary' : 'm3-bg-surface-high'}`}>
                    <span className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: config.enabled ? 24 : 4 }} />
                </button>
            </div>
            {/* Min length */}
            <div className="p-4 m3-bg-surface-lowest rounded-xl border m3-border-outline-variant shadow-sm space-y-3">
                <div className="flex items-center justify-between"><div><p className="text-[14px] font-semibold m3-text-on-surface">Minimum barcode length</p><p className="text-[12px] m3-text-on-surface-variant mt-0.5">Ignore scans shorter than this</p></div><span className="text-lg font-bold m3-text-primary tabular-nums">{config.minLength}</span></div>
                <input type="range" min={2} max={20} step={1} value={config.minLength} onChange={e => setConfig(c => ({ ...c, minLength: parseInt(e.target.value) }))} className={rangeCls} style={{ accentColor: 'var(--m3-primary)' }} />
                <div className="flex justify-between text-[11px] m3-text-outline"><span>2 chars</span><span>20 chars</span></div>
            </div>
            {/* Delay */}
            <div className="p-4 m3-bg-surface-lowest rounded-xl border m3-border-outline-variant shadow-sm space-y-3">
                <div className="flex items-center justify-between"><div><p className="text-[14px] font-semibold m3-text-on-surface">Max inter-character delay</p><p className="text-[12px] m3-text-on-surface-variant mt-0.5">Increase if characters are missed</p></div><span className="text-lg font-bold m3-text-primary tabular-nums">{config.maxInterCharDelayMs}ms</span></div>
                <input type="range" min={20} max={200} step={10} value={config.maxInterCharDelayMs} onChange={e => setConfig(c => ({ ...c, maxInterCharDelayMs: parseInt(e.target.value) }))} className={rangeCls} style={{ accentColor: 'var(--m3-primary)' }} />
                <div className="flex justify-between text-[11px] m3-text-outline"><span>20ms (fast)</span><span>200ms (slow)</span></div>
            </div>
            {/* Prefix/Suffix */}
            <div className="p-4 m3-bg-surface-lowest rounded-xl border m3-border-outline-variant shadow-sm space-y-3">
                <p className="text-[14px] font-semibold m3-text-on-surface">Prefix / suffix stripping</p>
                <p className="text-[12px] m3-text-on-surface-variant">Remove fixed characters some scanners add.</p>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[12px] font-medium m3-text-on-surface-variant mb-1 block">Prefix</label><input type="text" value={config.prefix} onChange={e => setConfig(c => ({ ...c, prefix: e.target.value }))} placeholder="e.g. %" className={fieldCls} /></div>
                    <div><label className="text-[12px] font-medium m3-text-on-surface-variant mb-1 block">Suffix</label><input type="text" value={config.suffix} onChange={e => setConfig(c => ({ ...c, suffix: e.target.value }))} placeholder="e.g. ?" className={fieldCls} /></div>
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={onBack} className="flex-1 py-3 m3-bg-surface-high m3-text-on-surface font-semibold rounded-xl active:scale-95 transition text-sm">← Back</button>
                <button onClick={handleSave} className="flex-1 py-3 m3-bg-primary m3-text-on-primary font-semibold rounded-xl shadow-sm active:scale-95 transition text-sm">Save & continue →</button>
            </div>
        </div>
    );
};

const DoneStep: React.FC<{ onRestart: () => void }> = ({ onRestart }) => {
    const cfg = loadScannerConfig();
    return (
        <div className="flex flex-col items-center gap-5 py-2">
            <span className="w-20 h-20 rounded-full m3-bg-primary-container m3-text-on-primary-container flex items-center justify-center shadow-md"><span className="material-symbols-outlined" style={{ fontSize: 40, fontVariationSettings: "'FILL' 1" }}>check_circle</span></span>
            <div className="text-center">
                <h3 className="text-[20px] font-bold m3-text-on-surface">All set!</h3>
                <p className="text-[14px] m3-text-on-surface-variant mt-2 max-w-sm">Your external barcode scanner is configured. Head to the Point of Sale and scan a product to try it out.</p>
            </div>
            <div className="w-full p-4 m3-bg-surface-container rounded-xl text-[13px] space-y-1.5">
                <div className="flex justify-between"><span className="m3-text-on-surface-variant">Status</span><span className={`font-semibold ${cfg.enabled ? 'm3-text-primary' : 'm3-text-on-surface-variant'}`}>{cfg.enabled ? 'Enabled' : 'Disabled'}</span></div>
                <div className="flex justify-between"><span className="m3-text-on-surface-variant">Min barcode length</span><span className="font-semibold m3-text-on-surface">{cfg.minLength} chars</span></div>
                <div className="flex justify-between"><span className="m3-text-on-surface-variant">Max char delay</span><span className="font-semibold m3-text-on-surface">{cfg.maxInterCharDelayMs} ms</span></div>
                {cfg.prefix && <div className="flex justify-between"><span className="m3-text-on-surface-variant">Prefix stripped</span><span className="font-mono font-semibold m3-text-on-surface">{cfg.prefix}</span></div>}
                {cfg.suffix && <div className="flex justify-between"><span className="m3-text-on-surface-variant">Suffix stripped</span><span className="font-mono font-semibold m3-text-on-surface">{cfg.suffix}</span></div>}
            </div>
            <div className="flex gap-3 w-full">
                <button onClick={onRestart} className="flex-1 py-3 m3-bg-surface-high m3-text-on-surface font-semibold rounded-xl active:scale-95 transition text-sm">↺ Reconfigure</button>
                <a href="/pos" className="flex-1 py-3 m3-bg-primary m3-text-on-primary font-semibold rounded-xl shadow-sm active:scale-95 transition text-sm text-center">Go to POS →</a>
            </div>
        </div>
    );
};

const BarcodeScannerSection: React.FC = () => {
    const [step, setStep] = useState<WizardStep>('welcome');
    return (
        <div className="sp-assistant">
            <div className="m3-bg-surface-lowest rounded-2xl shadow-sm border m3-border-outline-variant overflow-hidden">
                <div className="px-5 py-4 border-b m3-border-outline-variant">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="w-10 h-10 rounded-xl m3-bg-tertiary-fixed m3-text-tertiary flex items-center justify-center"><span className="material-symbols-outlined">barcode_scanner</span></span>
                        <div><h2 className="text-[16px] font-bold m3-text-on-surface">External barcode scanner</h2><p className="text-[13px] m3-text-on-surface-variant mt-0.5">Setup wizard for USB/HID & Bluetooth devices</p></div>
                    </div>
                    <StepIndicator currentStep={step} />
                </div>
                <div className="p-5">
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
