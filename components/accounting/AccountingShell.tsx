import React from 'react';
import { User } from '../../types';
import AppShell, { AppShellNavItem } from '../standalone/AppShell';

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

export const ACCT_NAV: AppShellNavItem<AcctSection>[] = [
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
 * Standalone Accounting Hub frame. The scrolling content is wrapped in a
 * `.sp-assistant` scope so the views' `m3-*` utilities resolve.
 */
export const AccountingShell: React.FC<AccountingShellProps> = ({ active, user, onNavigate, onExit, onLogout, children }) => (
  <AppShell
    user={user}
    route="books"
    navLabel="Accounting navigation"
    brand={{ icon: 'account_balance', title: 'SalePilot Accounting', sub: 'Financial Hub' }}
    nav={ACCT_NAV}
    active={active}
    onNavigate={onNavigate}
    onExit={onExit}
    onLogout={onLogout}
    contentClassName="sp-assistant sp-books"
  >
    {children}
  </AppShell>
);

export default AccountingShell;
