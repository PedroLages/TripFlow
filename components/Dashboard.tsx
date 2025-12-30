
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trip, UserSettings } from '../types';
import { 
  Plus, MapPin, Calendar, Clock, Globe, Briefcase, Trash2, 
  Compass, ArrowUpRight, TrendingUp, Sparkles, Loader2, 
  CloudSun, Users, Activity, Wallet, ChevronRight 
} from 'lucide-react';
import { format, differenceInDays, parseISO, isAfter } from 'date-fns';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  trips: Trip[];
  settings: UserSettings;
  deleteTrip: (id: string) => void;
}

const FALLBACK_TIPS = [
  "Always carry a physical backup of your primary credentials.",
  "Download offline sectors for your mission area before deployment.",
  "Secure your digital presence with a tactical VPN connection.",
  "Synchronize your local time settings immediately upon arrival.",
  "Monitor local weather patterns for potential operational disruptions."
];

const Dashboard: React.FC<DashboardProps> = ({ trips, settings, deleteTrip }) => {
  const navigate = useNavigate();
  const today = new Date();
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);

  const upcomingTrips = trips.filter(t => isAfter(parseISO(t.endDate), today)).sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
  
  const stats = {
    totalTrips: trips.length,
    countriesVisited: new Set(trips.flatMap(t => t.destinations)).size,
    totalBudget: trips.reduce((acc, t) => acc + (t.budget || 0), 0),
    daysTraveled: trips.reduce((acc, t) => {
      const start = parseISO(t.startDate);
      const end = parseISO(t.endDate);
      return acc + (differenceInDays(end, start) || 1);
    }, 0)
  };

  useEffect(() => {
    const fetchAITip = async () => {
      if (upcomingTrips.length === 0) return;
      setIsLoadingTip(true);
      try {
        const nextDest = upcomingTrips[0].destinations[0];
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Provide one short, clever travel tip or cultural etiquette for ${nextDest}. Keep it under 15 words.`,
          config: { thinkingConfig: { thinkingBudget: 0 } }
        });
        setAiTip(response.text || null);
      } catch (e) {
        console.warn("AI Tip quota limit or error. Using fallback intel.");
        const randomTip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
        setAiTip(randomTip);
      } finally {
        setIsLoadingTip(false);
      }
    };
    fetchAITip();
  }, [upcomingTrips.length]);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 md:p-10 max-w-7xl mx-auto w-full space-y-10 no-scrollbar">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <Activity size={12} /> Live Dashboard
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-brand-secondary dark:text-white">
            Ready to explore, <span className="text-brand-primary">{settings.name}?</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg">You have {upcomingTrips.length} upcoming adventures planned.</p>
        </div>
        <button 
          onClick={() => navigate('/create')}
          className="group relative bg-brand-secondary hover:bg-brand-primary text-white px-8 py-5 rounded-[2rem] font-bold transition-all duration-500 flex items-center gap-3 shadow-2xl shadow-indigo-900/10 overflow-hidden"
        >
          <Plus size={22} className="group-hover:rotate-90 transition-transform duration-500" />
          <span>New Expedition</span>
        </button>
      </header>

      {/* Bento Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4">
        {/* Main Stats Card */}
        <div className="md:col-span-2 md:row-span-2 bg-brand-secondary rounded-[3rem] p-10 text-white flex flex-col justify-between relative overflow-hidden group border border-white/5">
          <Globe className="absolute -right-10 -bottom-10 w-72 h-72 text-white/5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <span className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">World Footprint</span>
              <TrendingUp className="text-brand-success" size={20} />
            </div>
            <div className="mt-12">
              <h3 className="text-7xl font-display font-bold">{stats.countriesVisited}</h3>
              <p className="text-white/50 font-bold uppercase tracking-widest text-xs mt-2">Destinations Visited</p>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-6 pt-10 border-t border-white/10 mt-10">
            <div>
              <p className="text-2xl font-bold">{stats.daysTraveled}</p>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Total Days</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-2xl font-bold">{stats.totalTrips}</p>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Trips Logged</p>
            </div>
          </div>
        </div>
        
        {/* AI Insight Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-500 to-brand-primary rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-xl shadow-indigo-900/20">
          <Sparkles className="absolute right-6 top-6 text-white/20" size={48} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-4">
              <Sparkles size={14} /> AI Intel
            </div>
            {upcomingTrips.length > 0 ? (
              <div className="space-y-2">
                <p className="text-white/60 text-xs font-bold">Pro-tip for {upcomingTrips[0].destinations[0]}:</p>
                {isLoadingTip ? (
                  <Loader2 className="animate-spin opacity-40" />
                ) : (
                  <h4 className="text-xl font-bold leading-tight">"{aiTip || "Remember to pack your local power adapters!"}"</h4>
                )}
              </div>
            ) : (
              <h4 className="text-xl font-bold">Start your next plan to get custom AI travel insights.</h4>
            )}
          </div>
          <button className="absolute bottom-6 right-8 p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Small Stat Cards */}
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-700 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-brand-primary mb-3">
            <Wallet size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Financials</span>
          </div>
          <p className="text-3xl font-display font-bold text-brand-secondary dark:text-white">${stats.totalBudget.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Total Allocated</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-700 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-orange-500 mb-3">
            <CloudSun size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Next Stop</span>
          </div>
          <p className="text-2xl font-display font-bold text-brand-secondary dark:text-white truncate">
            {upcomingTrips[0]?.destinations[0] || 'TBD'}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Primary Goal</p>
        </div>
      </section>

      {/* Trip List */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-2xl font-display font-bold flex items-center gap-3">
            <Calendar className="text-brand-primary" />
            Your Expeditions
          </h3>
          <div className="flex gap-2">
             <button className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-brand-primary transition-colors">All</button>
             <button className="px-4 py-2 text-xs font-bold text-brand-primary bg-brand-primary/5 rounded-xl">Upcoming</button>
             <button className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-brand-primary transition-colors">Past</button>
          </div>
        </div>
        
        {upcomingTrips.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {upcomingTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} deleteTrip={deleteTrip} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800/50 rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
            <div className="mx-auto w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Compass className="text-slate-300" size={48} />
            </div>
            <h4 className="text-2xl font-bold text-slate-400">The world is waiting.</h4>
            <p className="text-slate-500 mt-2 mb-10 max-w-sm mx-auto">Create your first itinerary to unlock smart grouping, AI suggestions, and live tracking.</p>
            <button 
              onClick={() => navigate('/create')}
              className="bg-brand-primary text-white px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl shadow-indigo-900/10"
            >
              Start Planning
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

const TripCard: React.FC<{ trip: Trip; deleteTrip: (id: string) => void }> = ({ trip, deleteTrip }) => {
  const navigate = useNavigate();
  const daysUntil = differenceInDays(parseISO(trip.startDate), new Date());
  
  // Find the next activity (the one with the earliest start time on day 1 for simulation)
  const nextActivity = trip.itinerary?.[0]?.activities?.[0];

  return (
    <div 
      className="bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 border border-slate-200/60 dark:border-slate-700 group cursor-pointer flex flex-col md:flex-row h-auto min-h-[16rem]"
      onClick={() => navigate(`/trip/${trip.id}/itinerary`)}
    >
      <div className="md:w-5/12 relative h-56 md:h-auto overflow-hidden">
        <img src={trip.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" alt={trip.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
        <div className="absolute top-6 left-6 flex gap-2">
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-secondary">
            {trip.type}
          </div>
        </div>
        {daysUntil > 0 && daysUntil < 30 && (
           <div className="absolute bottom-6 left-6 bg-brand-primary text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-lg">
             T-Minus {daysUntil} Days
           </div>
        )}
      </div>
      
      <div className="flex-1 p-8 flex flex-col justify-between relative bg-white dark:bg-slate-800">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h4 className="text-2xl font-display font-bold group-hover:text-brand-primary transition-colors line-clamp-1">{trip.name}</h4>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin size={14} className="text-brand-primary" />
                <span className="text-xs font-bold truncate max-w-[200px]">{trip.destinations.join(' → ')}</span>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); if(confirm('Archive this expedition?')) deleteTrip(trip.id); }}
              className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* Next Activity Preview */}
          {nextActivity && (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex items-center justify-between group-hover:bg-brand-primary/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-brand-primary shadow-sm">
                  <Clock size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Upcoming Stop</p>
                  <p className="text-xs font-bold truncate max-w-[150px]">{nextActivity.name}</p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400">{nextActivity.startTime}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 dark:border-slate-700 border-dashed">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {trip.collaborators?.slice(0, 2).map((c, i) => (
                <img key={i} src={c.avatar} className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" />
              ))}
              {trip.collaborators?.length > 2 && (
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-500">
                  +{trip.collaborators.length - 2}
                </div>
              )}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Access</span>
          </div>
          
          <div className="flex items-center gap-2 group/btn">
             <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Open Desk</span>
             <div className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl group-hover/btn:bg-brand-primary group-hover/btn:text-white transition-all">
                <ArrowUpRight size={16} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
