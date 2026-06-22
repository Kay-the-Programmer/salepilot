import React from 'react';
import PosIcon from '../sales/PosIcon';
import type { PosSection } from './PosShell';

interface PosBottomNavProps {
    active: PosSection;
    onNavigate: (section: PosSection) => void;
}

// Mirrors the POS shell rail tabs (icons + brand aesthetic), shown on mobile.
const NAV: { id: PosSection; icon: string; label: string }[] = [
    { id: 'pos', icon: 'point_of_sale', label: 'POS' },
    { id: 'inventory', icon: 'inventory_2', label: 'Inventory' },
    { id: 'dashboard', icon: 'monitoring', label: 'Dashboard' },
    { id: 'discover', icon: 'menu', label: 'Discover Apps' },
];

/** Shared mobile bottom navigation for the standalone POS shell. */
export const PosBottomNav: React.FC<PosBottomNavProps> = ({ active, onNavigate }) => (
    // On Discover, hide the other tabs so the user picks an app from the grid.
    <nav className="posbottomnav" aria-label="POS navigation">
        {(active === 'discover' ? NAV.filter(i => i.id === 'discover') : NAV).map(item => {
            const isActive = active === item.id;
            return (
                <button
                    key={item.id}
                    type="button"
                    className={`posbottomnav__item${isActive ? ' is-active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => onNavigate(item.id)}
                >
                    <PosIcon name={item.icon} size={24} fill={isActive ? 1 : 0} />
                    <span>{item.label}</span>
                </button>
            );
        })}
    </nav>
);

export default PosBottomNav;
