
import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Compass, Settings as SettingsIcon, 
  PlusCircle, LogOut, History, ChevronRight, 
  ChevronLeft, MapPin, Maximize2, Minimize2
} from 'lucide-react';
import { Trip } from '../types';

interface SidebarProps {
  className?: string;
  onLogout?: () => void;
  trips?: Trip[];
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className, onLogout, trips = [], isCollapsed, onToggle }) => {
  const location = useLocation();
  const recentTrips = [...trips].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 3);
  
  const mainLinks = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/create', icon: <PlusCircle size={20} />, label: 'New Trip' },
    { to: '/settings', icon: <SettingsIcon size={20} />, label: 'Settings' },
  ];

  return (
    <aside className={`${className} ${isCollapsed ? 'w-20' : 'w-72'} border-r border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-950/40 backdrop-blur-3xl flex flex-col h-screen transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] relative group/sidebar`}>
      
      {/* Tactical Edge Handle (The "Trigger") */}
      <div 
        onClick={onToggle}
        className={`absolute -right-3 top-0 bottom-0 w-6 cursor-pointer z-[60] flex items-center justify-center transition-opacity ${isCollapsed ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'}`}
      >
        <div className="w-1 h-32 bg-slate-200 dark:bg-white/10 rounded-full group-hover/sidebar:bg-brand-primary transition-all flex items-center justify-center">
          <div className="w-6 h-10 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 -ml-0.5 scale-0 group-hover/sidebar:scale-100 transition-transform">
             {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </div>
        </div>
      </div>

      {/* Brand Header */}
      <div className={`flex items-center gap-4 transition-all duration-500 ${isCollapsed ? 'p-5 justify-center' : 'p-10'}`}>
        <div className="p-3 bg-brand-primary rounded-2xl shadow-xl shadow-indigo-500/30 group cursor-pointer overflow-hidden relative flex-shrink-0">
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
          <Compass className="text-white relative z-10 group-hover:rotate-45 transition-transform" size={24} />
        </div>
        {!isCollapsed && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-500">
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">TripFlow</h1>
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-brand-primary opacity-70">Operational HQ</p>
          </div>
        )}
      </div>
      
      {/* Primary Navigation */}
      <nav className={`px-4 space-y-2 mt-4`}>
        {!isCollapsed && (
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 mb-4 animate-in fade-in duration-500">Command Menu</p>
        )}
        {mainLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            title={isCollapsed ? link.label : ''}
            className={({ isActive }) => 
              `flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-4 rounded-[1.5rem] transition-all relative group overflow-hidden ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-600 font-bold dark:bg-indigo-500/10 dark:text-brand-primary shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 dark:text-slate-500 dark:hover:bg-white/5'
              }`
            }
          >
            <div className={`flex items-center ${isCollapsed ? 'gap-0' : 'gap-4'} relative z-10`}>
              <span className="group-hover:scale-110 transition-transform flex-shrink-0">{link.icon}</span>
              {!isCollapsed && (
                <span className="text-sm font-bold tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-1 duration-500">{link.label}</span>
              )}
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Tactical Recall (Recent Trips) */}
      {!isCollapsed && (
        <div className="mt-12 px-6 flex-1 overflow-y-auto no-scrollbar animate-in fade-in duration-700">
          <div className="flex items-center justify-between px-4 mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Tactical Recall</p>
            <History size={12} className="text-slate-400" />
          </div>
          <div className="space-y-2">
            {recentTrips.map(trip => (
              <Link
                key={trip.id}
                to={`/trip/${trip.id}/itinerary`}
                className="flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/10 flex-shrink-0">
                  <img src={trip.coverImage} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700" alt={trip.name} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate tracking-tight">{trip.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin size={8} className="text-brand-primary" />
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{trip.destinations[0]}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer Info HUD */}
      <div className={`p-4 transition-all duration-500 ${isCollapsed ? 'mt-auto space-y-2' : 'space-y-4'}`}>
        {!isCollapsed && (
          <div className="bg-slate-900 text-white p-6 rounded-[2rem] relative overflow-hidden group border border-white/5 animate-in slide-in-from-bottom-2 duration-500">
            <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl leading-none select-none pointer-events-none">OPS</div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse" />
                <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">Fleet Status</p>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-display font-bold">{trips.length}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Nodes</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-display font-bold">{new Set(trips.flatMap(t => t.destinations)).size}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Sectors</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className={`p-2 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center transition-all duration-500 ${isCollapsed ? 'flex-col gap-2' : 'justify-between px-4'}`}>
           <div className={`flex items-center gap-4 ${isCollapsed ? 'flex-col' : ''}`}>
              <div className="relative flex-shrink-0">
                <img src="https://i.pravatar.cc/150?u=demo" className="w-10 h-10 rounded-2xl border-2 border-white dark:border-slate-800 shadow-md" alt="Pilot" />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-brand-success rounded-full border-2 border-white dark:border-slate-900" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 animate-in fade-in duration-500">
                  <p className="text-xs font-black tracking-tight text-slate-800 dark:text-white truncate">Demo Pilot</p>
                </div>
              )}
           </div>
           <button 
             onClick={onLogout}
             className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
           >
             <LogOut size={18} />
           </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
