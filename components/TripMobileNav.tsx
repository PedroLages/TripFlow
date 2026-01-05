
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Briefcase, DollarSign
} from 'lucide-react';

interface TripMobileNavProps {
  tripId: string;
  className?: string;
}

const TripMobileNav: React.FC<TripMobileNavProps> = ({ tripId, className }) => {
  const location = useLocation();

  const tripTabs = [
    { to: `/#/`, icon: <LayoutDashboard size={20} />, label: 'Home' },
    { to: `/trip/${tripId}/itinerary`, icon: <Calendar size={20} />, label: 'Plan' },
    { to: `/trip/${tripId}/packing`, icon: <Briefcase size={20} />, label: 'Vault' },
    { to: `/trip/${tripId}/budget`, icon: <DollarSign size={20} />, label: 'Finance' },
  ];

  const isTabActive = (tabTo: string, tabLabel: string) => {
    if (tabLabel === 'Home') {
      return location.pathname === '/';
    }

    // Check if we're in the section for this tab
    if (tabLabel === 'Plan') {
      return location.pathname.includes('/itinerary') ||
             location.pathname.includes('/map') ||
             location.pathname.includes('/places');
    }

    if (tabLabel === 'Vault') {
      return location.pathname.includes('/packing') ||
             location.pathname.includes('/docs');
    }

    if (tabLabel === 'Finance') {
      return location.pathname.includes('/budget') ||
             location.pathname.includes('/settlements');
    }

    return location.pathname === tabTo;
  };

  return (
    <nav
      className={`${className} fixed bottom-0 left-0 right-0 z-[100] lg:hidden`}
      style={{
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
    >
      <div
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] h-20 flex items-center justify-around px-2 overflow-hidden mx-4"
      >
        {tripTabs.map(tab => {
          const isActive = isTabActive(tab.to, tab.label);

          // HOME tab uses hash navigation
          if (tab.label === 'Home') {
            return (
              <a
                key={tab.label}
                href={tab.to}
                className={`
                  flex flex-col items-center gap-1 transition-all flex-1 rounded-2xl
                  ${isActive ? 'text-brand-primary' : 'text-slate-400'}
                `}
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-brand-primary/10' : ''}`}>
                  {tab.icon}
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider">{tab.label}</span>
              </a>
            );
          }

          // Other tabs use NavLink
          return (
            <NavLink
              key={tab.label}
              to={tab.to}
              className={`
                flex flex-col items-center gap-1 transition-all flex-1 rounded-2xl
                ${isActive ? 'text-brand-primary' : 'text-slate-400'}
              `}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-brand-primary/10' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default TripMobileNav;
