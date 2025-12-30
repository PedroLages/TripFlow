
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Settings as SettingsIcon } from 'lucide-react';

interface MobileNavProps {
  className?: string;
}

const MobileNav: React.FC<MobileNavProps> = ({ className }) => {
  return (
    <nav className={`${className} fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 h-16 flex items-center justify-around z-50 px-4`}>
      <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-sky-600' : 'text-slate-400'}`}>
        <LayoutDashboard size={20} />
        <span className="text-[10px] font-medium uppercase tracking-wider">Dashboard</span>
      </NavLink>
      <NavLink to="/create" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-sky-600' : 'text-slate-400'}`}>
        <div className="p-2 bg-sky-500 rounded-full -mt-8 shadow-lg shadow-sky-200 dark:shadow-sky-900/20">
          <PlusCircle size={24} className="text-white" />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider">New Trip</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-sky-600' : 'text-slate-400'}`}>
        <SettingsIcon size={20} />
        <span className="text-[10px] font-medium uppercase tracking-wider">Settings</span>
      </NavLink>
    </nav>
  );
};

export default MobileNav;
