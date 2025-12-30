
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Trip, Collaborator, UserRole, User, ActivityLog } from '../types';
import { 
  Calendar, Map as MapIcon, Heart, DollarSign, Package, FileText, 
  Settings, Users, X, Bell, Radio, CloudSun, Clock, Sparkles, Edit3, Eye,
  ChevronLeft
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import ItineraryTab from './tabs/ItineraryTab';
import MapTab from './tabs/MapTab';
import WishlistTab from './tabs/WishlistTab';
import BudgetTab from './tabs/BudgetTab';
import PackingTab from './tabs/PackingTab';
import DocumentsTab from './tabs/DocumentsTab';

interface TripDetailProps {
  trips: Trip[];
  updateTrip: (trip: Trip) => void;
  currentUser: User;
}

const TripDetail: React.FC<TripDetailProps> = ({ trips, updateTrip, currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const trip = trips.find(t => t.id === id);
  
  const [showShare, setShowShare] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Editor');
  
  const [liveWeather, setLiveWeather] = useState<{ temp: string, condition: string, time: string } | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  if (!trip) return null;

  const collaborator = trip.collaborators?.find(c => c.email === currentUser.email);
  const isOwner = trip.ownerEmail === currentUser.email;
  const currentRole: UserRole = isOwner ? 'Editor' : (collaborator?.role || 'Viewer');
  const isEditor = currentRole === 'Editor';

  const logAction = (action: string) => {
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      userEmail: currentUser.email,
      action,
      timestamp: new Date().toISOString(),
    };
    updateTrip({ ...trip, activityLogs: [newLog, ...(trip.activityLogs || [])] });
  };

  const fetchLiveInfo = async () => {
    setIsFetchingWeather(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `What is the current weather (temperature in C and condition) and current local time in ${trip.destinations[0]}?`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              temp: { type: Type.STRING },
              condition: { type: Type.STRING },
              time: { type: Type.STRING }
            },
            required: ['temp', 'condition', 'time']
          }
        },
      });
      setLiveWeather(JSON.parse(response.text));
    } catch (e) {
      console.error("Weather fetch failed", e);
    } finally {
      setIsFetchingWeather(false);
    }
  };

  useEffect(() => {
    fetchLiveInfo();
  }, [trip.id]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  };

  const tabs = [
    { name: 'Itinerary', path: 'itinerary', icon: <Calendar size={18} /> },
    { name: 'Map', path: 'map', icon: <MapIcon size={18} /> },
    { name: 'Places', path: 'places', icon: <Heart size={18} /> },
    { name: 'Budget', path: 'budget', icon: <DollarSign size={18} /> },
    { name: 'Packing', path: 'packing', icon: <Package size={18} /> },
    { name: 'Documents', path: 'docs', icon: <FileText size={18} /> },
  ];

  const packingProgress = trip.packingList.length > 0 ? (trip.packingList.filter(i => i.isPacked).length / trip.packingList.length) * 100 : 0;
  const budgetSpent = trip.budget > 0 ? (trip.expenses.reduce((sum, e) => sum + e.amount, 0) / trip.budget) * 100 : 0;
  const readiness = Math.round((packingProgress + (100 - Math.min(100, budgetSpent)) + (trip.documents.length > 0 ? 100 : 0)) / 3);

  // Parallax calculations
  const heroHeight = 500;
  const heroOpacity = Math.max(0, 1 - scrollY / 350);
  const imageScale = 1 + scrollY / 3000;
  const imageBlur = Math.min(10, scrollY / 100);

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto overflow-x-hidden bg-[#F8FAFC] dark:bg-slate-950 no-scrollbar relative"
    >
      {/* 1. Parallax Background Layer */}
      <div 
        className="absolute top-0 left-0 w-full overflow-hidden pointer-events-none z-0"
        style={{ height: heroHeight }}
      >
        <div 
          className="w-full h-full will-change-transform"
          style={{ 
            transform: `translateY(${scrollY * 0.4}px) scale(${imageScale})`,
            filter: `blur(${imageBlur}px)`
          }}
        >
          <img src={trip.coverImage} className="w-full h-[120%] object-cover" alt={trip.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-black/30" />
        </div>
      </div>

      {/* 2. Primary Navbar - Adjusted for Mobile Context */}
      <header className="sticky top-0 left-0 right-0 z-[100] transition-all duration-300">
        <div 
          className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 transition-all duration-300 border-b shadow-lg shadow-slate-900/5"
          style={{ 
            opacity: scrollY > 50 ? 1 : 0,
            backdropFilter: 'blur(16px)',
            borderBottomColor: scrollY > 50 ? 'rgba(0,0,0,0.05)' : 'transparent',
          }}
        />

        <div className="relative z-10 px-4 md:px-8 h-20 flex items-center justify-between">
          {/* Mobile Back Button */}
          <button 
            onClick={() => navigate('/')} 
            className="md:hidden w-10 h-10 flex items-center justify-center text-white bg-white/10 backdrop-blur-md rounded-xl border border-white/20 mr-2"
            style={{ color: scrollY > 50 ? 'inherit' : 'white' }}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Nav Tabs - Hidden on Mobile in favor of bottom nav */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth flex-1 mr-4">
            {tabs.map(tab => (
              <NavLink 
                key={tab.path} 
                to={`/trip/${trip.id}/${tab.path}`} 
                className={({ isActive }) => `
                  relative flex items-center gap-2.5 px-5 py-3 text-sm font-bold transition-all whitespace-nowrap rounded-2xl group/nav
                  ${isActive 
                    ? 'text-brand-primary' 
                    : scrollY > 50 ? 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100' : 'text-white/70 hover:text-white'}
                `}
              >
                <span className={`transition-colors ${location.pathname.includes(tab.path) ? 'text-brand-primary' : ''}`}>
                  {tab.icon}
                </span>
                <span>{tab.name}</span>
                {location.pathname.includes(tab.path) && (
                  <div className="absolute bottom-0 left-5 right-5 h-1 bg-brand-primary rounded-t-full shadow-[0_-2px_10px_rgba(139,92,246,0.6)]" />
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAlerts(!showAlerts)} 
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all border shadow-sm ${trip.alerts?.length > 0 ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : scrollY > 50 ? 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700' : 'bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20'}`}
            >
              <Bell size={20} />
              {trip.alerts?.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />}
            </button>
            <button 
              onClick={() => setShowShare(true)}
              className="bg-brand-primary text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Users size={16} /> <span className="hidden sm:inline">Crew</span>
            </button>
            {isEditor && (
              <button 
                onClick={() => navigate(`/edit/${trip.id}`)} 
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all border shadow-sm ${scrollY > 50 ? 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700' : 'bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20'}`}
              >
                <Settings size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3. Hero Content Section */}
      <div 
        className="relative w-full flex items-end px-6 md:px-12 pb-16 z-10 transition-opacity duration-150"
        style={{ height: heroHeight - 80, opacity: heroOpacity }}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between w-full gap-8">
          <div className="space-y-4 text-white">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-brand-primary/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest">{trip.type} Mode</span>
              {liveWeather && (
                <div className="flex items-center gap-4 text-xs font-bold text-white/80 backdrop-blur-md bg-white/10 px-4 py-1 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2"><CloudSun size={14} className="text-brand-accent" /> {liveWeather.temp}</div>
                  <div className="flex items-center gap-2"><Clock size={14} /> {liveWeather.time}</div>
                </div>
              )}
            </div>
            <h1 className="text-4xl md:text-7xl font-display font-bold tracking-tight drop-shadow-2xl max-w-3xl leading-tight">{trip.name}</h1>
            <div className="flex items-center gap-6 text-white/70 font-bold overflow-x-auto no-scrollbar whitespace-nowrap">
              <div className="flex items-center gap-2 flex-shrink-0"><MapIcon size={18} className="text-brand-primary" /> {trip.destinations[0]}</div>
              <div className="flex items-center gap-2 flex-shrink-0"><Calendar size={18} /> {trip.startDate}</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 min-w-[280px] shadow-2xl text-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Readiness Score</span>
              <span className="text-2xl font-display font-bold text-brand-primary">{readiness}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-brand-primary transition-all duration-1000 shadow-[0_0_25px_rgba(139,92,246,0.9)]" style={{ width: `${readiness}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tab Content Container */}
      <div className="relative z-10 min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-20">
        <Routes>
          <Route path="itinerary" element={<ItineraryTab trip={{...trip, currentUserRole: currentRole}} updateTrip={(t) => { updateTrip(t); logAction("Updated itinerary"); }} />} />
          <Route path="map" element={<MapTab trip={trip} />} />
          <Route path="places" element={<WishlistTab trip={trip} updateTrip={(t) => { updateTrip(t); logAction("Updated wishlist"); }} />} />
          <Route path="budget" element={<BudgetTab trip={{...trip, currentUserRole: currentRole}} updateTrip={(t) => { updateTrip(t); logAction("Modified expenses"); }} />} />
          <Route path="packing" element={<PackingTab trip={{...trip, currentUserRole: currentRole}} updateTrip={(t) => { updateTrip(t); logAction("Updated packing list"); }} />} />
          <Route path="docs" element={<DocumentsTab trip={{...trip, currentUserRole: currentRole}} updateTrip={(t) => { updateTrip(t); logAction("Modified documents"); }} />} />
          <Route path="*" element={<div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest italic opacity-50">Mapping your coordinates...</div>} />
        </Routes>
      </div>

      {showAlerts && (
        <div className="fixed top-24 right-6 md:right-10 z-[200] w-[calc(100vw-3rem)] md:w-96 bg-white dark:bg-slate-800 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] rounded-[2.5rem] border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in slide-in-from-top-4">
          <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h4 className="font-bold text-base flex items-center gap-3"><Radio size={16} className="text-red-500 animate-pulse" /> Live Intel</h4>
            <button onClick={() => setShowAlerts(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
          </div>
          <div className="max-h-[500px] overflow-y-auto p-6 space-y-4 no-scrollbar">
            {trip.alerts?.length > 0 ? trip.alerts.map(alert => (
              <div key={alert.id} className={`p-6 rounded-3xl border-l-4 ${alert.severity === 'High' ? 'bg-red-50 dark:bg-red-950/30 border-red-500' : 'bg-slate-50 dark:bg-slate-900/30 border-slate-300'}`}>
                <h5 className="font-bold text-sm mb-1">{alert.title}</h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{alert.description}</p>
              </div>
            )) : <div className="py-16 text-center text-xs text-slate-400 italic font-medium">Safe travels: No immediate alerts reported.</div>}
          </div>
        </div>
      )}

      {showShare && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-8 bg-slate-950/95 backdrop-blur-3xl overflow-hidden">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[3rem] sm:rounded-[4.5rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300 border border-white/5 flex flex-col max-h-[90vh]">
            <div className="p-8 sm:p-12 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 flex-shrink-0">
              <div>
                <h3 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 dark:text-white">Crew Hub</h3>
              </div>
              <button onClick={() => setShowShare(false)} className="w-12 h-12 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-[1.5rem] flex items-center justify-center transition-all text-slate-400 flex-shrink-0"><X size={24} /></button>
            </div>
            
            <div className="p-8 sm:p-12 space-y-10 overflow-y-auto no-scrollbar">
              {isOwner && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Send Invite</label>
                  <div className="flex gap-3">
                    <input 
                      value={inviteEmail} 
                      onChange={(e) => setInviteEmail(e.target.value)} 
                      placeholder="explorer@tripflow.ai" 
                      className="flex-1 p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl outline-none dark:text-white border-2 border-transparent focus:border-brand-primary/20 transition-all text-sm font-bold" 
                    />
                    <button 
                      onClick={() => { if(inviteEmail) { updateTrip({...trip, collaborators: [...trip.collaborators, {email: inviteEmail, role: inviteRole, avatar: `https://i.pravatar.cc/150?u=${inviteEmail}`}]}); setInviteEmail(''); } }} 
                      className="bg-brand-primary text-white px-8 rounded-3xl font-bold text-sm shadow-xl"
                    >
                      Invite
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Active Crew</label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 rounded-[2.5rem] bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-[1.5rem] bg-brand-primary flex items-center justify-center text-white font-black text-xl shadow-lg">{trip.ownerEmail[0].toUpperCase()}</div>
                      <div>
                        <p className="text-base font-bold text-slate-900 dark:text-white">{trip.ownerEmail}</p>
                        <p className="text-[9px] text-brand-primary font-black uppercase tracking-[0.2em] mt-0.5">Lead Planner</p>
                      </div>
                    </div>
                  </div>
                  {trip.collaborators?.map((col, idx) => (
                    <div key={idx} className="flex items-center justify-between p-6 rounded-[2.5rem] hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group">
                      <div className="flex items-center gap-5">
                        <img src={col.avatar} className="w-14 h-14 rounded-[1.5rem] object-cover shadow-lg border-2 border-white dark:border-slate-800 group-hover:scale-110 transition-transform" />
                        <div>
                          <p className="text-base font-bold text-slate-900 dark:text-white">{col.email}</p>
                          <p className="text-[9px] text-slate-400 flex items-center gap-1 font-bold uppercase tracking-[0.2em] mt-0.5">{col.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-8 sm:p-10 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5 flex-shrink-0 flex justify-center">
               <button onClick={() => setShowShare(false)} className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-slate-900 transition-colors">Dismiss Crew Hub</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetail;
