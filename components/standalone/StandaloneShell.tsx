import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { getCurrentUser } from '../../services/authService';
import '../../pages/assistant/assistant.css';

export interface ShellNavItem {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}

interface StandaloneShellProps {
  /** Material Symbols icon name for the brand. */
  icon: string;
  title: string;
  /** Extra class on the root for app-specific scoped CSS (e.g. 'sp-audit'). */
  scopeClass?: string;
  /** Optional action buttons rendered before the theme/discover/avatar group. */
  headerActions?: React.ReactNode;
  /** Mobile bottom-nav items (hidden on desktop). */
  navItems?: ShellNavItem[];
  onBack?: () => void;
  children: React.ReactNode;
}

/**
 * Shared chrome for the "simple" standalone apps (Audit, Notifications,
 * Profile, …): a sticky M3 top app bar + scrollable content + a mobile-only
 * bottom nav. Reuses the Material-3 theme tokens/utilities from assistant.css
 * (the root carries `sp-assistant`), so every standalone app looks consistent
 * with the POS / Assistant theme.
 */
const StandaloneShell: React.FC<StandaloneShellProps> = ({
  icon,
  title,
  scopeClass,
  headerActions,
  navItems,
  onBack,
  children,
}) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const user = getCurrentUser();
  const initial = (user?.name?.trim()?.[0] || 'S').toUpperCase();

  return (
    <div className={`sp-assistant ${scopeClass || ''} h-full flex flex-col overflow-hidden`}>
      {/* Top app bar */}
      <header className="flex-shrink-0 h-16 m3-bg-surface shadow-sm flex items-center justify-between px-4 md:px-8 z-20 sticky top-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={() => (onBack ? onBack() : navigate(-1))}
            className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full m3-text-on-surface-variant hover:m3-bg-surface-high transition active:scale-90"
            title="Back"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 26 }}>{icon}</span>
          <h1 className="text-lg md:text-xl font-bold m3-text-primary tracking-tight truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          {headerActions}
          <button onClick={() => navigate('/pos/discover')} className="w-10 h-10 flex items-center justify-center rounded-full m3-text-on-surface-variant hover:m3-bg-surface-high transition active:scale-90" title="Discover apps">
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>menu</span>
          </button>
          <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-full m3-text-on-surface-variant hover:m3-bg-surface-high transition active:scale-90" title="Toggle theme">
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-y-auto sp-scroll">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      {navItems && navItems.length > 0 && (
        <nav className="md:hidden flex-shrink-0 m3-bg-surface shadow-[0_-4px_10px_rgba(0,0,0,0.05)] rounded-t-xl h-[68px] flex justify-around items-center z-20">
          {navItems.map((n) => (
            <button
              key={n.label}
              onClick={n.onClick}
              className={`flex flex-col items-center justify-center px-4 py-1 rounded-2xl transition active:scale-90 ${n.active ? 'm3-bg-primary-fixed m3-text-primary' : 'm3-text-on-surface-variant hover:m3-text-primary'}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: n.active ? "'FILL' 1" : undefined }}>{n.icon}</span>
              <span className="text-[11px] font-medium mt-0.5">{n.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default StandaloneShell;
