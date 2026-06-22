import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    /** Optional label to identify where the boundary sits (shown in logs). */
    name?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * App-wide safety net. A render/runtime error in any descendant is caught here
 * instead of unmounting the whole React tree to a blank white screen. Shows a
 * friendly recovery card and logs the error (hook this into Sentry/your logger).
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Replace with your error tracker (e.g. Sentry.captureException(error)).
        console.error(`[ErrorBoundary${this.props.name ? `:${this.props.name}` : ''}]`, error, info?.componentStack);
    }

    private handleReload = () => {
        // A full reload re-runs the app cleanly; the route is preserved.
        window.location.reload();
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div
                role="alert"
                style={{
                    minHeight: '100dvh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 24,
                    background: 'var(--color-bg, #f9f7f4)',
                    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: 420,
                        textAlign: 'center',
                        background: 'var(--color-surface, #ffffff)',
                        border: '1px solid rgba(26,26,46,0.08)',
                        borderRadius: 16,
                        boxShadow: '0 12px 28px rgba(26,26,46,0.12)',
                        padding: '32px 24px',
                    }}
                >
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            margin: '0 auto 16px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#fae3e0',
                            color: '#c0392b',
                        }}
                    >
                        <span className="material-symbols-rounded" style={{ fontSize: 30 }}>error</span>
                    </div>
                    <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' }}>
                        Something went wrong
                    </h1>
                    <p style={{ fontSize: 14, lineHeight: 1.5, color: '#6b6b78', margin: '0 0 24px' }}>
                        The app hit an unexpected error. Your data is safe — reloading usually fixes it.
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={this.handleReload}
                            style={{
                                padding: '11px 20px',
                                border: 'none',
                                borderRadius: 999,
                                background: '#008060',
                                color: '#fff',
                                fontFamily: 'inherit',
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            Reload app
                        </button>
                        <a
                            href="/"
                            style={{
                                padding: '11px 20px',
                                borderRadius: 999,
                                border: '1px solid rgba(26,26,46,0.12)',
                                color: '#2b2b3a',
                                fontSize: 14,
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                            }}
                        >
                            Go home
                        </a>
                    </div>
                    {import.meta.env?.DEV && this.state.error && (
                        <pre
                            style={{
                                marginTop: 20,
                                textAlign: 'left',
                                fontSize: 11,
                                lineHeight: 1.4,
                                color: '#93000a',
                                background: '#fff5f4',
                                border: '1px solid #ffdad6',
                                borderRadius: 8,
                                padding: 12,
                                overflow: 'auto',
                                maxHeight: 160,
                            }}
                        >
                            {this.state.error.message}
                        </pre>
                    )}
                </div>
            </div>
        );
    }
}
