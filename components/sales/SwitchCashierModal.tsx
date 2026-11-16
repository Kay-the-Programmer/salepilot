import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { switchCashier, setTillPin, getTillPin } from '../../services/authService';

/**
 * Hand the till to another cashier with their 4–6 digit PIN, or set your own.
 * After a switch the page reloads as the new cashier; the cart and held sales
 * are kept on the device, so nothing in progress is lost.
 */
const SwitchCashierModal: React.FC<{ isOpen: boolean; onClose: () => void; currentName?: string }> = ({ isOpen, onClose, currentName }) => {
    const [mode, setMode] = useState<'switch' | 'set'>('switch');
    const [pin, setPin] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ text: string; ok?: boolean } | null>(null);
    const [hasPin, setHasPin] = useState<boolean | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setPin(''); setMsg(null); setMode('switch');
        getTillPin().then(r => setHasPin(r.hasTillPin)).catch(() => setHasPin(null));
    }, [isOpen]);

    const submit = async (value = pin) => {
        if (value.length < 4 || busy) return;
        setBusy(true);
        setMsg(null);
        try {
            if (mode === 'switch') {
                const u = await switchCashier(value);
                setMsg({ text: `Over to ${u.name}…`, ok: true });
                setTimeout(() => window.location.reload(), 300);
            } else {
                await setTillPin(value);
                setHasPin(true);
                setMode('switch');
                setPin('');
                setMsg({ text: 'Your till PIN is saved.', ok: true });
            }
        } catch (e: any) {
            setMsg({ text: e?.message || 'That didn’t work.' });
            setPin('');
        } finally {
            setBusy(false);
        }
    };

    // Physical keyboard too: digits, Backspace, Enter.
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (/^\d$/.test(e.key)) setPin(p => (p.length < 6 ? p + e.key : p));
            else if (e.key === 'Backspace') setPin(p => p.slice(0, -1));
            else if (e.key === 'Enter') void submit();
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    if (!isOpen) return null;
    const press = (d: string) => setPin(p => (p.length < 6 ? p + d : p));
    const key = 'h-14 rounded-xl text-xl font-bold bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white active:scale-95 transition disabled:opacity-40';

    return createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-label={mode === 'switch' ? 'Switch cashier' : 'Set your till PIN'}
                className="w-full max-w-xs rounded-2xl bg-white dark:bg-[#0f1a2e] p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{mode === 'switch' ? 'Switch cashier' : 'Set your till PIN'}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {mode === 'switch'
                        ? `${currentName ? `${currentName} is on the till. ` : ''}Next cashier: type your PIN.`
                        : 'Choose 4 to 6 digits only you know.'}
                </p>
                <div className="flex justify-center gap-2 my-5" aria-live="polite">
                    {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
                        <span key={i} className={`w-3.5 h-3.5 rounded-full ${i < pin.length ? 'bg-sp-navy dark:bg-white' : 'bg-gray-200 dark:bg-white/20'}`} />
                    ))}
                </div>
                {msg && <p className={`text-sm text-center mb-3 ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>}
                <div className="grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => <button key={d} type="button" className={key} disabled={busy} onClick={() => press(d)}>{d}</button>)}
                    <button type="button" className={key} disabled={busy || !pin} onClick={() => setPin(p => p.slice(0, -1))} aria-label="Delete">⌫</button>
                    <button type="button" className={key} disabled={busy} onClick={() => press('0')}>0</button>
                    <button type="button" className={`${key} !bg-sp-navy !text-white`} disabled={busy || pin.length < 4} onClick={() => void submit()} aria-label="OK">OK</button>
                </div>
                <div className="flex justify-between mt-4 text-sm">
                    <button type="button" className="font-semibold text-sp-navy dark:text-blue-300"
                        onClick={() => { setMode(mode === 'switch' ? 'set' : 'switch'); setPin(''); setMsg(null); }}>
                        {mode === 'switch' ? (hasPin ? 'Change my PIN' : 'Set my PIN') : 'Back'}
                    </button>
                    <button type="button" className="text-gray-500" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default SwitchCashierModal;
