
import React, { useState } from 'react';
import { Trip, WishlistPlace } from '../../types';
import { 
  Heart, Plus, MapPin, Trash2, Star, Sparkles, 
  Loader2, Wand2, Search, Utensils, Camera, 
  ShoppingBag, Eye, X, Check, Clock,
  Target, Info, Navigation, Share2, Layers,
  ChevronRight, Activity, Zap
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, Type } from "@google/genai";

interface WishlistTabProps {
  trip: Trip;
  updateTrip: (trip: Trip) => void;
}

const CATEGORY_THEMES = {
  'Must See': { 
    icon: Camera, 
    color: 'text-indigo-500', 
    bg: 'bg-indigo-500', 
    light: 'bg-indigo-50 dark:bg-indigo-950/40',
    gradient: 'from-indigo-500/20 to-purple-500/20',
    intel: 'Primary Objective'
  },
  'Restaurant': { 
    icon: Utensils, 
    color: 'text-orange-500', 
    bg: 'bg-orange-500', 
    light: 'bg-orange-50 dark:bg-orange-950/40',
    gradient: 'from-orange-500/20 to-red-500/20',
    intel: 'Sustenance Hub'
  },
  'Shopping': { 
    icon: ShoppingBag, 
    color: 'text-pink-500', 
    bg: 'bg-pink-500', 
    light: 'bg-pink-50 dark:bg-pink-950/40',
    gradient: 'from-pink-500/20 to-rose-500/20',
    intel: 'Resource Acquisition'
  },
  'Maybe': { 
    icon: Eye, 
    color: 'text-slate-500', 
    bg: 'bg-slate-500', 
    light: 'bg-slate-50 dark:bg-slate-900/40',
    gradient: 'from-slate-500/20 to-slate-700/20',
    intel: 'Secondary Intel'
  }
};

