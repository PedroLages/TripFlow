
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Trip, Collaborator, UserRole, User, ActivityLog } from '../types';
import {
  Calendar, Map as MapIcon, Heart, DollarSign, Package, FileText,
  Settings, Users, X, Bell, Radio, CloudSun, Clock, Sparkles, Edit3, Eye,
  ChevronLeft, BarChart3, Loader2, ChevronDown, Trash2
} from 'lucide-react';
// Added missing import for format from date-fns
import { format } from 'date-fns';
import { geminiService } from '../src/services/GeminiService';
import { sendInvitation, getTripInvitations, revokeInvitation, type TripInvitation } from '../src/services/invitationService';
import ItineraryTab from './tabs/ItineraryTab';
import MapTab from './tabs/MapTab';
import WishlistTab from './tabs/WishlistTab';
import BudgetTab from './tabs/BudgetTab';
import PackingTab from './tabs/PackingTab';
import DocumentsTab from './tabs/DocumentsTab';
import SettlementsTab from './tabs/SettlementsTab';
import { useTerminology } from '../hooks/TerminologyContext';

// Lazy load heavy components to reduce initial bundle size
const AnalyticsTab = lazy(() => import('./tabs/AnalyticsTab'));

interface TripDetailProps {
  trips: Trip[];
  updateTrip: (trip: Trip) => void;
  currentUser: User;
}

