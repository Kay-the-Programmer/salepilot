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

                /* ── Warm neutral palette (Confident Clarity) ── */
                warm: {
                    50:  '#FDFCFA',
                    100: '#F9F7F4',
                    200: '#F2EFE9',
                    300: '#E5E0D8',
                    400: '#C9C4BA',
                    500: '#9A9488',
                    600: '#706A60',
                    700: '#4A4640',
                    800: '#2E2B27',
                    900: '#1A1A2E',
                },

                /* ── SalePilot brand statics ── */
                'sp-green': {
                    DEFAULT: '#008060',
                    light:   '#00AF85',
                    dark:    '#00644B',
                    soft:    '#E6F5F0',
                },
                'sp-amber': {
                    DEFAULT: '#D4820A',
                    light:   '#F4A627',
                    soft:    '#FEF3C7',
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
