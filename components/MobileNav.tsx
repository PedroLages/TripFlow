
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Settings as SettingsIcon } from 'lucide-react';

interface MobileNavProps {
  className?: string;
}

const MobileNav: React.FC<MobileNavProps> = ({ className }) => {
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
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          {({ isActive }) => (
            <div className={`flex flex-col items-center gap-1 transition-all flex-1 rounded-2xl ${isActive ? 'text-brand-primary' : 'text-slate-400'}`}>
              <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-brand-primary/10' : ''}`}>
                <LayoutDashboard size={20} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider">Dashboard</span>
            </div>
          )}
        </NavLink>

        <NavLink
          to="/create"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          {({ isActive }) => (
            <div className={`flex flex-col items-center gap-1 transition-all flex-1 rounded-2xl ${isActive ? 'text-brand-primary' : 'text-slate-400'}`}>
              <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-brand-primary/10' : ''}`}>
                <PlusCircle size={20} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider">New Trip</span>
            </div>
          )}
        </NavLink>

        <NavLink
          to="/settings"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          {({ isActive }) => (
            <div className={`flex flex-col items-center gap-1 transition-all flex-1 rounded-2xl ${isActive ? 'text-brand-primary' : 'text-slate-400'}`}>
              <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-brand-primary/10' : ''}`}>
                <SettingsIcon size={20} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider">Settings</span>
            </div>
          )}
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileNav;