const WishlistTab: React.FC<WishlistTabProps> = ({ trip, updateTrip }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [isScouting, setIsScouting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Partial<WishlistPlace>[]>([]);
  
  const [newPlace, setNewPlace] = useState<Partial<WishlistPlace>>({
    name: '',
    category: 'Must See',
    notes: '',
    rating: 5
  });

  const handleAddPlace = (place: Partial<WishlistPlace>) => {
    const item: WishlistPlace = {
      id: uuidv4(),
      name: place.name || 'New Place',
      category: place.category as any || 'Must See',
      notes: place.notes || '',
      rating: place.rating || 5
    };

    const updatedWishlist = [item, ...trip.wishlist];
    updateTrip({ ...trip, wishlist: updatedWishlist });
    
    setAiSuggestions(prev => prev.filter(p => p.name !== place.name));
  };

  const scoutAI = async () => {
    setIsScouting(true);
    setAiSuggestions([]);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Recommend 3 elite, high-value places to visit in ${trip.destinations[0]} for a ${trip.type} trip. 
                   Return as JSON array of objects with keys: name, category (Must See, Restaurant, Shopping), notes (tactical briefing).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING, enum: ['Must See', 'Restaurant', 'Shopping'] },
                notes: { type: Type.STRING }
              },
              required: ['name', 'category', 'notes']
            }
          }
        }
      });
      const data = JSON.parse(response.text);
      setAiSuggestions(data);
    } catch (e) {
      console.error("AI Scouting failed", e);
    } finally {
      setIsScouting(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlace.name) return;
    handleAddPlace(newPlace);
    setNewPlace({ name: '', category: 'Must See', notes: '', rating: 5 });
    setShowAdd(false);
  };

  const deletePlace = (id: string) => {
    const updated = trip.wishlist.filter(p => p.id !== id);
    updateTrip({ ...trip, wishlist: updated });
  };

  const filteredPlaces = trip.wishlist.filter(p => activeFilter === 'All' || p.category === activeFilter);

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-12 pb-32 no-scrollbar">
      {/* Tactical Header */}
      <section className="bg-slate-950 rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden shadow-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-brand-primary/5" />
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.3),transparent_70%)] animate-pulse" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="space-y-8 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-4 px-4 py-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 mx-auto lg:mx-0">
              <Target size={18} className="text-brand-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/70">Target Acquisition</span>
            </div>
            <h2 className="text-6xl md:text-7xl font-display font-bold leading-tight">
              Discovery <span className="text-brand-primary">Dossiers</span>
            </h2>
            <p className="text-white/50 text-xl font-medium leading-relaxed">
              Curate a high-value list of waypoints. Deploy reconnaissance protocols to find hidden local intelligence.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-5 pt-4">
              <button 
                onClick={scoutAI}
                disabled={isScouting}
                className="group px-10 py-5 bg-brand-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-4 hover:bg-brand-secondary transition-all disabled:opacity-50 shadow-2xl shadow-indigo-500/20"
              >
                {isScouting ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                {isScouting ? 'Scouting Dest...' : 'Deploy AI Recon'}
              </button>
              <button 
                onClick={() => setShowAdd(true)}
                className="px-10 py-5 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-4 hover:bg-white/10 transition-all"
              >
                <Plus size={20} /> Manual Entry
              </button>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white/10 grid grid-cols-2 gap-8 min-w-[340px]">
             <div className="text-center">
                <p className="text-3xl font-display font-bold">{trip.wishlist.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-1">Waypoints</p>
             </div>
             <div className="text-center">
                <p className="text-3xl font-display font-bold">{trip.wishlist.filter(p => p.rating === 5).length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-1">High Priority</p>
             </div>
          </div>
        </div>
      </section>

      {/* AI Discovery Stream */}
      {aiSuggestions.length > 0 && (
        <section className="bg-indigo-50/30 dark:bg-indigo-900/10 p-10 rounded-[4rem] border border-indigo-100/50 dark:border-indigo-500/10 space-y-8 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between px-4">
             <div className="flex items-center gap-3">
               <Zap size={20} className="text-brand-primary animate-pulse" />
               <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">Detected Local Intelligence</h3>
             </div>
             <button onClick={() => setAiSuggestions([])} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {aiSuggestions.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-indigo-100 dark:border-indigo-500/20 flex flex-col justify-between group hover:shadow-xl transition-all">
                <div className="space-y-4">
                  <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500 rounded-lg">{item.category}</span>
                  <h4 className="text-xl font-display font-bold dark:text-white leading-tight">{item.name}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed">"{item.notes}"</p>
                </div>
                <button 
                  onClick={() => handleAddPlace(item)}
                  className="mt-8 w-full py-4 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-secondary transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20"
                >
                  <Plus size={16} /> Intercept Asset
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Navigation Filter HUD */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-4 px-2">
        <button 
          onClick={() => setActiveFilter('All')}
          className={`px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeFilter === 'All' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700 hover:bg-slate-50'}`}
        >
          All Sectors
        </button>
        {Object.keys(CATEGORY_THEMES).map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeFilter === cat ? 'bg-brand-primary text-white shadow-xl shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700 hover:bg-slate-50'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Dossier Grid */}
      {filteredPlaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredPlaces.map(place => {
            const theme = CATEGORY_THEMES[place.category as keyof typeof CATEGORY_THEMES] || CATEGORY_THEMES['Maybe'];
            const Icon = theme.icon;
            const priorityPercent = (place.rating / 5) * 100;

            return (
              <div key={place.id} className="group relative bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200/60 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 flex flex-col hover:-translate-y-2">
                {/* Visual Signature Header */}
                <div className={`h-32 w-full relative overflow-hidden bg-gradient-to-br ${theme.gradient}`}>
                   <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-5 bg-white/20 backdrop-blur-2xl rounded-full border border-white/20 shadow-2xl transition-transform duration-700 group-hover:scale-110">
                        <Icon size={32} className="text-white" />
                      </div>
                   </div>
                   {/* Priority Overlay */}
                   <div className="absolute top-6 left-6 flex items-center gap-2">
                      <div className="px-3 py-1 bg-black/30 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-2">
                        <Activity size={10} className="text-brand-primary" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-white">{theme.intel}</span>
                      </div>
                   </div>
                </div>

                <div className="p-10 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.color}`}>{place.category}</span>
                      <h4 className="text-2xl font-display font-bold text-slate-900 dark:text-white leading-tight">{place.name}</h4>
                    </div>
                  </div>

                  {/* Priority Gauge */}
                  <div className="space-y-3 mb-8">
                     <div className="flex justify-between items-end">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tactical Priority</span>
                        <span className="text-xs font-display font-bold text-slate-900 dark:text-white">{priorityPercent}%</span>
                     </div>
                     <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full flex gap-1 p-0.5">
                        {Array.from({length: 5}).map((_, i) => (
                           <div key={i} className={`flex-1 rounded-full transition-all duration-1000 ${i < place.rating ? theme.bg : 'bg-transparent'}`} style={{ transitionDelay: `${i * 100}ms` }} />
                        ))}
                     </div>
                  </div>

                  {/* Intelligence Tags */}
                  <div className="flex flex-wrap gap-2 mb-8">
                    <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-2">
                       <Clock size={10} className="text-slate-400" />
                       <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Peak: 11:00</span>
                    </div>
                    <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-2">
                       <Zap size={10} className="text-emerald-500" />
                       <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Hidden Gem</span>
                    </div>
                  </div>

                  {/* Observation Log */}
                  <div className="relative p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-white/5 mb-8 group/log overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none font-mono text-[60px] leading-none uppercase">Intel</div>
                    <div className="flex items-center gap-2 mb-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                       <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">Field Observations</span>
                    </div>
                    <p className="text-[13px] text-slate-600 dark:text-slate-300 font-mono leading-relaxed italic relative z-10">
                      "{place.notes || 'No briefing recorded. Awaiting field data.'}"
                    </p>
                  </div>
                  
                  {/* HUD Action Suite */}
                  <div className="mt-auto flex items-center justify-between pt-8 border-t border-slate-100 dark:border-white/5">
                    <div className="flex gap-3">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + trip.destinations[0])}`}
                        target="_blank" rel="noopener noreferrer"
                        className="p-3 bg-slate-50 dark:bg-slate-950 hover:bg-brand-primary hover:text-white text-slate-400 rounded-2xl transition-all border border-slate-100 dark:border-white/5 flex items-center gap-2"
                      >
                        <Navigation size={16} />
                        <span className="hidden group-hover:inline text-[9px] font-black uppercase tracking-widest">Maps</span>
                      </a>
                      <button className="p-3 bg-slate-50 dark:bg-slate-950 hover:bg-brand-primary hover:text-white text-slate-400 rounded-2xl transition-all border border-slate-100 dark:border-white/5 flex items-center gap-2">
                        <Layers size={16} />
                        <span className="hidden group-hover:inline text-[9px] font-black uppercase tracking-widest">Phase</span>
                      </button>
                    </div>
                    <button 
                      onClick={() => deletePlace(place.id)}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-40 text-center bg-white dark:bg-slate-900 rounded-[5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-10 text-slate-200">
             <Target size={48} />
          </div>
          <h4 className="text-3xl font-display font-bold text-slate-400 uppercase tracking-widest">Asset List Empty</h4>
          <p className="text-slate-500 mt-4 mb-10 text-lg">Infiltrate the destination by adding manual waypoints or deploying AI Recon.</p>
          <button onClick={() => setShowAdd(true)} className="px-12 py-5 bg-brand-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl">Initialize Entry</button>
        </div>
      )}

      {/* Entry Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[4rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-12 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div>
                <h3 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Register Waypoint</h3>
                <p className="text-slate-400 font-medium">Capture intelligence on a new destination.</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="w-12 h-12 hover:bg-white dark:hover:bg-slate-800 rounded-[1.5rem] flex items-center justify-center text-slate-400 transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleManualSubmit} className="p-12 space-y-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asset Name</label>
                <input 
                  required
                  value={newPlace.name}
                  onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                  className="w-full p-6 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-brand-primary rounded-[2rem] font-bold text-lg outline-none dark:text-white transition-all"
                  placeholder="e.g., Shibuya Sky Observatory"
                />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sector</label>
                  <select 
                    value={newPlace.category}
                    onChange={(e) => setNewPlace({ ...newPlace, category: e.target.value as any })}
                    className="w-full p-6 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-brand-primary rounded-[2rem] font-bold outline-none dark:text-white"
                  >
                    {Object.keys(CATEGORY_THEMES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Priority (1-5)</label>
                  <input 
                    type="number" min="1" max="5"
                    value={newPlace.rating}
                    onChange={(e) => setNewPlace({ ...newPlace, rating: Number(e.target.value) })}
                    className="w-full p-6 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-brand-primary rounded-[2rem] font-bold outline-none dark:text-white text-center"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Recon Intelligence</label>
                <textarea 
                  value={newPlace.notes}
                  onChange={(e) => setNewPlace({ ...newPlace, notes: e.target.value })}
                  className="w-full p-6 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-brand-primary rounded-[2rem] font-medium outline-none h-32 dark:text-white"
                  placeholder="Operational notes and arrival details..."
                />
              </div>
              <button 
                type="submit"
                className="w-full py-7 bg-brand-primary text-white font-black text-xs uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-indigo-500/30 hover:scale-[1.02] transition-all"
              >
                Seal Entry & Deploy
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistTab;
