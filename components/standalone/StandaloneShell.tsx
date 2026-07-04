import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, THEME_PREFERENCE_ICON, THEME_PREFERENCE_LABEL } from '../../contexts/ThemeContext';
import { getCurrentUser } from '../../services/authService';
import '../../pages/assistant/assistant.css';
import AppSwitcher from './AppSwitcher';
import Logo from '../../assets/logo.png';

interface StandaloneShellProps {
  title: string;
  /** Extra class on the root for app-specific scoped CSS (e.g. 'sp-audit'). */
  scopeClass?: string;
  /** Optional action buttons rendered before the theme toggle. */
  headerActions?: React.ReactNode;
  onBack?: () => void;
  children: React.ReactNode;
}

/**
 * Shared chrome for the "simple" standalone apps (Audit, Notifications,
 * Profile, …): a sticky M3 top app bar + scrollable content. Reuses the
 * Material-3 theme tokens/utilities from assistant.css (the root carries
 * `sp-assistant`), so every standalone app looks consistent with the
 * POS / Assistant theme.
 */
const StandaloneShell: React.FC<StandaloneShellProps> = ({
  title,
  scopeClass,
  headerActions,
  onBack,
  children,
}) => {
  const navigate = useNavigate();
  const { preference, cycleTheme } = useTheme();
  const user = getCurrentUser();

  return (
    <div className={`sp-assistant ${scopeClass || ''} h-full flex flex-col overflow-hidden`}>
      {/* Top app bar */}
      <header className="relative flex-shrink-0 h-16 m3-bg-surface shadow-sm flex items-center justify-between px-4 md:px-8 z-20 sticky top-0">
        <h1 className="sr-only">{title}</h1>
        <div className="flex items-center gap-1 min-w-0">
          <AppSwitcher user={user} triggerClassName="w-10 h-10 flex items-center justify-center rounded-full m3-text-on-surface-variant hover:m3-bg-surface-high transition active:scale-90" />
          <button
            onClick={() => (onBack ? onBack() : navigate(-1))}
            className="w-9 h-9 flex items-center justify-center rounded-full m3-text-on-surface-variant hover:m3-bg-surface-high transition active:scale-90"
            title="Back"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
        </div>
        <img src={Logo} alt="SalePilot" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-7 w-auto pointer-events-none" />
        <div className="flex items-center gap-1">
          {headerActions}
          <button onClick={cycleTheme} className="w-10 h-10 flex items-center justify-center rounded-full m3-text-on-surface-variant hover:m3-bg-surface-high transition active:scale-90" title={`Switch theme — ${THEME_PREFERENCE_LABEL[preference]}`}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{THEME_PREFERENCE_ICON[preference]}</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-y-auto sp-scroll">
        {children}
      </main>

    </div>
  );
};

export default StandaloneShell;
