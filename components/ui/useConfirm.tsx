import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal } from './Modal';

/**
 * The app's one confirm dialog.
 *
 * There used to be three ways to ask "are you sure": this hook, a separate
 * `ConfirmationModal` component with its own glass styling, and plain
 * `window.confirm`. Which one a screen used was an accident of when it was
 * written, so the same destructive action looked different in three places and
 * one of them looked like a browser dialog.
 *
 * It is a provider rather than per-component state because the asking and the
 * rendering want to be in different places. As a hook it returned a
 * `confirmDialog` node the caller had to remember to render, which meant a
 * caller that forgot got a promise that never settled — a delete button that
 * silently does nothing. It also ruled out confirming from anywhere that isn't
 * rendering, which is where a fair amount of the app's deleting happens.
 *
 *   const { confirm } = useConfirm();
 *   if (await confirm({ title: 'Delete?', danger: true })) { ...do it... }
 */
export interface ConfirmOptions {
    title: string;
    message?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
    open: boolean;
}

interface ConfirmContextValue {
    confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

/** Mounted once, above every route, next to the other global hosts. */
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ConfirmState>({ open: false, title: '' });
    const resolveRef = useRef<((v: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions) =>
        new Promise<boolean>((resolve) => {
            // A second ask while one is open would otherwise leave the first
            // promise hanging forever; treat it as declined.
            resolveRef.current?.(false);
            resolveRef.current = resolve;
            setState({ ...opts, open: true });
        }), []);

    const settle = useCallback((value: boolean) => {
        resolveRef.current?.(value);
        resolveRef.current = null;
        setState((s) => ({ ...s, open: false }));
    }, []);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <Modal
                open={state.open}
                onClose={() => settle(false)}
                size="sm"
                title={state.title}
                icon={
                    <span
                        className="material-symbols-rounded text-[22px]"
                        style={{ color: state.danger ? 'rgb(var(--color-danger))' : 'rgb(var(--color-primary, 12 143 110))' }}
                    >
                        {state.danger ? 'warning' : 'help'}
                    </span>
                }
            >
                <div className="p-6 pt-2">
                    {state.message && <p className="text-sm text-brand-text-muted leading-relaxed">{state.message}</p>}
                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => settle(false)}
                            className="px-4 py-2.5 rounded-xl text-sm font-bold text-brand-text-muted hover:bg-surface-variant transition active:scale-95"
                        >
                            {state.cancelLabel || 'Cancel'}
                        </button>
                        <button
                            type="button"
                            onClick={() => settle(true)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition active:scale-95 ${state.danger ? 'bg-danger hover:opacity-90' : 'bg-sp-amber hover:bg-[#e86d12]'}`}
                        >
                            {state.confirmLabel || 'Confirm'}
                        </button>
                    </div>
                </div>
            </Modal>
        </ConfirmContext.Provider>
    );
};

export function useConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
    return ctx;
}

export default useConfirm;
