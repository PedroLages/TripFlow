
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar, Map as MapIcon, DollarSign,
  Package, MoreHorizontal, LayoutDashboard,
  Heart, FileText, BarChart3, Users
} from 'lucide-react';

interface TripMobileNavProps {
  tripId: string;
  className?: string;
}

const TripMobileNav: React.FC<TripMobileNavProps> = ({ tripId, className }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const tripTabs = [
    { to: `/#/`, icon: <LayoutDashboard size={20} />, label: 'Home', isNavLink: true },
    { to: `/trip/${tripId}/itinerary`, icon: <Calendar size={20} />, label: 'Plan', isNavLink: true },
    { to: `/trip/${tripId}/map`, icon: <MapIcon size={20} />, label: 'Map', isNavLink: true },
    { to: `/trip/${tripId}/budget`, icon: <DollarSign size={20} />, label: 'Budget', isNavLink: true },
    { to: `/trip/${tripId}/packing`, icon: <Package size={20} />, label: 'Gear', isNavLink: true },
    { to: null, icon: <MoreHorizontal size={20} />, label: 'More', isNavLink: false },
  ];

  const moreMenuItems = [
    { to: `/trip/${tripId}/places`, icon: Heart, label: 'Places' },
    { to: `/trip/${tripId}/docs`, icon: FileText, label: 'Docs' },
    { to: `/trip/${tripId}/analytics`, icon: BarChart3, label: 'Stats' },
    { to: `/trip/${tripId}/settlements`, icon: Users, label: 'Split' },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-more-menu]') && !target.closest('[data-more-button]')) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMoreMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsMoreMenuOpen(false);
  }, [location.pathname]);

  const isMoreActive = moreMenuItems.some(item => location.pathname.includes(item.to));

  return (
    <>
      {/* Dropdown Menu */}
      {isMoreMenuOpen && (
        <div
          data-more-menu
          className="fixed bottom-28 right-4 z-[101] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in duration-200"
          style={{
            minWidth: '200px',
          }}
        >
          {moreMenuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.to);
                  setIsMoreMenuOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 transition-all
                  ${isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}
                  ${index > 0 ? 'border-t border-slate-100 dark:border-slate-700' : ''}
                `}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

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
            // HOME tab special handling for hash routing
            if (tab.label === 'Home') {
              const isActive = location.pathname === '/';

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

            // MORE button (not a NavLink)
            if (!tab.isNavLink) {
              return (
                <button
                  key={tab.label}
                  data-more-button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`
                    flex flex-col items-center gap-1 transition-all flex-1 rounded-2xl
                    ${isMoreActive || isMoreMenuOpen ? 'text-brand-primary' : 'text-slate-400'}
                  `}
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden'
                  }}
                >
                  <div className={`p-2 rounded-2xl transition-all ${isMoreActive || isMoreMenuOpen ? 'bg-brand-primary/10' : ''}`}>
                    {tab.icon}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-wider">{tab.label}</span>
                </button>
              );
            }

            // Regular NavLinks
            const isActive = location.pathname === tab.to;

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
    </>
  );
};

export default TripMobileNav;
