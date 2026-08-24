import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PosIcon from './PosIcon';
import { PaperWidth, buildTestBytes } from '../../utils/receiptEscPos';
import {
    PrinterError,
    PrinterStatus,
    forgetPrinter,
    getOpenDrawer,
    getPaperWidth,
    getPrinterStatus,
    isBluetoothSupported,
    isSerialSupported,
    isSupported,
    isUsbSupported,
    printBytes,
    reconnect,
    requestBluetoothPrinter,
    requestSerialPrinter,
    requestUsbPrinter,
    setOpenDrawer,
    setPaperWidth,
} from '../../services/thermalPrinter';

interface PrinterSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/** Charge below this is worth warning about — a pocket printer at 15% will not
 *  finish the shift, and it fails by dropping the connection mid-receipt. */
const LOW_BATTERY_PERCENT = 20;

const NO_PRINTER: PrinterStatus = {
    transport: null,
    label: null,
    ready: false,
    needsReconnect: false,
    batteryPercent: null,
};

/**
 * Connect this till to its receipt printer.
 *
 * The browser owns the device grant, so "connect" opens its picker rather than
 * listing printers ourselves — a page cannot see the USB bus or scan for
 * Bluetooth until the user points at a device. Once granted, the browser hands
 * the same device back later, though a Bluetooth grant does not always survive
 * a reload; that case gets its own "Reconnect" rather than being reported as
 * having no printer at all.
 */
