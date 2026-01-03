
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trip, WishlistPlace, Activity } from '../../types';
import {
  Heart, Plus, MapPin, Trash2, Star, Sparkles,
  Loader2, Wand2, Search, Utensils, Camera,
  ShoppingBag, Eye, X, Check, Clock,
  Target, Info, Navigation, Share2, Layers,
  ChevronRight, Activity as ActivityIcon, Zap, CalendarPlus,
  Calendar, Map
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { geminiService } from '../../src/services/GeminiService';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';

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

type SortOption = 'priority' | 'name' | 'dateAdded';

const WishlistTab: React.FC<WishlistTabProps> = ({ trip, updateTrip }) => {
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [isScouting, setIsScouting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Partial<WishlistPlace>[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [openDaySelector, setOpenDaySelector] = useState<string | null>(null);
  const [addedPlaces, setAddedPlaces] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [placeToDelete, setPlaceToDelete] = useState<string | null>(null);

  const [newPlace, setNewPlace] = useState<Partial<WishlistPlace>>({
    name: '',
    category: 'Must See',
    notes: '',
    rating: 5
  });

  // ESC key handler for modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAdd) {
        setShowAdd(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAdd]);

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
      // Extract trip context
      const startDate = new Date(trip.startDate);
      const month = startDate.toLocaleString('en-US', { month: 'long' });

      // Extract existing activities for context
      const plannedActivities = trip.itinerary
        .flatMap(day => day.activities)
        .map(act => act.name)
        .slice(0, 5);

      const activityContext = plannedActivities.length > 0
        ? `Already planning: ${plannedActivities.join(', ')}.`
        : '';

      const response = await geminiService.generateText({
        prompt: `You're a local insider in ${trip.destinations[0]}. Recommend 5 exceptional places for a ${trip.type.toLowerCase()} trip in ${month}.

**Context:**
${activityContext}
Trip type: ${trip.type}
${trip.notes ? `Notes: ${trip.notes}` : ''}

**Requirements:**
1. Mix categories: 2 Must See attractions, 2 Restaurants, 1 Shopping/local market
2. Avoid tourist traps - focus on authentic, highly-rated experiences
3. Consider ${trip.type.toLowerCase()} preferences (e.g., romantic for couples, kid-friendly for families)
4. For each place, provide tactical notes: what makes it special, best time to visit, insider tip

Return JSON array with: {name, category (Must See/Restaurant/Shopping), notes (2-3 sentences with insider tip)}.`,
        model: 'gemini-2.0-flash-exp',
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                category: { type: 'string', enum: ['Must See', 'Restaurant', 'Shopping'] },
                notes: { type: 'string' }
              },
              required: ['name', 'category', 'notes']
            }
          }
        }
      });
      const data = JSON.parse(response);
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

  const requestDeletePlace = (id: string) => {
    setPlaceToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeletePlace = () => {
    if (placeToDelete) {
      const updated = trip.wishlist.filter(p => p.id !== placeToDelete);
      updateTrip({ ...trip, wishlist: updated });
    }
    setShowDeleteModal(false);
    setPlaceToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPlaceToDelete(null);
  };

  const addToItinerary = (place: WishlistPlace, dayId: string) => {
    const dayIndex = trip.itinerary.findIndex(d => d.id === dayId);
    if (dayIndex === -1) return;

    // Create a new activity from the wishlist place
    const newActivity: Activity = {
      id: uuidv4(),
      type: place.category === 'Restaurant' ? 'Restaurant' :
            place.category === 'Shopping' ? 'Custom' : 'Attraction',
      name: place.name,
      startTime: '10:00',
      endTime: '11:00',
      location: place.location || '',
      notes: place.notes,
      cost: 0,
    };

    // Add to day's activities
    const updatedItinerary = [...trip.itinerary];
    updatedItinerary[dayIndex] = {
      ...updatedItinerary[dayIndex],
      activities: [...updatedItinerary[dayIndex].activities, newActivity],
    };

    updateTrip({ ...trip, itinerary: updatedItinerary });

    // Visual feedback
    setAddedPlaces(prev => new Set([...prev, place.id]));
    setOpenDaySelector(null);

    // Clear feedback after 2 seconds
    setTimeout(() => {
      setAddedPlaces(prev => {
        const next = new Set(prev);
        next.delete(place.id);
        return next;
      });
    }, 2000);
  };

  // Advanced filtering and sorting
  const filteredPlaces = React.useMemo(() => {
    let places = trip.wishlist;

    // Category filter
    if (activeFilter !== 'All') {
      places = places.filter(p => p.category === activeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      places = places.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.notes.toLowerCase().includes(query) ||
        (p.location && p.location.toLowerCase().includes(query))
      );
    }

    // Sort
    const sorted = [...places];
    switch (sortBy) {
      case 'priority':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'dateAdded':
        // Newest first (assuming order in array represents date added)
        // In a real app, we'd have a createdAt timestamp
        break;
      default:
        break;
    }

    return sorted;
  }, [trip.wishlist, activeFilter, searchQuery, sortBy]);

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
                onClick={() => navigate(`/trip/${trip.id}/map`, { state: { showWishlist: true } })}
                className="px-10 py-5 bg-emerald-500/20 hover:bg-emerald-500/30 backdrop-blur-xl border border-emerald-400/30 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-4 hover:shadow-xl transition-all"
              >
                <Map size={20} /> View on Map
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

      {/* Search & Sort Controls */}
      <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-center">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search places, notes, locations..."
            className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-brand-primary rounded-[2rem] font-medium text-sm outline-none dark:text-white transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
            >
              <X size={16} className="text-slate-400" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-[2rem] px-6 py-3">
          <Layers size={18} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent font-bold text-sm outline-none dark:text-white pr-2 cursor-pointer"
          >
            <option value="priority">Priority</option>
            <option value="name">Name (A-Z)</option>
            <option value="dateAdded">Recently Added</option>
          </select>
        </div>
      </div>

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

      {/* Results Summary */}
      {(searchQuery || activeFilter !== 'All') && (
        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
          <ActivityIcon size={16} className="text-brand-primary" />
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Showing {filteredPlaces.length} of {trip.wishlist.length} places
            {searchQuery && <span className="text-slate-400"> · Searching for "{searchQuery}"</span>}
          </span>
        </div>
      )}

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
                        <ActivityIcon size={10} className="text-brand-primary" />
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

                      {/* Add to Itinerary Dropdown */}
                      <div className="relative">
                        {addedPlaces.has(place.id) ? (
                          <button
                            className="p-3 bg-emerald-500 text-white rounded-2xl transition-all border border-emerald-400 flex items-center gap-2 pointer-events-none"
                          >
                            <Check size={16} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Added</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setOpenDaySelector(openDaySelector === place.id ? null : place.id)}
                              className="p-3 bg-slate-50 dark:bg-slate-950 hover:bg-brand-primary hover:text-white text-slate-400 rounded-2xl transition-all border border-slate-100 dark:border-white/5 flex items-center gap-2"
                            >
                              <CalendarPlus size={16} />
                              <span className="hidden group-hover:inline text-[9px] font-black uppercase tracking-widest">Add</span>
                            </button>

                            {/* Day Selector Dropdown */}
                            {openDaySelector === place.id && (
                              <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 min-w-[200px]">
                                <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Add to Day</span>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                  {trip.itinerary.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-slate-400">
                                      No days in itinerary
                                    </div>
                                  ) : (
                                    trip.itinerary.map((day, index) => (
                                      <button
                                        key={day.id}
                                        onClick={() => addToItinerary(place, day.id)}
                                        className="w-full px-4 py-3 text-left hover:bg-brand-primary hover:text-white transition-all flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                                      >
                                        <Calendar size={14} className="flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-bold truncate">Day {index + 1}</div>
                                          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                            {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
                                          </div>
                                        </div>
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => requestDeletePlace(place.id)}
                      aria-label={`Remove ${place.name} from wishlist`}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl transition-all"
                    >
                      <Trash2 size={18} aria-hidden="true" />
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-3xl">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] sm:rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col border border-white/5">
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 flex-shrink-0">
              <div>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">Register Waypoint</h3>
                <p className="text-slate-400 font-medium text-sm">Capture intelligence on a new destination.</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 transition-all flex-shrink-0"><X size={20} /></button>
            </div>
            <form onSubmit={handleManualSubmit} className="p-6 sm:p-8 space-y-8 overflow-y-auto flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asset Name</label>
                <input
                  required
                  value={newPlace.name}
                  onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-brand-primary rounded-2xl font-medium text-sm outline-none dark:text-white transition-all"
                  placeholder="e.g., Shibuya Sky Observatory"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sector</label>
                  <select
                    value={newPlace.category}
                    onChange={(e) => setNewPlace({ ...newPlace, category: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-brand-primary rounded-2xl font-medium outline-none dark:text-white text-sm"
                  >
                    {Object.keys(CATEGORY_THEMES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Priority (1-5)</label>
                  <input
                    type="number" min="1" max="5"
                    value={newPlace.rating}
                    onChange={(e) => setNewPlace({ ...newPlace, rating: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-brand-primary rounded-2xl font-medium outline-none dark:text-white text-center text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Recon Intelligence</label>
                <textarea
                  value={newPlace.notes}
                  onChange={(e) => setNewPlace({ ...newPlace, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-brand-primary rounded-2xl font-medium outline-none h-24 dark:text-white text-sm"
                  placeholder="Operational notes and arrival details..."
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-brand-primary text-white font-medium text-xs uppercase tracking-widest rounded-2xl shadow-2xl shadow-indigo-500/30 hover:scale-[1.02] transition-all"
              >
                Seal Entry & Deploy
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={confirmDeletePlace}
        onCancel={cancelDelete}
        title="Remove from Wishlist?"
        message="Are you sure you want to remove this place from your wishlist? You can always add it back later."
        confirmLabel="Remove"
        itemType="place"
      />
    </div>
  );
};

export default WishlistTab;
