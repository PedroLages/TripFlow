/**
 * Stack Navigation Component
 *
 * Horizontal tab navigation that appears at the top of the screen
 * when within PLAN, VAULT, or FINANCE sections
 */

import React from 'react';
import { NavLink } from 'react-router-dom';

interface StackNavTab {
  to: string;
  icon: React.ReactNode;
  label: string;
}

interface StackNavProps {
  tabs: StackNavTab[];
  className?: string;
}

const StackNav: React.FC<StackNavProps> = ({ tabs, className }) => {
  return (
    <nav className={`${className} sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800`}>
      <div className="flex items-center justify-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <NavLink
            key={tab.label}
            to={tab.to}
            className={({ isActive }) => `
              flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0 text-sm font-medium
              ${isActive
                ? 'bg-brand-primary text-white shadow-lg'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }
            `}
          >
            <span className="flex items-center">{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default StackNav;
