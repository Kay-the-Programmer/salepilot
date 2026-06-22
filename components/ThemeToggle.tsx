import { useTheme } from '../contexts/ThemeContext';
import './theme-toggle.css';

/**
 * Global, always-visible light/dark switch. Rendered once at the app root so it
 * floats over every screen and app shell (POS, CRM, Reports, Discover, …) and
 * toggles the `html.dark` class the whole theme system keys off.
 */
export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const dark = theme === 'dark';
    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <span
                className="material-symbols-rounded theme-toggle__icon"
                style={{ fontVariationSettings: `'FILL' 1, 'wght' 500, 'opsz' 24` }}
                aria-hidden="true"
            >
                {dark ? 'light_mode' : 'dark_mode'}
            </span>
        </button>
    );
}
