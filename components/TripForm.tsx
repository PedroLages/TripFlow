
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trip, TripType } from '../types';
import {
  ChevronLeft, Save, Image as ImageIcon, Plus, X,
  Target, Calendar, Wallet, Compass, Info,
  CheckCircle2, Globe, MapPin, Users, User,
  Briefcase, Heart, Sparkles, Send
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { addDays, format, differenceInDays, parseISO } from 'date-fns';
import { useTerminologyContext } from '../hooks/TerminologyContext';

interface TripFormProps {
  trips?: Trip[];
  onSubmit: (trip: Trip) => void;
}

const TRIP_TYPES: { type: TripType; icon: any; label: string }[] = [
  { type: 'Solo', icon: User, label: 'Solo Op' },
  { type: 'Couple', icon: Heart, label: 'Duo Task' },
  { type: 'Family', icon: Users, label: 'Base Unit' },
  { type: 'Friends', icon: Sparkles, label: 'Squad' },
  { type: 'Business', icon: Briefcase, label: 'Contract' },
];

const TripForm: React.FC<TripFormProps> = ({ trips = [], onSubmit }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t: term, languageMode } = useTerminologyContext();
  const isEditing = !!id;

  const [formData, setFormData] = useState<Partial<Trip>>({
    id: uuidv4(),
    name: '',
    destinations: [''],
    startDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    type: 'Solo' as TripType,
    coverImage: `https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=1200`,
    description: '',
    budget: 0,
    itinerary: [],
    wishlist: [],
    expenses: [],
    packingList: [],
    documents: [],
    collaborators: [],
    alerts: [],
    activityLogs: []
  });

  useEffect(() => {
    if (isEditing && trips.length > 0) {
      const tripToEdit = trips.find(t => t.id === id);
      if (tripToEdit) setFormData(tripToEdit);
    }
  }, [id, isEditing, trips]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDestinationChange = (index: number, value: string) => {
    const newDests = [...(formData.destinations || [])];
    newDests[index] = value;
    setFormData(prev => ({ ...prev, destinations: newDests }));
  };

  const addDestination = () => setFormData(prev => ({ ...prev, destinations: [...(prev.destinations || []), ''] }));
  const removeDestination = (index: number) => setFormData(prev => ({ ...prev, destinations: prev.destinations?.filter((_, i) => i !== index) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStart = parseISO(formData.startDate!);
    const newEnd = parseISO(formData.endDate!);
    const daysCount = Math.max(1, differenceInDays(newEnd, newStart) + 1);

    // Calculate itinerary with smart date shifting
    let itinerary;

    if (isEditing && formData.itinerary && formData.itinerary.length > 0 && formData.itinerary[0]?.date) {
      // Editing existing trip: shift dates if start date changed
      const oldStartDate = parseISO(formData.itinerary[0].date);
      const dateDelta = differenceInDays(newStart, oldStartDate);

      if (dateDelta !== 0) {
        // Shift all existing days by the date delta
        const shiftedItinerary = formData.itinerary.map(day => ({
          ...day,
          date: format(addDays(parseISO(day.date), dateDelta), 'yyyy-MM-dd')
        }));

        // Adjust for length changes (add/remove days)
        if (shiftedItinerary.length < daysCount) {
          // Add new days
          const newDays = Array.from(
            { length: daysCount - shiftedItinerary.length },
            (_, i) => ({
              id: uuidv4(),
              date: format(addDays(newStart, shiftedItinerary.length + i), 'yyyy-MM-dd'),
              activities: []
            })
          );
          itinerary = [...shiftedItinerary, ...newDays];
        } else if (shiftedItinerary.length > daysCount) {
          // Remove excess days from the end
          itinerary = shiftedItinerary.slice(0, daysCount);
        } else {
          itinerary = shiftedItinerary;
        }
      } else {
        // Start date didn't change, just adjust length
        if (formData.itinerary.length < daysCount) {
          const lastDate = parseISO(formData.itinerary[formData.itinerary.length - 1].date);
          const newDays = Array.from(
            { length: daysCount - formData.itinerary.length },
            (_, i) => ({
              id: uuidv4(),
              date: format(addDays(lastDate, i + 1), 'yyyy-MM-dd'),
              activities: []
            })
          );
          itinerary = [...formData.itinerary, ...newDays];
        } else if (formData.itinerary.length > daysCount) {
          itinerary = formData.itinerary.slice(0, daysCount);
        } else {
          itinerary = formData.itinerary;
        }
      }
    } else {
      // Creating new trip: generate fresh itinerary
      itinerary = Array.from({ length: daysCount }, (_, i) => ({
        id: uuidv4(),
        date: format(addDays(newStart, i), 'yyyy-MM-dd'),
        activities: []
      }));
    }

    const completeTrip = { ...formData, itinerary } as Trip;
    onSubmit(completeTrip);
    navigate(isEditing ? `/trip/${id}/itinerary` : '/');
  };

  return (
    <div className="h-full bg-white dark:bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-40 md:pb-8">
        <div className="max-w-6xl mx-auto w-full p-6 md:p-12 space-y-12">
          
          <header className="flex items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <button 
              onClick={() => navigate(-1)} 
              className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-slate-400 hover:text-brand-primary"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-primary mb-1">{term.trip} Manager</p>
              <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
                {isEditing ? term.editTrip : term.createTrip}
              </h2>
            </div>
          </header>

          <form id="trip-mission-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Mission Details */}
            <div className="lg:col-span-7 space-y-10">
              <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 space-y-8">
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <Target size={14} className="text-brand-primary" /> {term.trip} Name
                  </label>
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={`e.g., ${languageMode === 'tactical' ? 'Operation Tokyo Drift' : 'Tokyo Adventure'}`}
                    className="w-full text-2xl font-display font-bold bg-transparent border-b border-slate-200 dark:border-slate-800 focus:border-brand-primary outline-none pb-3 transition-all dark:text-white placeholder:opacity-30"
                  />
                </div>

                <div className="space-y-6">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <Users size={14} className="text-brand-primary" /> {term.trip} Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {TRIP_TYPES.map(item => {
                      const Icon = item.icon;
                      const isSelected = formData.type === item.type;
                      return (
                        <button 
                          key={item.type}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, type: item.type }))}
                          className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                            isSelected 
                              ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' 
                              : 'bg-white dark:bg-slate-950 border-transparent text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <Icon size={20} />
                          <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <MapPin size={14} className="text-brand-primary" /> Deployment Sectors
                  </label>
                  <div className="space-y-3 relative pl-6">
                    <div className="absolute left-3 top-4 bottom-4 w-px bg-slate-200 dark:bg-slate-800" />
                    {formData.destinations?.map((dest, index) => (
                      <div key={index} className="relative flex gap-3">
                        <div className="absolute -left-[1.35rem] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-primary border-2 border-white dark:border-slate-900 shadow-md" />
                        <input 
                          required
                          value={dest}
                          onChange={(e) => handleDestinationChange(index, e.target.value)}
                          placeholder="Sector (City, Country)"
                          className="flex-1 bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-brand-primary/20 dark:text-white font-bold text-sm"
                        />
                        {formData.destinations!.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeDestination(index)} 
                            className="p-3 text-slate-300 hover:text-red-500 transition-all"
                          >
                            <X size={20}/>
                          </button>
                        )}
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={addDestination} 
                      className="flex items-center gap-3 text-brand-primary text-[10px] font-black uppercase tracking-widest mt-4 hover:translate-x-1 transition-transform"
                    >
                      <Plus size={14} className="bg-brand-primary/10 rounded-full p-0.5" /> Append Sector
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Logistics & Visuals */}
            <div className="lg:col-span-5 space-y-10">
              <section className="bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] overflow-hidden border border-slate-100 dark:border-white/5">
                <div className="h-48 relative">
                  <img src={formData.coverImage} className="w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6 flex items-center gap-3">
                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white"><ImageIcon size={18} /></div>
                    <p className="text-white text-[10px] font-black uppercase tracking-widest">Visual Identity</p>
                  </div>
                </div>
                <div className="p-8 space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cover Image URL</label>
                  <input 
                    name="coverImage"
                    value={formData.coverImage}
                    onChange={handleChange}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20 dark:text-white text-[10px] font-mono"
                  />
                </div>
              </section>

              <section className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-8 shadow-2xl">
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    <Calendar size={14} className="text-brand-primary" /> Operational Window
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/30">From</p>
                      <input 
                        required
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-brand-primary font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Until</p>
                      <input 
                        required
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-brand-primary font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    <Wallet size={14} className="text-brand-primary" /> Capital Allocation
                  </label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary font-display font-bold text-lg">$</div>
                    <input 
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="Total Budget"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-5 py-5 outline-none focus:border-brand-primary font-display font-bold text-xl"
                    />
                  </div>
                </div>
              </section>
            </div>
          </form>
        </div>
      </div>

      {/* Persistent Mobile-First Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-[100] md:relative md:p-12 md:flex md:justify-end">
        <button
          form="trip-mission-form"
          type="submit"
          className="w-full md:w-auto bg-brand-primary hover:bg-brand-primary/90 text-white font-black text-xs uppercase tracking-[0.3em] py-6 px-12 rounded-[2rem] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4"
        >
          <Send size={18} />
          {isEditing ? term.saveTrip : term.createTrip}
        </button>
      </div>
    </div>
  );
};

export default TripForm;
