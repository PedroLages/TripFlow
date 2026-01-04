
import React, { useState } from 'react';
import { Trip, Activity, ActivityType, TravelDocument } from '../../types';
import {
  Plus, MapPin, Trash2, Wand2,
  Palmtree, Utensils, Plane, Bed, Camera, Ticket, Coffee,
  ShoppingBag, Bus, Ship, TramFront, Mountain, Waves,
  Beer, Music, Theater, Landmark,
  Car, Bike, Footprints, LucideIcon, Sparkles, X,
  CheckCircle2, Target, Heart, Edit3
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { useTerminology } from '../../hooks/TerminologyContext';
import { useSwipeToDismiss } from '../../hooks/useSwipeToDismiss';
import { ConfirmDialog } from '../ConfirmDialog';
import {
  useAddPhaseMutation,
  useDeletePhaseMutation,
  useAddActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} from '../../src/hooks/useItineraryMutations';

interface ItineraryTabProps {
  trip: Trip;
  updateTrip: (trip: Trip) => void;
}

const TACTICAL_ICONS = [
  { name: 'Landmark', icon: Landmark },
  { name: 'Utensils', icon: Utensils },
  { name: 'Plane', icon: Plane },
  { name: 'Bed', icon: Bed },
  { name: 'Palmtree', icon: Palmtree },
  { name: 'Camera', icon: Camera },
  { name: 'Ticket', icon: Ticket },
  { name: 'Coffee', icon: Coffee },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Bus', icon: Bus },
  { name: 'Ship', icon: Ship },
  { name: 'TramFront', icon: TramFront },
  { name: 'Mountain', icon: Mountain },
  { name: 'Waves', icon: Waves },
  { name: 'Beer', icon: Beer },
  { name: 'Music', icon: Music },
  { name: 'Theater', icon: Theater },
  { name: 'Car', icon: Car },
  { name: 'Bike', icon: Bike },
  { name: 'Footprints', icon: Footprints },
  { name: 'Heart', icon: Heart }
];

const ICON_MAP: Record<string, LucideIcon> = TACTICAL_ICONS.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.icon }), {});

const ACTIVITY_META: Record<ActivityType, { color: string, lightColor: string, defaultIcon: string }> = {
  'Attraction': { color: 'bg-indigo-600', lightColor: 'bg-indigo-50 dark:bg-indigo-900/20', defaultIcon: 'Landmark' },
  'Restaurant': { color: 'bg-brand-accent', lightColor: 'bg-orange-50 dark:bg-orange-900/20', defaultIcon: 'Utensils' },
  'Transportation': { color: 'bg-slate-900', lightColor: 'bg-slate-100 dark:bg-slate-800', defaultIcon: 'Plane' },
  'Accommodation': { color: 'bg-teal-500', lightColor: 'bg-teal-50 dark:bg-teal-900/20', defaultIcon: 'Bed' },
  'Tour': { color: 'bg-purple-500', lightColor: 'bg-purple-50 dark:bg-purple-900/20', defaultIcon: 'Footprints' },
  'Free time': { color: 'bg-emerald-500', lightColor: 'bg-emerald-50 dark:bg-emerald-900/20', defaultIcon: 'Coffee' },
  'Custom': { color: 'bg-pink-500', lightColor: 'bg-pink-50 dark:bg-pink-900/20', defaultIcon: 'Target' }
};

const ActivityIcon = ({ name, className }: { name?: string, className?: string }) => {
  const IconComponent = ICON_MAP[name || 'MapPin'] || MapPin;
  return <IconComponent className={className} />;
};

