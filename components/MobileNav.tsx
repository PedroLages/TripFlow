
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, User } from 'lucide-react';

interface MobileNavProps {
  className?: string;
}

const MobileNav: React.FC<MobileNavProps> = ({ className }) => {
  const location = useLocation();

  // Check if we're on any trip page
  const isOnTripPage = location.pathname.startsWith('/trip/');

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
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] h-20 flex items-center justify-around px-2 overflow-hidden mx-4">
        <NavLink
          to="/"
          style={{
            backfaceVisibility: 'hidden',
            WebkokitBackfaceVisibility: 'hidden'
          }}
        >
          {({ isActive }) => (
            <div className={`flex flex-col items-center gap-1 transition-all flex-1 rounded-2xl ${isActive && !isOnTripPage ? 'text-brand-primary' : 'text-slate-400'}`}>
              <div className={`p-2 rounded-2xl transition-all ${isActive && !isOnTripPage ? 'bg-brand-primary/10' : ''}`}>
                <LayoutDashboard size={20} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider">Dashboard</span>
            </div>
          )}
        </NavLink>

        <NavLink
          to="/trips"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          {({ isActive }) => (
            <div className={`flex flex-col items-center gap-1 transition-all flex-1 rounded-2xl ${isActive || isOnTripPage ? 'text-brand-primary' : 'text-slate-400'}`}>
              <div className={`p-2 rounded-2xl transition-all ${isActive || isOnTripPage ? 'bg-brand-primary/10' : ''}`}>
                <Briefcase size={20} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider">Trips</span>
            </div>
          )}
        </NavLink>

        <NavLink
          to="/profile"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          {({ isActive }) => (
            <div className={`flex flex-col items-center gap-1 transition-all flex-1 rounded-2xl ${isActive ? 'text-brand-primary' : 'text-slate-400'}`}>
              <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-brand-primary/10' : ''}`}>
                <User size={20} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider">Profile</span>
            </div>
          )}
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileNav;
