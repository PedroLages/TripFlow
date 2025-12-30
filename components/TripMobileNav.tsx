
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Calendar, Map as MapIcon, DollarSign, 
  Package, LayoutDashboard, MoreHorizontal,
  Heart, FileText
} from 'lucide-react';

interface TripMobileNavProps {
  tripId: string;
  className?: string;
}

const TripMobileNav: React.FC<TripMobileNavProps> = ({ tripId, className }) => {
  const tripTabs = [
    { to: `/trip/${tripId}/itinerary`, icon: <Calendar size={20} />, label: 'Plan' },
    { to: `/trip/${tripId}/map`, icon: <MapIcon size={20} />, label: 'Map' },
    { to: `/trip/${tripId}/budget`, icon: <DollarSign size={20} />, label: 'Budget' },
    { to: `/trip/${tripId}/packing`, icon: <Package size={20} />, label: 'Gear' },
  ];

  return (
    <nav className={`${className} fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-2`}>
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-3xl h-20 flex items-center justify-around px-4">
        {/* Back to Home Action */}
        <NavLink to="/" className="flex flex-col items-center gap-1 text-slate-400">
           <LayoutDashboard size={18} />
           <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
        </NavLink>

        <div className="w-px h-8 bg-slate-100 dark:bg-white/5" />

        {tripTabs.map(tab => (
          <NavLink 
            key={tab.to}
            to={tab.to} 
            className={({ isActive }) => `
              flex flex-col items-center gap-1 transition-all
              ${isActive ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}
            `}
          >
            <div className={`p-2 rounded-xl transition-all ${location.hash.includes(tab.to) ? 'bg-brand-primary/10' : ''}`}>
              {tab.icon}
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
          </NavLink>
        ))}

        <div className="w-px h-8 bg-slate-100 dark:bg-white/5" />

        <NavLink to={`/trip/${tripId}/places`} className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-brand-primary' : 'text-slate-400'}`}>
          <MoreHorizontal size={20} />
          <span className="text-[8px] font-black uppercase tracking-widest">More</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default TripMobileNav;
