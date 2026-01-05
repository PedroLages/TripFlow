/**
 * Secondary Navigation for "More" Section
 *
 * Displays horizontal scrollable tabs for additional features:
 * - Places (Wishlist)
 * - Documents
 * - Analytics
 * - Settlements
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, FileText, BarChart3, Users } from 'lucide-react';

interface MoreTabNavProps {
  tripId: string;
  className?: string;
}

const MoreTabNav: React.FC<MoreTabNavProps> = ({ tripId, className }) => {
  const moreTabs = [
    { to: `/trip/${tripId}/places`, icon: Heart, label: 'Places' },
    { to: `/trip/${tripId}/docs`, icon: FileText, label: 'Docs' },
    { to: `/trip/${tripId}/analytics`, icon: BarChart3, label: 'Stats' },
    { to: `/trip/${tripId}/settlements`, icon: Users, label: 'Split' },
  ];

  return (
    <nav className={`${className} sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800`}>
      <div className="flex items-center gap-1 px-4 py-3 overflow-x-auto no-scrollbar">
        {moreTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.label}
              to={tab.to}
              className={({ isActive }) => `
                flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0
                ${isActive
                  ? 'bg-brand-primary text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }
              `}
            >
              <Icon size={16} />
              <span className="text-sm font-medium">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MoreTabNav;