const PrinterSettingsModal: React.FC<PrinterSettingsModalProps> = ({ isOpen, onClose }) => {
    const [status, setStatus] = useState<PrinterStatus>(NO_PRINTER);
    const [paper, setPaper] = useState<PaperWidth>(80);
    const [drawer, setDrawer] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

    const refresh = useCallback(async () => {
        setStatus(await getPrinterStatus());
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        setPaper(getPaperWidth());
        setDrawer(getOpenDrawer());
        setMessage(null);
        refresh();
    }, [isOpen, refresh]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const run = async (fn: () => Promise<void>) => {
        setBusy(true);
        setMessage(null);
        try {
            await fn();
        } catch (err) {
            setMessage({
                text: err instanceof PrinterError ? err.message : 'Something went wrong talking to the printer.',
                error: true,
            });
        } finally {
            setBusy(false);
            await refresh();
        }
    };

    const connect = (request: () => Promise<{ label: string }>) => run(async () => {
        const p = await request();
        setMessage({ text: `Connected to ${p.label}.`, error: false });
    });

    // Persist first, then print — the test has to exercise the settings as they
    // will actually be used, not the ones in place when the modal opened.
    const testPrint = () => run(async () => {
        setPaperWidth(paper);
        setOpenDrawer(drawer);
        await printBytes(buildTestBytes(paper, status.label ?? 'unknown'));
        setMessage({ text: 'Test sent. Check the paper.', error: false });
    });

    const disconnect = () => {
        forgetPrinter();
        setStatus(NO_PRINTER);
        setMessage({ text: 'Printer forgotten. Receipts will use the browser print dialog.', error: false });
    };

    const save = () => {
        setPaperWidth(paper);
        setOpenDrawer(drawer);
        onClose();
    };

    const lowBattery =
        status.batteryPercent !== null && status.batteryPercent <= LOW_BATTERY_PERCENT;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-lg rounded-xl bg-surface border border-brand-border shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
                    <h2 className="text-base font-bold text-brand-text">Receipt printer</h2>
                    <button type="button" onClick={onClose} aria-label="Close" className="text-brand-text-muted hover:text-brand-text">
                        <PosIcon name="close" size={20} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {!isSupported() ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                            This browser cannot talk to a receipt printer directly. Use Chrome or Edge —
                            on Android too — or install the SalePilot desktop app. Receipts still print
                            through the normal browser dialog.
                        </div>
                    ) : (
                        <>
                            <div className="rounded-lg border border-brand-border p-3">
                                <p className="text-[11px] font-black uppercase tracking-wider text-brand-text-muted mb-1">Printer</p>

                                {status.transport ? (
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex min-w-0 items-center gap-2">
                                            <span
                                                className={`h-2 w-2 shrink-0 rounded-full ${status.ready ? 'bg-success' : 'bg-amber-500'}`}
                                                aria-hidden="true"
                                            />
                                            <span className="truncate text-sm font-semibold text-brand-text">{status.label}</span>
                                            {status.batteryPercent !== null && (
                                                <span className={`shrink-0 text-[11px] font-bold ${lowBattery ? 'text-danger' : 'text-brand-text-muted'}`}>
                                                    {status.batteryPercent}%
                                                </span>
                                            )}
                                        </span>
                                        <span className="flex shrink-0 items-center gap-3">
                                            {status.needsReconnect && (
                                                <button type="button" disabled={busy} onClick={() => connect(reconnect)}
                                                    className="text-xs font-bold text-primary hover:underline disabled:opacity-50">
                                                    Reconnect
                                                </button>
                                            )}
                                            <button type="button" onClick={disconnect} className="text-xs font-bold text-danger hover:underline">
                                                Forget
                                            </button>
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-brand-text-muted">
                                        None connected — receipts use the browser print dialog.
                                    </p>
                                )}

                                {status.needsReconnect && (
                                    <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
                                        Saved, but this browser needs one tap to open the link again after a
                                        refresh. Tap <strong>Reconnect</strong> before the first sale.
                                    </p>
                                )}
                                {lowBattery && (
                                    <p className="mt-2 rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-danger">
                                        Battery is low. A pocket printer drops the connection mid-receipt when
                                        it runs flat — charge it before the shift.
                                    </p>
                                )}

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {isBluetoothSupported() && (
                                        <button type="button" disabled={busy} onClick={() => connect(requestBluetoothPrinter)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-bold text-brand-text hover:bg-surface-variant disabled:opacity-50">
                                            <PosIcon name="bluetooth" size={16} /> Bluetooth printer
                                        </button>
                                    )}
                                    {isUsbSupported() && (
                                        <button type="button" disabled={busy} onClick={() => connect(requestUsbPrinter)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-bold text-brand-text hover:bg-surface-variant disabled:opacity-50">
                                            <PosIcon name="usb" size={16} /> USB printer
                                        </button>
                                    )}
                                    {isSerialSupported() && (
                                        <button type="button" disabled={busy} onClick={() => connect(requestSerialPrinter)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-bold text-brand-text hover:bg-surface-variant disabled:opacity-50">
                                            <PosIcon name="cable" size={16} /> Serial printer
                                        </button>
                                    )}
                                </div>
                                <p className="mt-2 text-[11px] text-brand-text-muted">
                                    Pocket and mobile printers connect over Bluetooth — switch the printer on,
                                    then pick it by name. Counter printers on a cable are usually USB; choose
                                    serial if the printer shows up as a COM port instead.
                                </p>
                            </div>

                            <div>
                                <p className="text-[11px] font-black uppercase tracking-wider text-brand-text-muted mb-1.5">Paper width</p>
                                <div className="flex gap-2">
                                    {([58, 80] as PaperWidth[]).map(w => (
                                        <button key={w} type="button" onClick={() => setPaper(w)}
                                            className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${paper === w ? 'border-primary bg-primary/10 text-primary' : 'border-brand-border text-brand-text'}`}>
                                            {w} mm
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-1.5 text-[11px] text-brand-text-muted">
                                    Set this to the roll actually loaded — pocket printers are almost always
                                    58&nbsp;mm. An 80&nbsp;mm layout on a 58&nbsp;mm roll loses the right-hand
                                    column, which is where the prices are.
                                </p>
                            </div>

                            <label className="flex items-start gap-2.5 cursor-pointer">
                                <input type="checkbox" checked={drawer} onChange={e => setDrawer(e.target.checked)} className="mt-0.5" />
                                <span className="text-sm text-brand-text">
                                    Open the cash drawer on each receipt
                                    <span className="block text-[11px] text-brand-text-muted">
                                        Only works for a drawer wired to the printer&rsquo;s RJ11 port.
                                    </span>
                                </span>
                            </label>
                        </>
                    )}

                    {message && (
                        <p className={`text-xs ${message.error ? 'text-danger' : 'text-success'}`}>{message.text}</p>
                    )}
                </div>

                <div className="flex justify-end gap-2 px-5 py-4 border-t border-brand-border bg-surface-variant/40">
                    <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-bold text-brand-text-muted hover:text-brand-text">
                        Cancel
                    </button>
                    <button type="button" disabled={busy || !status.ready} onClick={testPrint}
                        className="rounded-lg border border-brand-border px-3 py-2 text-sm font-bold text-brand-text hover:bg-surface disabled:opacity-50">
                        {busy ? 'Working…' : 'Test print'}
                    </button>
                    <button type="button" onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90">
                        Save
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default PrinterSettingsModal;
