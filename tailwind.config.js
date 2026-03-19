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
            colors: {
                primary: {
                    DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
                    dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
                },
                secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
                accent: 'rgb(var(--color-accent) / <alpha-value>)',
                background: 'rgb(var(--color-background) / <alpha-value>)',
                surface: 'rgb(var(--color-surface) / <alpha-value>)',
                'brand-text': 'rgb(var(--color-text) / <alpha-value>)',
                'brand-text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
                'brand-border': 'rgb(var(--color-border) / <alpha-value>)',
                success: {
                    DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
                    muted: 'rgb(var(--color-success-muted) / <alpha-value>)',
                },
                warning: {
                    DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
                    muted: 'rgb(var(--color-warning-muted) / <alpha-value>)',
                },
                danger: {
                    DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
                    muted: 'rgb(var(--color-danger-muted) / <alpha-value>)',
                },
                info: {
                    DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
                    muted: 'rgb(var(--color-info-muted) / <alpha-value>)',
                },
                'surface-variant': 'rgb(var(--color-surface-variant) / <alpha-value>)',
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
