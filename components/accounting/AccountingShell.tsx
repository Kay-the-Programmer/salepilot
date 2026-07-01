import React from 'react';
import { User } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import AssistantLauncher from '../../pages/assistant/AssistantLauncher';
import AppSwitcher from '../standalone/AppSwitcher';
import AppNavMenu from '../standalone/AppNavMenu';
import Logo from '../../assets/logo.png';
import RailThemeButton from '../standalone/RailThemeButton';
import { useAppSwitcher } from '../../contexts/AppSwitcherContext';
import '../crm/crm.css';
import '../../pages/assistant/assistant.css';

export type AcctSection =
  | 'overview' | 'reports' | 'ar_management' | 'ap_management'
  | 'expenses' | 'taxes' | 'chart_of_accounts' | 'journal';

interface AccountingShellProps {
  active: AcctSection;
  user: User;
  onNavigate: (section: AcctSection) => void;
  onExit: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const ACCT_NAV: { id: AcctSection; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'monitoring' },
  { id: 'reports', label: 'Reports', icon: 'bar_chart' },
  { id: 'ar_management', label: 'Receivables', icon: 'trending_up' },
  { id: 'ap_management', label: 'Payables', icon: 'trending_down' },
  { id: 'expenses', label: 'Expenses', icon: 'payments' },
  { id: 'taxes', label: 'Taxes', icon: 'receipt_long' },
  { id: 'chart_of_accounts', label: 'Accounts', icon: 'menu_book' },
  { id: 'journal', label: 'Journal', icon: 'list_alt' },
];

/**
 * Standalone Accounting Hub frame — reuses the shared M3 chrome (side rail on
 * desktop, mobile top bar with app switcher + sections menu) exactly like the
 * CRM / Procurement / Inventory hubs. The scrolling content is wrapped in a
 * `.sp-assistant` scope so the views' `m3-*` utilities resolve.
 */
export const AccountingShell: React.FC<AccountingShellProps> = ({ active, user, onNavigate, onExit, onLogout, children }) => {
  const { openAppSwitcher } = useAppSwitcher();
  return (
    <div className="crm">
      <aside className="crm-rail" aria-label="Accounting navigation">
        <div className="crm-rail__brand">
          <span className="crm-bar__logo"><Icon name="account_balance" size={22} fill={1} /></span>
          <div className="crm-rail__brand-text">
            <span className="crm-rail__brand-title">SalePilot Accounting</span>
            <span className="crm-rail__brand-sub">Financial Hub</span>
          </div>
        </div>

        <nav className="crm-rail__nav">
          {ACCT_NAV.map(item => (
            <button
              key={item.id}
              type="button"
              className={`crm-rail__item${active === item.id ? ' is-active' : ''}`}
              aria-current={active === item.id ? 'page' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              <Icon name={item.icon} size={22} fill={active === item.id ? 1 : 0} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="crm-rail__foot">
          <button type="button" className="crm-rail__item" onClick={openAppSwitcher}>
            <Icon name="apps" size={22} /> SalePilot Apps
          </button>
          <RailThemeButton />
          <button type="button" className="crm-rail__item crm-rail__item--logout" onClick={onLogout}>
            <Icon name="logout" size={22} /> Logout
          </button>
          <div className="crm-rail__user">
            <Avatar name={user?.name} src={user?.profilePicture} size={36} />
            <div className="crm-rail__user-info">
              <span className="crm-rail__user-name">{user?.name}</span>
              <span className="crm-rail__user-role">{user?.role}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="crm-body">
        <header className="crm-bar crm-bar--mobile">
          <AppSwitcher user={user} currentRoute="books" triggerClassName="crm-iconbtn" />
          <img src={Logo} alt="SalePilot" className="crm-bar__brandlogo" />
          <div className="crm-bar__actions">
            <AppNavMenu
              items={ACCT_NAV.map(n => ({ icon: n.icon, label: n.label, active: active === n.id, onClick: () => onNavigate(n.id) }))}
              onExit={onExit}
              onLogout={onLogout}
              triggerClassName="crm-iconbtn"
            />
          </div>
        </header>

        <div className="sp-assistant sp-books" style={{ minHeight: '100%' }}>
          {children}
        </div>
      </div>

      {/* Embedded AI assistant — available from inside the Accounting hub */}
      <AssistantLauncher userName={user?.name} />
    </div>
  );
};

export default AccountingShell;
