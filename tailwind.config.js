/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
            },
            fontWeight: {
                heavy: '800',
            },
            colors: {
                /* ── Semantic tokens (driven by CSS custom properties) ── */
                primary: {
                    DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
                    dark:    'rgb(var(--color-primary-dark) / <alpha-value>)',
                },
                secondary:         'rgb(var(--color-secondary) / <alpha-value>)',
                accent:            'rgb(var(--color-accent) / <alpha-value>)',
                background:        'rgb(var(--color-background) / <alpha-value>)',
                surface:           'rgb(var(--color-surface) / <alpha-value>)',
                'surface-variant': 'rgb(var(--color-surface-variant) / <alpha-value>)',
                'brand-text':       'rgb(var(--color-text) / <alpha-value>)',
                'brand-text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
                'brand-border':     'rgb(var(--color-border) / <alpha-value>)',
                success: {
                    DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
                    muted:   'rgb(var(--color-success-muted) / <alpha-value>)',
                },
                warning: {
                    DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
                    muted:   'rgb(var(--color-warning-muted) / <alpha-value>)',
                },
                danger: {
                    DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
                    muted:   'rgb(var(--color-danger-muted) / <alpha-value>)',
                },
                info: {
                    DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
                    muted:   'rgb(var(--color-info-muted) / <alpha-value>)',
                },

                /* ── Cool neutral palette (Velocity POS) ── */
                warm: {
                    50:  '#F7FAFC', /* surface / background */
                    100: '#F1F4F6', /* surface-container-low */
                    200: '#EBEEF0', /* surface-container */
                    300: '#E0E3E5', /* surface-container-highest */
                    400: '#C4C6D2', /* outline-variant */
                    500: '#747782', /* outline */
                    600: '#434651', /* on-surface-variant */
                    700: '#2D3133', /* inverse-surface */
                    800: '#181C1E', /* on-surface ink */
                    900: '#0F1214',
                },

                /* ── Velocity brand statics ──
                   Names kept (sp-green / sp-amber) so existing usages follow:
                   sp-green now = Deep Navy primary, sp-amber now = Vibrant Orange. */
                'sp-green': {
                    DEFAULT: '#002B6B', /* Deep Navy */
                    light:   '#1A428A',
                    dark:    '#001944',
                    soft:    '#D9E2FF',
                },
                'sp-amber': {
                    DEFAULT: '#FF7F27', /* Vibrant Orange */
                    light:   '#FFB68E',
                    soft:    '#FFDBC9',
                },
                /* Forward-looking semantic aliases for the Velocity brand */
                'sp-navy': {
                    DEFAULT: '#002B6B',
                    light:   '#1A428A',
                    dark:    '#001944',
                    soft:    '#D9E2FF',
                },
                'sp-orange': {
                    DEFAULT: '#FF7F27',
                    light:   '#FFB68E',
                    soft:    '#FFDBC9',
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
