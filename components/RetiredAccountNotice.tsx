interface RetiredAccountNoticeProps {
    onSignOut: () => void;
}

/**
 * Shown to customer and supplier accounts. Those roles belonged to the online
 * store and the supplier portal, both retired. Their records are kept; this
 * screen only explains why there is nothing to open and offers a way out, so
 * the app never redirects them around in a loop.
 */
export default function RetiredAccountNotice({ onSignOut }: RetiredAccountNoticeProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-6">
            <div className="max-w-md w-full rounded-2xl border border-brand-border bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
                <h1 className="text-xl font-extrabold tracking-tight text-brand-text">This account type has been retired</h1>
                <p className="mt-3 text-sm text-brand-text-muted">
                    The online store and the supplier portal are no longer part of SalePilot, so there is nothing for this account to open. Your records are kept.
                </p>
                <button
                    type="button"
                    onClick={onSignOut}
                    className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white"
                >
                    Sign out
                </button>
            </div>
        </div>
    );
}
