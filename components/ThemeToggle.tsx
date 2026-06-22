import { useTheme } from '../contexts/ThemeContext';
import './theme-toggle.css';

const ICON = { system: 'brightness_auto', light: 'light_mode', dark: 'dark_mode' } as const;
const LABEL = { system: 'System', light: 'Light', dark: 'Dark' } as const;
const NEXT = { system: 'Light', light: 'Dark', dark: 'System' } as const;

/**
 * Global, always-visible theme control. Cycles System → Light → Dark.
 * In "System" mode the app follows the user's device light/dark setting
 * automatically (and live-updates when they change it).
 */
export default function ThemeToggle() {
    const { preference, theme, cycleTheme } = useTheme();
    const auto = preference === 'system';

    return (
        <button
            type="button"
            className={`theme-toggle${auto ? ' theme-toggle--auto' : ''}`}
            onClick={cycleTheme}
            aria-label={`Theme: ${LABEL[preference]}${auto ? ` (following device — ${theme})` : ''}. Tap to switch to ${NEXT[preference]}.`}
            title={`Theme: ${LABEL[preference]}${auto ? ` · auto (${theme})` : ''} — tap for ${NEXT[preference]}`}
        >
            <span
                className="material-symbols-rounded theme-toggle__icon"
                style={{ fontVariationSettings: `'FILL' 1, 'wght' 500, 'opsz' 24` }}
                aria-hidden="true"
            >
                {ICON[preference]}
            </span>
        </button>
    );
}
