import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import PosIcon from '../sales/PosIcon';
import ReceiptPaper from './ReceiptPaper';
import { api } from '../../services/api';
import type { Sale, StoreSettings } from '../../types';
import type { SnackbarType } from '../../App';
import { COLUMNS } from '../../utils/escpos';
import { PaperWidth, buildReceiptBytes } from '../../utils/receiptEscPos';
import {
    PrinterError,
    PrinterStatus,
    getPaperWidth,
    getPrinterStatus,
    getUnsupportedReason,
    isBluetoothSupported,
    isSerialSupported,
    isUsbSupported,
    printBytes,
    requestBluetoothPrinter,
    requestSerialPrinter,
    requestUsbPrinter,
    setPaperWidth,
} from '../../services/thermalPrinter';

/**
 * Sets up a shop's receipt in four short steps, with the receipt on screen the
 * whole way.
 *
 * The thing being fixed is not that the settings were missing — they all
 * existed — but that they were scattered and invisible. The fields that print
 * on a receipt sat in two unrelated sections of Settings, none of them labelled
 * as having anything to do with receipts, and the only way to see the result
 * was to ring up a sale. A shopkeeper who wanted their phone number on the
 * paper had to already know all of that.
 *
 * So: one flow, plain words, and a live preview built from the actual print
 * bytes (see `ReceiptPaper`) so what they are looking at is what they will be
 * holding. The steps are ordered by what a shopkeeper can answer without
 * getting up — shop details, then tax, then the roll in the machine, then the
 * printer itself, which is the only step that can fail.
 *
 * Deliberately absent: the logo. It is a real setting and it does appear on
 * PDF invoices, but `buildReceiptBytes` has no image support, so a thermal
 * receipt never shows it. Offering it here would be promising something the
 * paper cannot deliver.
 */

interface ReceiptSetupWizardProps {
    isOpen: boolean;
    onClose: () => void;
    settings: StoreSettings;
    /** Lets a parent that holds settings in state refresh after the save. */
    onSaved?: (settings: StoreSettings) => void;
    showSnackbar: (message: string, type?: SnackbarType) => void;
}

const SETUP_DONE_KEY = 'salepilot.receiptSetup.done';

const doneKey = (storeId: string | undefined): string => `${SETUP_DONE_KEY}.${storeId ?? 'unknown'}`;

/** Whether this machine has already been walked through setup for this store. */
export const isReceiptSetupDone = (storeId: string | undefined): boolean => {
    try {
        return localStorage.getItem(doneKey(storeId)) === '1';
    } catch {
        return false;
    }
};

export const markReceiptSetupDone = (storeId: string | undefined): void => {
    try {
        localStorage.setItem(doneKey(storeId), '1');
    } catch {
        // Losing the flag only means the offer appears again, which is survivable.
    }
};

/**
 * Whether to offer setup unprompted.
 *
 * Only for a shop that plainly has not done it — no phone and no address means
 * the receipt currently prints a bare name and nothing else. A shop that has
 * filled those in already knows where the settings are, and does not need a
 * wizard in front of the till.
 */
export const shouldOfferReceiptSetup = (settings: StoreSettings | null | undefined): boolean => {
    if (!settings) return false;
    if (isReceiptSetupDone(settings.storeId)) return false;
    return !settings.phone?.trim() && !settings.address?.trim();
};

/**
 * A stand-in sale, so the preview shows a receipt rather than an empty roll.
 *
 * Exported because the Settings page previews the same thing — two different
 * sample sales would mean two different-looking previews of one receipt.
 */
export const SAMPLE_SALE = {
    transactionId: 'SALE-1700000000000-sample1',
    timestamp: new Date().toISOString(),
    cart: [
        { productId: 'a', name: 'Sugar 1kg', sku: '', price: 34.5, quantity: 2, stock: 0 },
        { productId: 'b', name: 'Cooking Oil 2L', sku: '', price: 89.9, quantity: 1, stock: 0 },
    ],
    subtotal: 158.9,
    discount: 0,
    tax: 0,
    total: 158.9,
    refundStatus: 'none',
    paymentStatus: 'paid',
    channel: 'pos',
    customerName: 'Walk-in customer',
    attendedBy: 'Cashier',
    payments: [{ id: 'p', saleId: 's', date: new Date().toISOString(), amount: 158.9, method: 'CASH' }],
    cashReceived: 200,
    changeDue: 41.1,
} as unknown as Sale;

type StepId = 'shop' | 'tax' | 'paper' | 'printer';

const STEPS: { id: StepId; label: string; blurb: string }[] = [
    { id: 'shop', label: 'Your shop', blurb: 'What prints at the top of every receipt.' },
    { id: 'tax', label: 'Tax & thank-you', blurb: 'Both optional — skip them if they do not apply.' },
    { id: 'paper', label: 'Paper size', blurb: 'Match this to the roll in your printer.' },
    { id: 'printer', label: 'Printer', blurb: 'Connect one, or print from the browser instead.' },
];

