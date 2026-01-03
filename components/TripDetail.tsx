
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Trip, Collaborator, UserRole, User, ActivityLog } from '../types';
import {
  Calendar, Map as MapIcon, Heart, DollarSign, Package, FileText,
  Settings, Users, X, Bell, Radio, CloudSun, Clock, Sparkles, Edit3, Eye,
  ChevronLeft, BarChart3, Loader2, ChevronDown, Trash2, UserPlus, Crown,
  Copy, Check, Link2
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const [liveWeather, setLiveWeather] = useState<{ temp: string, condition: string, time: string } | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  if (!trip) return null;

  const collaborator = trip.collaborators?.find(c => c.email === currentUser.email);
  const isOwner = trip.ownerEmail === currentUser.email;
  const currentRole: UserRole = isOwner ? 'Editor' : (collaborator?.role || 'Viewer');
  const isEditor = currentRole === 'Editor';

  // Calculate total crew count (owner + collaborators)
  const totalCrewCount = 1 + (trip.collaborators?.length || 0);
  const activeMembersCount = totalCrewCount;
  const pendingCount = pendingInvitations.length;

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
    // Show confirmation state
    setRemovingMemberId(email);

    // Delay for animation
    setTimeout(() => {
      const updatedCollaborators = trip.collaborators?.filter(c => c.email !== email) || [];
      const log = createActivityLog(`Removed ${email} from crew`);
      updateTrip({
        ...trip,
        collaborators: updatedCollaborators,
        activityLogs: [log, ...(trip.activityLogs || [])]
      });
      setRemovingMemberId(null);
    }, 300);
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

  const handleCopyInviteLink = () => {
    // In a real app, this would be a shareable link
    const inviteLink = `${window.location.origin}/trip/${trip.id}/join`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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

  // Role badge component
  const RoleBadge = ({ role, isOwner: owner }: { role: UserRole, isOwner?: boolean }) => {
    if (owner) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-lg">
          <Crown size={11} className="text-amber-500" />
          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-[0.15em]">Owner</span>
        </div>
      );
    }

    if (role === 'Editor') {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
          <Edit3 size={11} className="text-brand-primary" />
          <span className="text-[9px] text-brand-primary font-bold uppercase tracking-[0.15em]">Editor</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
        <Eye size={11} className="text-slate-400" />
        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.15em]">Viewer</span>
      </div>
    );
  };

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
              className="bg-brand-primary text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all group relative"
            >
              <Users size={16} />
              <span className="hidden sm:inline">Crew</span>
              {totalCrewCount > 1 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white dark:bg-slate-800 text-brand-primary rounded-full text-[10px] font-black flex items-center justify-center border-2 border-indigo-500 shadow-lg">
                  {totalCrewCount}
                </span>
              )}
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
            <button onClick={() => setShowAlerts(false)} aria-label="Close live intel panel" className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
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

      {/* Crew Hub Modal - Redesigned */}
      {showShare && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-3xl overflow-hidden">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[2.5rem] sm:rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300 border border-white/5 flex flex-col max-h-[90vh]">

            {/* Modal Header with Stats */}
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">Crew Hub</h3>
                    <div className="flex items-center gap-2">
                      {/* Member count badges */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <Users size={14} className="text-brand-primary" />
                        <span className="text-xs font-bold text-slate-700 dark:text-white">{activeMembersCount}</span>
                      </div>
                      {pendingCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-800">
                          <Clock size={14} className="text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{pendingCount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Avatar Stack Preview */}
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {/* Owner avatar */}
                      <div className="relative group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white font-bold text-xs shadow-lg border-2 border-white dark:border-slate-800 ring-2 ring-amber-500/20">
                          {trip.ownerEmail?.[0]?.toUpperCase() || 'O'}
                        </div>
                        <Crown size={10} className="absolute -top-1 -right-1 text-amber-500 drop-shadow-lg" />
                      </div>

                      {/* Collaborator avatars (max 4) */}
                      {trip.collaborators?.slice(0, 4).map((col, idx) => (
                        <div key={idx} className="w-8 h-8 rounded-lg overflow-hidden shadow-lg border-2 border-white dark:border-slate-800">
                          <img src={col.avatar} className="w-full h-full object-cover" alt={col.email} />
                        </div>
                      ))}

                      {/* +N more indicator */}
                      {(trip.collaborators?.length || 0) > 4 && (
                        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-300 shadow-lg border-2 border-white dark:border-slate-800">
                          +{(trip.collaborators?.length || 0) - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">
                      {trip.name} crew
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowShare(false)}
                  aria-label="Close crew hub modal"
                  className="w-10 h-10 hover:bg-white dark:hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all text-slate-400 hover:text-slate-600 dark:hover:text-white flex-shrink-0 border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto no-scrollbar">

              {/* Invite Section (Owner/Editor only) */}
              {isEditor && (
                <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <UserPlus size={16} className="text-white" />
                      </div>
                      <label className="text-sm font-bold text-slate-900 dark:text-white">Invite New Member</label>
                    </div>

                    {/* Quick copy link button */}
                    <button
                      onClick={handleCopyInviteLink}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
                    >
                      {copiedLink ? (
                        <>
                          <Check size={12} className="text-green-500" />
                          <span className="text-green-600 dark:text-green-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Link2 size={12} />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="explorer@tripflow.ai"
                      className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 rounded-xl outline-none dark:text-white border-2 border-slate-200 dark:border-slate-700 focus:border-brand-primary/50 transition-all text-sm font-medium min-w-0 placeholder:text-slate-400"
                    />

                    <div className="flex gap-2">
                      {/* Role Selector */}
                      <div className="relative flex-1 sm:flex-initial">
                        <button
                          onClick={() => setShowRoleSelector(!showRoleSelector)}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 rounded-xl font-medium text-sm text-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:border-brand-primary/30 transition-all whitespace-nowrap"
                        >
                          {inviteRole === 'Editor' ? (
                            <>
                              <Edit3 size={14} className="text-brand-primary" />
                              <span>Editor</span>
                            </>
                          ) : (
                            <>
                              <Eye size={14} className="text-slate-400" />
                              <span>Viewer</span>
                            </>
                          )}
                          <ChevronDown size={14} className="text-slate-400" />
                        </button>

                        {showRoleSelector && (
                          <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 min-w-[160px]">
                            <button
                              onClick={() => { setInviteRole('Editor'); setShowRoleSelector(false); }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all text-left group"
                            >
                              <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Edit3 size={12} className="text-brand-primary" />
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white block">Editor</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">Can modify trip</span>
                              </div>
                            </button>
                            <button
                              onClick={() => { setInviteRole('Viewer'); setShowRoleSelector(false); }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-left group"
                            >
                              <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Eye size={12} className="text-slate-400" />
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-slate-900 dark:text-white block">Viewer</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">View-only access</span>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Send Button */}
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
                            const invitations = await getTripInvitations(trip.id);
                            if (invitations.success && invitations.invitations) {
                              setPendingInvitations(invitations.invitations.filter(inv => inv.status === 'pending'));
                            }
                            setTimeout(() => setInviteSuccess(null), 3000);
                          } else {
                            setInviteError(result.error || 'Failed to send invitation');
                          }
                        }}
                        disabled={isSendingInvite || !inviteEmail.trim()}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all whitespace-nowrap flex-1 sm:flex-initial disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                      >
                        {isSendingInvite ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            Invite
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Success/Error Messages */}
                  {inviteSuccess && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={12} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-700 dark:text-green-400">{inviteSuccess}</p>
                        <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">They'll receive an email with access details</p>
                      </div>
                    </div>
                  )}
                  {inviteError && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium">
                      {inviteError}
                    </div>
                  )}
                </div>
              )}

              {/* Pending Invitations */}
              {isEditor && pendingInvitations.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-amber-500" />
                    <label className="text-sm font-bold text-slate-900 dark:text-white">Pending Invitations</label>
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-black">
                      {pendingInvitations.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {pendingInvitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="group flex items-center justify-between p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 hover:border-amber-200 dark:hover:border-amber-800 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md relative">
                            {invitation.invitee_email[0]?.toUpperCase() || '?'}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center border-2 border-amber-50 dark:border-amber-950">
                              <Clock size={8} className="text-amber-600" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{invitation.invitee_email}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <RoleBadge role={invitation.role} />
                              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                                Awaiting Response
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            const result = await revokeInvitation(invitation.id);
                            if (result.success) {
                              const invitations = await getTripInvitations(trip.id);
                              if (invitations.success && invitations.invitations) {
                                setPendingInvitations(invitations.invitations.filter(inv => inv.status === 'pending'));
                              }
                            }
                          }}
                          aria-label={`Revoke invitation for ${invitation.invitee_email}`}
                          title="Revoke invitation"
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Crew Members */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-brand-primary" />
                  <label className="text-sm font-bold text-slate-900 dark:text-white">Active Members</label>
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-brand-primary rounded-full text-[10px] font-black">
                    {activeMembersCount}
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Owner */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {trip.ownerEmail?.[0]?.toUpperCase() || 'O'}
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-md">
                          <Crown size={10} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{trip.ownerEmail}</p>
                          {trip.ownerEmail === currentUser.email && (
                            <span className="px-2 py-0.5 bg-brand-primary text-white rounded-md text-[9px] font-black uppercase tracking-wider">
                              You
                            </span>
                          )}
                        </div>
                        <RoleBadge role="Editor" isOwner />
                      </div>
                    </div>
                  </div>

                  {/* Collaborators */}
                  {trip.collaborators?.length === 0 ? (
                    <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center mb-3">
                        <Users size={20} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">No crew members yet</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {isEditor ? 'Invite teammates to start collaborating' : 'Ask the trip owner to invite you'}
                      </p>
                    </div>
                  ) : (
                    trip.collaborators?.map((col, idx) => (
                      <div
                        key={idx}
                        className={`group flex items-center justify-between p-4 rounded-xl transition-all border ${
                          removingMemberId === col.email
                            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 opacity-50 scale-95'
                            : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={col.avatar}
                            className="w-12 h-12 rounded-xl object-cover shadow-md border-2 border-white dark:border-slate-800 group-hover:scale-105 transition-transform flex-shrink-0"
                            alt={col.email}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{col.email}</p>
                              {col.email === currentUser.email && (
                                <span className="px-2 py-0.5 bg-brand-primary text-white rounded-md text-[9px] font-black uppercase tracking-wider">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <RoleBadge role={col.role} />
                            </div>
                          </div>
                        </div>

                        {isOwner && (
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                const newRole = col.role === 'Editor' ? 'Viewer' : 'Editor';
                                handleChangeRole(col.email, newRole);
                              }}
                              title={col.role === 'Editor' ? 'Change to Viewer (view-only)' : 'Promote to Editor (can edit)'}
                              className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-brand-primary rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5"
                            >
                              {col.role === 'Editor' ? (
                                <>
                                  <Eye size={12} />
                                  Viewer
                                </>
                              ) : (
                                <>
                                  <Edit3 size={12} />
                                  Editor
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleRemoveCollaborator(col.email)}
                              title="Remove from trip"
                              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-all flex-shrink-0"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Leave Trip (Non-owners) */}
              {!isOwner && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={handleLeaveTrip}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl font-semibold text-sm transition-all border-2 border-red-100 dark:border-red-900/50 hover:border-red-200 dark:hover:border-red-800"
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
