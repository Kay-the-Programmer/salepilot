import React, { useCallback, useRef, useState } from 'react';
import { Modal } from './Modal';

/**
 * Branded confirm dialog — a premium replacement for native `window.confirm`,
 * which looks unstyled and breaks the product feel. Returns a `confirm(...)`
 * that resolves to a boolean, plus a `confirmDialog` node to render once.
 *
 *   const { confirm, confirmDialog } = useConfirm();
 *   if (await confirm({ title: 'Delete?', danger: true })) { ...do it... }
 *   return (<>{...}{confirmDialog}</>);
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

export function useConfirm() {
    const [state, setState] = useState<ConfirmState>({ open: false, title: '' });
    const resolveRef = useRef<((v: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions) =>
        new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
            setState({ ...opts, open: true });
        }), []);

    const settle = useCallback((value: boolean) => {
        resolveRef.current?.(value);
        resolveRef.current = null;
        setState((s) => ({ ...s, open: false }));
    }, []);

    const confirmDialog = (
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
    );

    return { confirm, confirmDialog };
}

export default useConfirm;