const inputCls =
    'w-full h-11 px-3.5 rounded-xl bg-surface-variant border border-brand-border outline-none focus:border-primary text-sm text-brand-text transition';

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
    <label className="block">
        <span className="mb-1 block text-xs font-bold text-brand-text">{label}</span>
        {children}
        {hint && <span className="mt-1 block text-[11px] text-brand-text-muted">{hint}</span>}
    </label>
);

const ReceiptSetupWizard: React.FC<ReceiptSetupWizardProps> = ({
    isOpen,
    onClose,
    settings,
    onSaved,
    showSnackbar,
}) => {
    const [step, setStep] = useState(0);
    const [draft, setDraft] = useState<StoreSettings>(settings);
    const [paper, setPaper] = useState<PaperWidth>(80);
    const [printer, setPrinter] = useState<PrinterStatus | null>(null);
    const [busy, setBusy] = useState(false);
    const [usbBlocked, setUsbBlocked] = useState(false);
    const [showPreviewOnMobile, setShowPreviewOnMobile] = useState(false);

    const refreshPrinter = useCallback(async () => {
        setPrinter(await getPrinterStatus().catch(() => null));
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        setStep(0);
        setDraft(settings);
        setPaper(getPaperWidth());
        setShowPreviewOnMobile(false);
        setUsbBlocked(false);
        refreshPrinter();
    }, [isOpen, settings, refreshPrinter]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    const set = (patch: Partial<StoreSettings>) => setDraft(d => ({ ...d, ...patch }));

    // Rebuilt on every keystroke, which is cheap — it is a few hundred bytes of
    // string building — and is what makes the preview feel like paper coming
    // out of the machine rather than a form that needs submitting.
    const previewBytes = useMemo(
        () => buildReceiptBytes(SAMPLE_SALE, draft, { paperWidth: paper }),
        [draft, paper],
    );

    if (!isOpen) return null;

    const unsupported = getUnsupportedReason();
    const isLast = step === STEPS.length - 1;
    // The shop name prints double-width, so only half the roll's columns fit.
    const nameBudget = Math.floor(COLUMNS[paper] / 2);
    const nameTooLong = (draft.name || '').length > nameBudget;

    const persist = async (): Promise<boolean> => {
        setBusy(true);
        try {
            setPaperWidth(paper);
            const saved = await api.put<StoreSettings>('/settings', draft);
            onSaved?.(saved ?? draft);
            markReceiptSetupDone(draft.storeId);
            return true;
        } catch {
            showSnackbar('Could not save your receipt settings. Check your connection and try again.', 'error');
            return false;
        } finally {
            setBusy(false);
        }
    };

    const connect = async (request: () => Promise<{ label: string }>) => {
        setBusy(true);
        setUsbBlocked(false);
        try {
            const p = await request();
            showSnackbar(`Connected to ${p.label}.`, 'success');
        } catch (err) {
            // A printer Windows is holding is not a retry — it is a dead end in
            // the browser, and the only thing worth doing is naming the way out.
            // A toast would scroll away; this stays on screen until it is acted on.
            if (err instanceof PrinterError && err.kind === 'usb-blocked-windows') {
                setUsbBlocked(true);
            } else {
                showSnackbar(
                    err instanceof PrinterError ? err.message : 'Could not connect to that printer.',
                    'error',
                );
            }
        } finally {
            setBusy(false);
            await refreshPrinter();
        }
    };

    /** Print the shop's own receipt, not a generic page — that is the proof. */
    const testPrint = async () => {
        setBusy(true);
        try {
            setPaperWidth(paper);
            await printBytes(buildReceiptBytes(SAMPLE_SALE, draft, { paperWidth: paper }));
            showSnackbar('Test receipt sent — check the paper.', 'success');
        } catch (err) {
            showSnackbar(
                err instanceof PrinterError ? err.message : 'Could not reach the printer.',
                'error',
            );
        } finally {
            setBusy(false);
        }
    };

    const finish = async () => {
        if (await persist()) {
            showSnackbar('Receipt setup saved.', 'success');
            onClose();
        }
    };

    const stepBody = () => {
        switch (STEPS[step].id) {
            case 'shop':
                return (
                    <div className="space-y-3">
                        <Field label="Shop name" hint="Printed large at the very top.">
                            <input
                                className={inputCls}
                                value={draft.name || ''}
                                onChange={e => set({ name: e.target.value })}
                                placeholder="e.g. Kabwata Hardware"
                                autoFocus
                            />
                        </Field>
                        {nameTooLong && (
                            // The preview already shows the name wrapping, but
                            // "why is my shop on three lines" is exactly where a
                            // first-time user needs the answer, not the symptom.
                            <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                                That name is longer than the paper. It still prints, but it will run onto
                                more than one line — about {nameBudget} letters fit across the top.
                            </p>
                        )}
                        <Field label="Phone number" hint="So a customer can call you about their purchase.">
                            <input
                                className={inputCls}
                                type="tel"
                                value={draft.phone || ''}
                                onChange={e => set({ phone: e.target.value })}
                                placeholder="+260 97 1234567"
                            />
                        </Field>
                        <Field label="Address" hint="Kept short — long addresses wrap onto extra lines.">
                            <textarea
                                className={`${inputCls} h-auto py-3`}
                                rows={2}
                                value={draft.address || ''}
                                onChange={e => set({ address: e.target.value })}
                                placeholder="Plot 4419 Chilimbulu Road, Lusaka"
                            />
                        </Field>
                    </div>
                );

            case 'tax':
                return (
                    <div className="space-y-3">
                        <Field label="TPIN" hint="Only if you are registered for tax. Leave blank if not.">
                            <input
                                className={inputCls}
                                value={draft.tpin || ''}
                                onChange={e => set({ tpin: e.target.value })}
                                placeholder="e.g. 1002003004"
                            />
                        </Field>
                        <Field label="Thank-you note" hint="Printed at the bottom, above the barcode.">
                            <textarea
                                className={`${inputCls} h-auto py-3`}
                                rows={2}
                                value={draft.receiptMessage || ''}
                                onChange={e => set({ receiptMessage: e.target.value })}
                                placeholder="Thank you for shopping with us!"
                            />
                        </Field>
                    </div>
                );

            case 'paper':
                return (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {([58, 80] as PaperWidth[]).map(w => (
                                <button
                                    key={w}
                                    type="button"
                                    onClick={() => setPaper(w)}
                                    className={`rounded-xl border p-3 text-left transition ${
                                        paper === w
                                            ? 'border-primary bg-primary/10'
                                            : 'border-brand-border hover:bg-surface-variant'
                                    }`}
                                >
                                    <span className="block text-sm font-bold text-brand-text">{w} mm</span>
                                    <span className="mt-0.5 block text-[11px] text-brand-text-muted">
                                        {w === 58
                                            ? 'The narrow roll. Nearly all pocket and small counter printers.'
                                            : 'The wide roll. Larger counter printers.'}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <p className="rounded-lg bg-surface-variant px-3 py-2 text-[11px] text-brand-text-muted">
                            Not sure? Measure the roll, or just try one and press{' '}
                            <strong>Print test receipt</strong> on the next step. If the prices on the right
                            edge are missing or the lines wrap oddly, it is the other size.
                        </p>
                    </div>
                );

            case 'printer':
                return (
                    <div className="space-y-3">
                        {unsupported ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                {unsupported === 'ios' ? (
                                    <>
                                        <p className="font-bold">iPhone and iPad cannot connect to a receipt printer</p>
                                        <p className="mt-1">
                                            Your receipt is still set up and will print through the normal print
                                            dialog. For a pocket printer, use Chrome on Android or the desktop app.
                                        </p>
                                    </>
                                ) : unsupported === 'insecure-context' ? (
                                    <>
                                        <p className="font-bold">Printer access needs a secure connection</p>
                                        <p className="mt-1">
                                            Open SalePilot at its <strong>https://</strong> address and the printer
                                            options will appear here.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-bold">This browser cannot connect to a printer directly</p>
                                        <p className="mt-1">Use Chrome or Edge, or install the desktop app.</p>
                                    </>
                                )}
                            </div>
                        ) : usbBlocked ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 space-y-2">
                                <p className="font-bold">This printer needs the desktop app</p>
                                <p>
                                    Windows reserves receipt printers for itself, so no web browser can
                                    use one &mdash; not Chrome, not Edge, and nothing we can change here.
                                    Your printer is fine.
                                </p>
                                <p>
                                    <strong>Install the SalePilot desktop app on this computer.</strong> It
                                    finds this printer on its own the first time it starts &mdash; there is
                                    nothing to install for the printer and nothing to set up.
                                </p>
                                <p className="text-[11px]">
                                    Carry on and finish setup here: your receipt details are saved to your
                                    shop, so the desktop app will already have them.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setUsbBlocked(false)}
                                    className="text-[11px] font-bold underline"
                                >
                                    Try a different printer
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="rounded-lg border border-brand-border p-3">
                                    {printer?.transport ? (
                                        <p className="flex items-center gap-2 text-sm">
                                            <span
                                                className={`h-2 w-2 shrink-0 rounded-full ${printer.ready ? 'bg-success' : 'bg-amber-500'}`}
                                                aria-hidden="true"
                                            />
                                            <span className="truncate font-semibold text-brand-text">{printer.label}</span>
                                        </p>
                                    ) : (
                                        <p className="text-sm text-brand-text-muted">
                                            No printer connected yet. That is fine — receipts will open in the
                                            normal print dialog instead.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {isBluetoothSupported() && (
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => connect(requestBluetoothPrinter)}
                                            className="flex w-full items-center gap-3 rounded-xl border border-brand-border p-3 text-left hover:bg-surface-variant disabled:opacity-50"
                                        >
                                            <PosIcon name="bluetooth" size={20} />
                                            <span>
                                                <span className="block text-sm font-bold text-brand-text">
                                                    A pocket or mobile printer
                                                </span>
                                                <span className="block text-[11px] text-brand-text-muted">
                                                    Battery powered, connects wirelessly. Switch it on first.
                                                </span>
                                            </span>
                                        </button>
                                    )}
                                    {isUsbSupported() && (
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => connect(requestUsbPrinter)}
                                            className="flex w-full items-center gap-3 rounded-xl border border-brand-border p-3 text-left hover:bg-surface-variant disabled:opacity-50"
                                        >
                                            <PosIcon name="usb" size={20} />
                                            <span>
                                                <span className="block text-sm font-bold text-brand-text">
                                                    A printer on my counter, by cable
                                                </span>
                                                <span className="block text-[11px] text-brand-text-muted">
                                                    Plugged into this computer with a USB cable.
                                                </span>
                                            </span>
                                        </button>
                                    )}
                                    {isSerialSupported() && (
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => connect(requestSerialPrinter)}
                                            className="flex w-full items-center gap-3 rounded-xl border border-brand-border p-3 text-left hover:bg-surface-variant disabled:opacity-50"
                                        >
                                            <PosIcon name="cable" size={20} />
                                            <span>
                                                <span className="block text-sm font-bold text-brand-text">
                                                    A printer on a COM port
                                                </span>
                                                <span className="block text-[11px] text-brand-text-muted">
                                                    Try this if the cable option above did not find it.
                                                </span>
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        <button
                            type="button"
                            disabled={busy || !printer?.transport}
                            onClick={testPrint}
                            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
                        >
                            Print test receipt
                        </button>
                        {!printer?.transport && !unsupported && (
                            <p className="text-center text-[11px] text-brand-text-muted">
                                Connect a printer above to try a test print.
                            </p>
                        )}
                    </div>
                );
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label="Receipt setup">
            <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-brand-border bg-surface shadow-xl">
                <div className="flex shrink-0 items-center justify-between border-b border-brand-border px-5 py-4">
                    <div>
                        <h2 className="text-base font-bold text-brand-text">Set up your receipt</h2>
                        <p className="text-[11px] text-brand-text-muted">
                            Step {step + 1} of {STEPS.length} — {STEPS[step].label}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="text-brand-text-muted hover:text-brand-text">
                        <PosIcon name="close" size={20} />
                    </button>
                </div>

                {/* Progress: four bars rather than a percentage, so "how much
                    is left" is answerable at a glance without reading. */}
                <div className="flex shrink-0 gap-1 px-5 pt-3" aria-hidden="true">
                    {STEPS.map((s, i) => (
                        <span
                            key={s.id}
                            className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-brand-border'}`}
                        />
                    ))}
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto p-5 md:grid-cols-[1fr_auto]">
                    <div>
                        <p className="mb-3 text-sm text-brand-text-muted">{STEPS[step].blurb}</p>
                        {stepBody()}

                        <button
                            type="button"
                            onClick={() => setShowPreviewOnMobile(v => !v)}
                            className="mt-4 w-full rounded-lg border border-brand-border py-2 text-xs font-bold text-brand-text md:hidden"
                        >
                            {showPreviewOnMobile ? 'Hide preview' : 'Show receipt preview'}
                        </button>
                    </div>

                    <div className={`${showPreviewOnMobile ? 'block' : 'hidden'} md:block`}>
                        <p className="mb-2 text-center text-[11px] font-black uppercase tracking-wider text-brand-text-muted">
                            Your receipt
                        </p>
                        <ReceiptPaper bytes={previewBytes} paperWidth={paper} />
                        <p className="mt-2 max-w-[16rem] text-center text-[11px] text-brand-text-muted">
                            A sample sale, laid out exactly as it will print.
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-2 border-t border-brand-border px-5 py-3">
                    <button
                        type="button"
                        onClick={() => (step === 0 ? onClose() : setStep(s => s - 1))}
                        className="rounded-lg px-3 py-2 text-sm font-bold text-brand-text-muted hover:text-brand-text"
                    >
                        {step === 0 ? 'Cancel' : 'Back'}
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => (isLast ? finish() : setStep(s => s + 1))}
                        className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                        {isLast ? (busy ? 'Saving…' : 'Save & finish') : 'Next'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ReceiptSetupWizard;