const ItineraryTab: React.FC<ItineraryTabProps> = ({ trip, updateTrip }) => {
  const t = useTerminology();
  const [editingActivity, setEditingActivity] = useState<{ dayId: string; activity: Activity | null } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ dayId: string; activityId: string } | null>(null);
  const isEditor = trip.currentUserRole === 'Editor';

  // Swipe-to-dismiss for mobile (only enabled on mobile devices)
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const { translateY, handleTouchStart, handleTouchMove, handleTouchEnd, isDragging } = useSwipeToDismiss({
    onDismiss: () => setEditingActivity(null),
    threshold: 150,
    enabled: isMobile && !!editingActivity
  });

  // ESC key handler for modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editingActivity) {
        setEditingActivity(null);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [editingActivity]);

  // Hide navigation bars when modal is open (mobile only)
  React.useEffect(() => {
    const header = document.querySelector('header');
    const bottomNav = document.querySelector('nav[class*="bottom"]');

    const updateNavVisibility = () => {
      const isMobile = window.innerWidth <= 768;

      if (editingActivity && isMobile) {
        // Modal is open on mobile - hide navigation
        if (header) header.style.display = 'none';
        if (bottomNav) bottomNav.style.display = 'none';
      } else {
        // Modal is closed OR desktop view - show navigation
        if (header) header.style.display = '';
        if (bottomNav) bottomNav.style.display = '';
      }
    };

    updateNavVisibility();

    // Listen for window resize to update visibility
    window.addEventListener('resize', updateNavVisibility);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', updateNavVisibility);
      if (header) header.style.display = '';
      if (bottomNav) bottomNav.style.display = '';
    };
  }, [editingActivity]);

  // TanStack Query mutations for optimistic updates
  const addPhaseMutation = useAddPhaseMutation();
  const deletePhaseMutation = useDeletePhaseMutation();
  const addActivityMutation = useAddActivityMutation();
  const deleteActivityMutation = useDeleteActivityMutation();
  const updateActivityMutation = useUpdateActivityMutation();

  const findMatchingDoc = (activityName: string, docs: TravelDocument[]) => {
    const search = activityName.toLowerCase();
    return docs.find(d => 
      search.includes(d.title.toLowerCase()) || 
      search.includes(d.confirmation.toLowerCase())
    );
  };

  const saveActivity = (dayId: string, activity: Activity) => {
    // Check if this is an update or a new activity
    const isUpdate = trip.itinerary
      .find(day => day.id === dayId)
      ?.activities.some(a => a.id === activity.id);

    if (isUpdate) {
      // Update existing activity
      updateActivityMutation.mutate({
        trip,
        dayId,
        activity,
        setTripState: updateTrip,
      });
    } else {
      // Add new activity
      addActivityMutation.mutate({
        trip,
        dayId,
        activity,
        setTripState: updateTrip,
      });
    }

    setEditingActivity(null);
  };

  const requestDeleteActivity = (dayId: string, activityId: string) => {
    setDeleteConfirm({ dayId, activityId });
  };

  const confirmDeleteActivity = () => {
    if (!deleteConfirm) return;

    deleteActivityMutation.mutate({
      trip,
      dayId: deleteConfirm.dayId,
      activityId: deleteConfirm.activityId,
      setTripState: updateTrip,
    });

    setDeleteConfirm(null);
  };

  const cancelDeleteActivity = () => {
    setDeleteConfirm(null);
  };

  const addDay = () => {
    // Calculate the next date
    let nextDate: string;
    if (trip.itinerary.length === 0) {
      // If no days exist, start from trip start date
      nextDate = trip.startDate;
    } else {
      // Find the latest date and add 1 day
      const lastDay = trip.itinerary[trip.itinerary.length - 1];
      const lastDate = parseISO(lastDay.date);
      const nextDay = new Date(lastDate);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDate = format(nextDay, 'yyyy-MM-dd');
    }

    const newDay = {
      id: uuidv4(),
      date: nextDate,
      activities: []
    };

    // Use mutation for optimistic update
    addPhaseMutation.mutate({
      trip,
      dayPlan: newDay,
      setTripState: updateTrip,
    });
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-8 md:space-y-12">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className={`rounded-4xl p-6 md:p-8 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden h-52 md:h-64 ${isEditor ? 'bg-brand-secondary' : 'bg-slate-800'}`}>
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-brand-primary rounded-2xl shadow-lg"><Sparkles size={20} /></div>
              <h2 className="text-xl md:text-2xl font-display font-bold">Sequence Lab</h2>
            </div>
            <p className="text-white/60 text-sm font-medium max-w-xs">Organize your destination waypoints with tactical precision.</p>
          </div>
          {isEditor && (
            <button className="relative z-10 w-full bg-white text-brand-secondary hover:bg-slate-100 px-4 py-3 rounded-2xl font-bold text-[10px] flex items-center justify-center gap-2 transition-all shadow-xl uppercase tracking-widest">
              <Wand2 size={14} className="text-brand-primary" /> AI Designer Mode
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-4xl border border-slate-100 dark:border-slate-700 flex flex-col justify-center text-center shadow-sm">
          <div className="flex justify-center mb-3">
             <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300">
                <Target size={24} />
             </div>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Mission Parameters</p>
          <p className="text-base font-bold mt-1 text-slate-700 dark:text-slate-300">{trip.itinerary.length} Phases Active</p>
        </div>
      </section>

      <div className="space-y-12 md:space-y-20 relative pt-4">
        <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-slate-100 dark:bg-white/5 hidden md:block" />

        {/* Empty State */}
        {trip.itinerary.length === 0 && isEditor && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/20 rounded-[3rem] p-12 text-center max-w-md border-2 border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <MapPin className="w-10 h-10 text-brand-primary" />
              </div>
              <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-3">
                No Phases Defined
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed">
                Start building your tactical itinerary by adding your first phase. Each phase represents a day in your journey.
              </p>
              <button
                onClick={addDay}
                className="px-8 py-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl flex items-center gap-3 mx-auto"
              >
                <Plus size={20} />
                Add First Phase
              </button>
            </div>
          </div>
        )}

        {trip.itinerary.map((day, dayIdx) => (
          <div key={day.id} className="relative">
            <div className="sticky top-24 z-20 flex justify-center mb-10 md:mb-16">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 px-6 py-3 md:px-8 md:py-4 rounded-full font-display font-black text-sm md:text-lg shadow-2xl flex items-center gap-4 md:gap-6 text-slate-900 dark:text-white">
                <span className="text-[8px] px-2 py-0.5 bg-brand-primary text-white rounded-lg uppercase tracking-widest font-black">PHASE {dayIdx + 1}</span>
                <span>{format(parseISO(day.date), 'EEE, MMM dd')}</span>
                {isEditor && (
                  <button onClick={() => setEditingActivity({ dayId: day.id, activity: { id: uuidv4(), type: 'Attraction', name: '', startTime: '09:00', endTime: '10:00', location: '', notes: '', cost: 0, iconName: 'Landmark' } })} className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-brand-primary text-white flex items-center justify-center hover:rotate-90 transition-all shadow-lg">
                    <Plus size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-8 md:space-y-12">
              {day.activities.map((act, idx) => {
                const isEven = idx % 2 === 0;
                const meta = ACTIVITY_META[act.type];
                const matchingDoc = findMatchingDoc(act.name, trip.documents);

                return (
                  <div key={act.id} className={`flex flex-col md:flex-row gap-4 md:gap-8 items-center ${isEven ? 'md:flex-row-reverse' : ''} group`}>
                    <div className="hidden md:block w-1/2" />
                    <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 z-10 hidden md:block group-hover:bg-brand-primary transition-colors duration-500" />
                    <div className="w-full md:w-1/2 px-2">
                      <div className="bg-white dark:bg-slate-800 rounded-[2rem] md:rounded-[2.5rem] p-0 shadow-sm border border-slate-200/60 dark:border-white/5 hover:shadow-2xl transition-all duration-500 relative overflow-hidden boarding-pass-notch">
                        <div className="flex min-h-28 md:min-h-36">
                          <div className={`${meta.color} w-20 md:w-28 flex flex-col items-center justify-center text-white relative`}>
                            <div className="p-2 md:p-3 bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl mb-1 md:mb-2">
                              <ActivityIcon name={act.iconName || meta.defaultIcon} className="w-4 h-4 md:w-6 md:h-6" />
                            </div>
                            <p className="text-xs md:text-base font-black tracking-tight">{act.startTime}</p>
                          </div>

                          <div className="flex-1 p-4 md:p-6 flex flex-col justify-between">
                            <div className="space-y-0.5 md:space-y-1">
                              <div className="flex justify-between items-start">
                                <h4 className="font-display font-bold text-sm md:text-lg text-slate-900 dark:text-white leading-tight">{act.name}</h4>
                                {matchingDoc && <span className="p-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg"><CheckCircle2 size={10} /></span>}
                              </div>
                              <div className="flex items-center gap-1.5 md:gap-2 text-slate-400">
                                <MapPin size={10} className="text-brand-primary" />
                                <p className="text-[9px] md:text-[10px] font-bold truncate">{act.location || 'Sector TBD'}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 md:mt-4 md:pt-4 border-t border-slate-100 dark:border-white/5">
                              <p className="text-[9px] md:text-[10px] text-slate-400 font-medium italic line-clamp-1">{act.notes || 'No briefing notes.'}</p>
                              {isEditor && (
                                <div className="flex gap-1">
                                  <button onClick={() => setEditingActivity({ dayId: day.id, activity: act })} className="p-1.5 text-slate-300 hover:text-brand-primary transition-colors"><Edit3 size={14} /></button>
                                  <button onClick={() => requestDeleteActivity(day.id, act.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Add Phase Button (after existing days) */}
        {trip.itinerary.length > 0 && isEditor && (
          <div className="flex justify-center pt-8">
            <button
              onClick={addDay}
              className="group px-8 py-5 bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-secondary hover:to-brand-primary text-white font-bold rounded-[2rem] transition-all shadow-xl hover:shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95"
            >
              <div className="p-2 bg-white/20 rounded-xl group-hover:rotate-90 transition-transform duration-300">
                <Plus size={20} />
              </div>
              <span className="text-sm uppercase tracking-widest">Add Next Phase</span>
            </button>
          </div>
        )}
      </div>

      {editingActivity && (
        <div
          className="fixed inset-0 z-[1002] bg-[#0a0e1a] backdrop-blur-3xl overflow-hidden md:flex md:items-center md:justify-center"
          style={{
            minHeight: '100vh',
            minHeight: '-webkit-fill-available'
          }}
        >
          <div
            className="absolute inset-0 md:relative bg-white dark:bg-[#161b28] w-full md:max-w-lg shadow-3xl overflow-hidden animate-in zoom-in duration-300 flex flex-col md:h-auto md:rounded-[2.5rem] md:m-4 md:max-h-[90vh] md:border md:border-slate-200 md:dark:border-[#1e2533]/30"
            style={{
              transform: isMobile ? `translateY(${translateY}px)` : undefined,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Drag Handle (Mobile Only) */}
            {isMobile && (
              <div className="md:hidden flex justify-center pt-3 pb-2 bg-white dark:bg-[#161b28]">
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
              </div>
            )}

            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-[#161b28] flex-shrink-0">
              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">Activity Config</h3>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-brand-primary">Refining Objective Parameters</p>
              </div>
              <button
                onClick={() => setEditingActivity(null)}
                className="w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all text-slate-400 flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 sm:p-8 space-y-8 overflow-y-auto no-scrollbar flex-1">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Objective Signature (Icon)</label>
                <div className="grid grid-cols-7 gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-white/5">
                  {TACTICAL_ICONS.map(item => {
                    const Icon = item.icon;
                    const isSelected = editingActivity.activity?.iconName === item.name;
                    return (
                      <button
                        key={item.name}
                        onClick={() => setEditingActivity(p => p ? ({ ...p, activity: { ...p.activity!, iconName: item.name } }) : null)}
                        className={`aspect-square rounded-xl flex items-center justify-center transition-all active:scale-90 ${isSelected ? 'bg-brand-primary text-white shadow-md scale-105 z-10' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                      >
                        <Icon size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asset Designation</label>
                <input
                  value={editingActivity.activity?.name}
                  onChange={(e) => setEditingActivity(p => p ? ({ ...p, activity: { ...p.activity!, name: e.target.value } }) : null)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl font-medium outline-none border-2 border-transparent focus:border-brand-primary/20 dark:text-white text-sm shadow-sm"
                  placeholder="e.g., Shibuya Sky"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 text-xs">Departure</label>
                  <input
                    type="time"
                    value={editingActivity.activity?.startTime}
                    onChange={(e) => setEditingActivity(p => p ? ({ ...p, activity: { ...p.activity!, startTime: e.target.value } }) : null)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl outline-none font-medium dark:text-white text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 text-xs">Arrival</label>
                  <input
                    type="time"
                    value={editingActivity.activity?.endTime}
                    onChange={(e) => setEditingActivity(p => p ? ({ ...p, activity: { ...p.activity!, endTime: e.target.value } }) : null)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl outline-none font-medium dark:text-white text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Geographic Sector</label>
                <input
                  value={editingActivity.activity?.location}
                  onChange={(e) => setEditingActivity(p => p ? ({ ...p, activity: { ...p.activity!, location: e.target.value } }) : null)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl font-medium outline-none dark:text-white text-sm shadow-sm"
                  placeholder="City or Coordinates"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Briefing Notes</label>
                <textarea
                  value={editingActivity.activity?.notes}
                  onChange={(e) => setEditingActivity(p => p ? ({ ...p, activity: { ...p.activity!, notes: e.target.value } }) : null)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl font-medium outline-none dark:text-white h-24 text-sm resize-none shadow-sm"
                  placeholder="Key sub-objectives or arrival details..."
                />
              </div>
            </div>
            <div className="px-6 py-4 sm:px-8 sm:py-6 bg-white dark:bg-[#161b28] border-t border-slate-100 dark:border-slate-700 flex flex-row items-center justify-between gap-4 flex-shrink-0">
              <button
                onClick={() => setEditingActivity(null)}
                className="flex-1 px-4 py-3 font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors text-sm uppercase tracking-widest"
              >
                Abort
              </button>
              <button
                onClick={() => saveActivity(editingActivity.dayId, editingActivity.activity!)}
                className="flex-[2] px-6 py-3 font-medium bg-brand-primary text-white rounded-2xl shadow-xl hover:shadow-indigo-500/30 active:scale-95 transition-all text-sm uppercase tracking-widest"
              >
                Lock Objective
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Abort Mission Objective?"
        message="This activity will be permanently removed from your itinerary. This action cannot be undone."
        confirmText="Abort"
        cancelText="Keep It"
        onConfirm={confirmDeleteActivity}
        onCancel={cancelDeleteActivity}
        variant="danger"
      />
    </div>
  );
};

export default ItineraryTab;
