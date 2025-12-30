
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Calendar, Map as MapIcon, DollarSign, 
  Package, LayoutDashboard, MoreHorizontal
} from 'lucide-react';

interface TripMobileNavProps {
  tripId: string;
  className?: string;
}

const TripMobileNav: React.FC<TripMobileNavProps> = ({ tripId, className }) => {
  const location = useLocation();
  
  const tripTabs = [
    { to: `/`, icon: <LayoutDashboard size={20} />, label: 'Home' },
    { to: `/trip/${tripId}/itinerary`, icon: <Calendar size={20} />, label: 'Plan' },
    { to: `/trip/${tripId}/map`, icon: <MapIcon size={20} />, label: 'Map' },
    { to: `/trip/${tripId}/budget`, icon: <DollarSign size={20} />, label: 'Budget' },
    { to: `/trip/${tripId}/packing`, icon: <Package size={20} />, label: 'Gear' },
    { to: `/trip/${tripId}/places`, icon: <MoreHorizontal size={20} />, label: 'More' },
  ];

  return (
    <nav className={`${className} fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-2`}>
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] h-20 flex items-center justify-around px-2">
        {tripTabs.map(tab => {
          const isActive = location.pathname === tab.to || (tab.label === 'More' && (location.pathname.includes('/places') || location.pathname.includes('/docs')));
          
          return (
            <NavLink 
              key={tab.label}
              to={tab.to} 
              className={`
                flex flex-col items-center gap-1 transition-all flex-1
                ${isActive ? 'text-brand-primary' : 'text-slate-400'}
              `}
            >
              <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-brand-primary/10' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default TripMobileNav;
