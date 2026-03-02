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
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