const TripDetail: React.FC<TripDetailProps> = ({ trips, updateTrip, currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const term = useTerminology();
  const containerRef = useRef<HTMLDivElement>(null);
  const trip = trips.find(t => t.id === id);
  
  const [showShare, setShowShare] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Editor');
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<TripInvitation[]>([]);

  const [liveWeather, setLiveWeather] = useState<{ temp: string, condition: string, time: string } | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  if (!trip) return null;

  const collaborator = trip.collaborators?.find(c => c.email === currentUser.email);
  const isOwner = trip.ownerEmail === currentUser.email;
  const currentRole: UserRole = isOwner ? 'Editor' : (collaborator?.role || 'Viewer');
  const isEditor = currentRole === 'Editor';

  // ESC key handler for modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showShare) setShowShare(false);
        if (showAlerts) setShowAlerts(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showShare, showAlerts]);

  // Load pending invitations when share modal opens
  useEffect(() => {
    const loadInvitations = async () => {
      if (showShare && trip && isEditor) {
        const result = await getTripInvitations(trip.id);
        if (result.success && result.invitations) {
          setPendingInvitations(result.invitations.filter(inv => inv.status === 'pending'));
        }
      }
    };
    loadInvitations();
  }, [showShare, trip?.id, isEditor]);

  const createActivityLog = (action: string): ActivityLog => {
    return {
      id: Math.random().toString(36).substr(2, 9),
      userEmail: currentUser.email,
      action,
      timestamp: new Date().toISOString(),
    };
  };

  const handleRemoveCollaborator = (email: string) => {
    const updatedCollaborators = trip.collaborators?.filter(c => c.email !== email) || [];
    const log = createActivityLog(`Removed ${email} from crew`);
    updateTrip({
      ...trip,
      collaborators: updatedCollaborators,
      activityLogs: [log, ...(trip.activityLogs || [])]
    });
  };

  const handleChangeRole = (email: string, newRole: UserRole) => {
    const updatedCollaborators = trip.collaborators?.map(c =>
      c.email === email ? { ...c, role: newRole } : c
    ) || [];
    const log = createActivityLog(`Changed ${email}'s role to ${newRole}`);
    updateTrip({
      ...trip,
      collaborators: updatedCollaborators,
      activityLogs: [log, ...(trip.activityLogs || [])]
    });
  };

  const handleLeaveTrip = () => {
    const updatedCollaborators = trip.collaborators?.filter(c => c.email !== currentUser.email) || [];
    const log = createActivityLog(`${currentUser.email} left the trip`);
    updateTrip({
      ...trip,
      collaborators: updatedCollaborators,
      activityLogs: [log, ...(trip.activityLogs || [])]
    });
    setShowShare(false);
    navigate('/');
  };

  const fetchLiveInfo = async () => {
    setIsFetchingWeather(true);
    try {
      const response = await geminiService.generateText({
        prompt: `What is the current weather (temperature in C and condition) and current local time in ${trip.destinations[0]}?`,
        model: 'gemini-2.0-flash-exp',
        config: {
          tools: [{ google_search: {} }],  // Fixed: snake_case per official Gemini API docs
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              temp: { type: 'string' },
              condition: { type: 'string' },
              time: { type: 'string' }
            },
            required: ['temp', 'condition', 'time']
          }
        }
      });
      setLiveWeather(JSON.parse(response));
    } catch (e) {
      console.warn("Weather fetch failed (Quota or API error). Falling back to operational defaults.");
      setLiveWeather({
        temp: "22°C",
        condition: "Standard Climate",
        // format is now correctly imported
        time: format(new Date(), 'HH:mm')
      });
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
    { name: term.itinerary, path: 'itinerary', icon: <Calendar size={18} /> },
    { name: term.map, path: 'map', icon: <MapIcon size={18} /> },
    { name: term.wishlist, path: 'places', icon: <Heart size={18} /> },
    { name: term.budget, path: 'budget', icon: <DollarSign size={18} /> },
    { name: 'Analytics', path: 'analytics', icon: <BarChart3 size={18} /> },
    { name: 'Settlements', path: 'settlements', icon: <Users size={18} /> },
    { name: term.packing, path: 'packing', icon: <Package size={18} /> },
    { name: term.documents, path: 'docs', icon: <FileText size={18} /> },
  ];

  const packingProgress = trip.packingList.length > 0 ? (trip.packingList.filter(i => i.isPacked).length / trip.packingList.length) * 100 : 0;
  const budgetSpent = trip.budget > 0 ? (trip.expenses.reduce((sum, e) => sum + e.amount, 0) / trip.budget) * 100 : 0;
  const readiness = Math.round((packingProgress + (100 - Math.min(100, budgetSpent)) + (trip.documents.length > 0 ? 100 : 0)) / 3);

  // Parallax calculations
  const heroHeight = window.innerWidth < 768 ? 380 : 500;
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

      {/* 2. Primary Navbar */}
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
          <button 
            onClick={() => navigate('/')} 
            className="md:hidden w-10 h-10 flex items-center justify-center text-white bg-white/10 backdrop-blur-md rounded-xl border border-white/20 mr-2"
            style={{ color: scrollY > 50 ? 'inherit' : 'white' }}
          >
            <ChevronLeft size={20} />
          </button>

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
                  <div className="flex items-center gap-2 text-brand-accent"><CloudSun size={14} /> {liveWeather.temp}</div>
                  <div className="flex items-center gap-2"><Clock size={14} /> {liveWeather.time}</div>
                </div>
              )}
            </div>
            <h1 className="text-3xl md:text-7xl font-display font-bold tracking-tight drop-shadow-2xl max-w-3xl leading-tight">{trip.name}</h1>
            <div className="flex items-center gap-6 text-white/70 font-bold overflow-x-auto no-scrollbar whitespace-nowrap">
              <div className="flex items-center gap-2 flex-shrink-0"><MapIcon size={18} className="text-brand-primary" /> {trip.destinations.join(' → ')}</div>
              <div className="flex items-center gap-2 flex-shrink-0"><Calendar size={18} /> {trip.startDate}</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 md:p-10 min-w-[280px] shadow-2xl text-white hidden sm:block">
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
      <div className="relative z-10 min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-32">
        <Routes>
          <Route path="itinerary" element={<ItineraryTab trip={{...trip, currentUserRole: currentRole}} updateTrip={(t) => {
            const log = createActivityLog("Updated itinerary");
            updateTrip({ ...t, activityLogs: [log, ...(t.activityLogs || [])] });
          }} />} />
          <Route path="map" element={<MapTab trip={trip} />} />
          <Route path="places" element={<WishlistTab trip={trip} updateTrip={(t) => {
            const log = createActivityLog("Updated wishlist");
            updateTrip({ ...t, activityLogs: [log, ...(t.activityLogs || [])] });
          }} />} />
          <Route path="budget" element={<BudgetTab trip={{...trip, currentUserRole: currentRole}} updateTrip={(t) => {
            const log = createActivityLog("Modified expenses");
            updateTrip({ ...t, activityLogs: [log, ...(t.activityLogs || [])] });
          }} />} />
          <Route path="analytics" element={
            <Suspense fallback={
              <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
              </div>
            }>
              <AnalyticsTab trip={trip} />
            </Suspense>
          } />
          <Route path="settlements" element={<SettlementsTab trip={trip} updateTrip={(t) => {
            const log = createActivityLog("Managed settlements");
            updateTrip({ ...t, activityLogs: [log, ...(t.activityLogs || [])] });
          }} currentUserEmail={currentUser.email} />} />
          <Route path="packing" element={<PackingTab trip={{...trip, currentUserRole: currentRole}} updateTrip={(t) => {
            const log = createActivityLog("Updated packing list");
            updateTrip({ ...t, activityLogs: [log, ...(t.activityLogs || [])] });
          }} />} />
          <Route path="docs" element={<DocumentsTab trip={{...trip, currentUserRole: currentRole}} updateTrip={(t) => {
            const log = createActivityLog("Modified documents");
            updateTrip({ ...t, activityLogs: [log, ...(t.activityLogs || [])] });
          }} />} />
          <Route path="*" element={<div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest italic opacity-50">Mapping your coordinates...</div>} />
        </Routes>
      </div>

      {/* Global Overlays */}
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-3xl overflow-hidden">
          <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[2.5rem] sm:rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300 border border-white/5 flex flex-col max-h-[90vh]">
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 flex-shrink-0">
              <div>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">Crew Hub</h3>
              </div>
              <button onClick={() => setShowShare(false)} className="w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all text-slate-400 flex-shrink-0"><X size={20} /></button>
            </div>

            <div className="p-6 sm:p-8 space-y-8 overflow-y-auto no-scrollbar">
              {isOwner && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Send Invite</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="explorer@tripflow.ai"
                      className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none dark:text-white border-2 border-transparent focus:border-brand-primary/20 transition-all text-sm font-medium min-w-0"
                    />
                    <div className="flex gap-2">
                      <div className="relative flex-1 sm:flex-initial">
                        <button
                          onClick={() => setShowRoleSelector(!showRoleSelector)}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl font-medium text-sm text-slate-700 dark:text-white border-2 border-transparent hover:border-brand-primary/20 transition-all whitespace-nowrap"
                        >
                          {inviteRole === 'Editor' ? <Edit3 size={14} className="text-brand-primary" /> : <Eye size={14} className="text-slate-400" />}
                          {inviteRole}
                          <ChevronDown size={14} className="text-slate-400" />
                        </button>
                        {showRoleSelector && (
                          <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 min-w-[140px]">
                            <button
                              onClick={() => { setInviteRole('Editor'); setShowRoleSelector(false); }}
                              className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-left"
                            >
                              <Edit3 size={14} className="text-brand-primary" />
                              <span className="text-sm font-medium text-slate-900 dark:text-white">Editor</span>
                            </button>
                            <button
                              onClick={() => { setInviteRole('Viewer'); setShowRoleSelector(false); }}
                              className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-left"
                            >
                              <Eye size={14} className="text-slate-400" />
                              <span className="text-sm font-medium text-slate-900 dark:text-white">Viewer</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          if (!inviteEmail.trim()) return;

                          setIsSendingInvite(true);
                          setInviteError(null);
                          setInviteSuccess(null);

                          const result = await sendInvitation({
                            tripId: trip.id,
                            inviteeEmail: inviteEmail.trim(),
                            role: inviteRole
                          });

                          setIsSendingInvite(false);

                          if (result.success) {
                            setInviteSuccess(`Invitation sent to ${inviteEmail}!`);
                            setInviteEmail('');
                            // Reload pending invitations
                            const invitations = await getTripInvitations(trip.id);
                            if (invitations.success && invitations.invitations) {
                              setPendingInvitations(invitations.invitations.filter(inv => inv.status === 'pending'));
                            }
                            // Clear success message after 3 seconds
                            setTimeout(() => setInviteSuccess(null), 3000);
                          } else {
                            setInviteError(result.error || 'Failed to send invitation');
                          }
                        }}
                        disabled={isSendingInvite || !inviteEmail.trim()}
                        className="bg-brand-primary text-white px-6 py-3 rounded-2xl font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all whitespace-nowrap flex-1 sm:flex-initial disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                      >
                        {isSendingInvite ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Invite'
                        )}
                      </button>
                    </div>

                    {/* Success/Error Messages */}
                    {inviteSuccess && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm font-medium flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        {inviteSuccess}
                      </div>
                    )}
                    {inviteError && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium">
                        {inviteError}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pending Invitations */}
              {isEditor && pendingInvitations.length > 0 && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Pending Invitations</label>
                  <div className="space-y-2">
                    {pendingInvitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold text-base shadow-md">
                            {invitation.invitee_email[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{invitation.invitee_email}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Clock size={11} className="text-amber-500 flex-shrink-0" />
                              <p className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-[0.15em]">
                                Invited as {invitation.role} • Pending
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            const result = await revokeInvitation(invitation.id);
                            if (result.success) {
                              // Reload invitations
                              const invitations = await getTripInvitations(trip.id);
                              if (invitations.success && invitations.invitations) {
                                setPendingInvitations(invitations.invitations.filter(inv => inv.status === 'pending'));
                              }
                            }
                          }}
                          title="Revoke invitation"
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-all flex-shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Active Crew</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold text-base shadow-md">{trip.ownerEmail?.[0]?.toUpperCase() || 'U'}</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{trip.ownerEmail}</p>
                        <p className="text-[9px] text-brand-primary font-bold uppercase tracking-[0.15em] mt-0.5">Lead Planner</p>
                      </div>
                    </div>
                  </div>
                  {trip.collaborators?.map((col, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img src={col.avatar} className="w-10 h-10 rounded-xl object-cover shadow-md border-2 border-white dark:border-slate-800 group-hover:scale-105 transition-transform flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{col.email}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {col.role === 'Editor' ? <Edit3 size={11} className="text-brand-primary flex-shrink-0" /> : <Eye size={11} className="text-slate-400 flex-shrink-0" />}
                            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-[0.15em]">{col.role}</p>
                          </div>
                        </div>
                      </div>
                      {isOwner && (
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <button
                            onClick={() => {
                              const newRole = col.role === 'Editor' ? 'Viewer' : 'Editor';
                              handleChangeRole(col.email, newRole);
                            }}
                            title={col.role === 'Editor' ? 'Demote to Viewer (view-only access)' : 'Promote to Editor (can edit trip)'}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                          >
                            {col.role === 'Editor' ? 'Demote' : 'Promote'}
                          </button>
                          <button
                            onClick={() => handleRemoveCollaborator(col.email)}
                            title="Remove from trip"
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-all flex-shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {!isOwner && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={handleLeaveTrip}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 rounded-2xl font-medium text-sm transition-all border-2 border-red-100 dark:border-red-900/50"
                  >
                    <X size={16} />
                    Leave Trip
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetail;
