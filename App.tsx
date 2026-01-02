
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Trip, UserSettings, User } from './types';
import { INITIAL_TRIPS } from './data';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TripForm from './components/TripForm';
import TripDetail from './components/TripDetail';
import Settings from './components/Settings';
import MobileNav from './components/MobileNav';
import TripMobileNav from './components/TripMobileNav';
import AuthModal from './components/AuthModal';
import AuthCallback from './components/AuthCallback';
import { Compass, Loader2 } from 'lucide-react';
import { storage } from './src/services/StorageManager';
import { usePWA } from './src/hooks/usePWA';
import { syncService } from './src/services/SyncService';
import type { SyncStatus } from './src/services/SyncService';
import UpdateBanner from './components/UpdateBanner';
import InstallPrompt from './components/InstallPrompt';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useSupabaseTrips } from './hooks/useSupabaseTrips';
import { useSupabaseSettings } from './hooks/useSupabaseSettings';
import { isSupabaseReady } from './src/lib/supabase';
import { TerminologyProvider } from './hooks/TerminologyContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/lib/queryClient';

const AppContent: React.FC<{
  user: User | null;
  trips: Trip[];
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  isSidebarCollapsed: boolean;
  handleSidebarToggle: () => void;
  isOffline: boolean;
  hasPendingSync: boolean;
  handleLogout: () => void;
  updateTrip: (t: Trip) => void;
  setTripStateOnly: (t: Trip) => void;
  addTrip: (t: Trip) => void;
  deleteTrip: (id: string) => void;
}> = ({ user, trips, settings, setSettings, isSidebarCollapsed, handleSidebarToggle, isOffline, hasPendingSync, handleLogout, updateTrip, setTripStateOnly, addTrip, deleteTrip }) => {
  const location = useLocation();
  const isTripView = location.pathname.startsWith('/trip/');
  const currentTripId = isTripView ? location.pathname.split('/')[2] : null;

  return (
    <div className={`min-h-screen ${settings.theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-[#F8FAFC] text-slate-900'} flex overflow-hidden`}>
      <Sidebar
        trips={trips}
        className="hidden md:flex"
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggle={handleSidebarToggle}
        isOffline={isOffline}
        hasPendingSync={hasPendingSync}
        userAvatar={settings.avatar}
        userName={settings.name}
      />
      <main className="flex-1 flex flex-col relative h-screen overflow-hidden">
        <Routes>
          <Route path="/" element={<Dashboard trips={trips.filter(t => t.ownerEmail === user!.email || t.collaborators.some(c => c.email === user!.email))} settings={settings} deleteTrip={deleteTrip} />} />
          <Route path="/create" element={<TripForm onSubmit={addTrip} />} />
          <Route path="/edit/:id" element={<TripForm trips={trips} onSubmit={updateTrip} />} />
          <Route path="/trip/:id/*" element={<TripDetail trips={trips} updateTrip={setTripStateOnly} currentUser={user!} />} />
          <Route path="/settings" element={<Settings settings={settings} setSettings={setSettings} onLogout={handleLogout} />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Contextual Mobile Navigation */}
        <div className="h-24 md:hidden flex-shrink-0" />
        {isTripView && currentTripId ? (
          <TripMobileNav tripId={currentTripId} className="md:hidden" />
        ) : (
          <MobileNav className="md:hidden" />
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  // Supabase authentication
  const {
    user: supabaseUser,
    loading: authLoading,
    signOut: supabaseSignOut,
    isSupabaseConfigured
  } = useSupabaseAuth();

  // Supabase trips (only if configured and authenticated)
  const {
    trips: supabaseTrips,
    loading: tripsLoading,
    createTrip: supabaseCreateTrip,
    updateTrip: supabaseUpdateTrip,
    deleteTrip: supabaseDeleteTrip,
    setTripState: setSupabaseTripState,
    isRealtime
  } = useSupabaseTrips();

  // Sidebar state (will be synced with Supabase via settings)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Local trips state (fallback when Supabase not configured)
  const [localTrips, setLocalTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Determine which trips to use
  const trips = isSupabaseConfigured ? supabaseTrips : localTrips;
  const loading = isSupabaseConfigured ? (authLoading || tripsLoading) : isLoadingTrips;

  // Convert Supabase user to app User type (memoized to prevent infinite loops)
  const user: User | null = React.useMemo(() => {
    if (!supabaseUser) return null;
    return {
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
      avatar: supabaseUser.user_metadata?.avatar_url || `https://i.pravatar.cc/150?u=${supabaseUser.email}`
    };
  }, [supabaseUser]);

  // Settings sync with Supabase (includes Google avatar auto-import)
  const {
    settings: supabaseSettings,
    loading: settingsLoading,
    updateSettings: updateSupabaseSettings
  } = useSupabaseSettings();

  // Fallback settings for when not authenticated or loading (memoized to prevent infinite loops)
  const settings: UserSettings = React.useMemo(() => {
    return supabaseSettings || {
      name: user?.name || 'Traveler',
      email: user?.email || '',
      avatar: user?.avatar,
      homeLocation: 'San Francisco',
      currency: 'USD',
      theme: 'light',
      languageMode: 'standard'
    };
  }, [supabaseSettings, user?.name, user?.email, user?.avatar]);

  // Wrapper function for Settings component compatibility (memoized to prevent infinite loops)
  const setSettings = React.useCallback((newSettings: UserSettings) => {
    updateSupabaseSettings(newSettings);
  }, [updateSupabaseSettings]);

  // PWA state management
  const { isOffline, needRefresh, updateServiceWorker, isInstallable, installPrompt } = usePWA();

  // Sync state management
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ isSyncing: false, message: '' });

  // Listen for sync status changes
  useEffect(() => {
    const handleSyncStatus = (status: SyncStatus) => {
      setSyncStatus(status);

      // Show sync notification to user
      if (status.message && !status.isSyncing) {
        console.log('[App] Sync status:', status.message);
      }
    };

    syncService.addSyncListener(handleSyncStatus);

    return () => {
      syncService.removeSyncListener(handleSyncStatus);
    };
  }, []);

  // Listen for service worker sync messages
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { data } = event;

      if (data.type === 'SYNC_COMPLETE') {
        console.log('[App] Service worker sync complete:', data.message);
        setSyncStatus({
          isSyncing: false,
          message: data.message,
        });

        // Reload trips after successful sync
        if (data.success && data.synced > 0) {
          storage.getAllTrips().then((loadedTrips) => {
            setLocalTrips(loadedTrips);
          });
        }
      }

      if (data.type === 'SYNC_ERROR') {
        console.error('[App] Service worker sync error:', data.error);
        setSyncStatus({
          isSyncing: false,
          message: `Sync failed: ${data.error}`,
        });
      }
    };

    // Add message listener if service worker is supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // Load trips from IndexedDB on mount (settings now come from Supabase)
  useEffect(() => {
    const loadData = async () => {
      try {
        // Run migration from localStorage to IndexedDB
        await storage.migrateFromLocalStorage();

        // Load trips (if not using Supabase)
        if (!isSupabaseConfigured) {
          const loadedTrips = await storage.getAllTrips();
          if (loadedTrips.length > 0) {
            setLocalTrips(loadedTrips);
          }
        }

        setIsLoadingTrips(false);
      } catch (error) {
        console.error('[App] Error loading data:', error);
        setIsLoadingTrips(false);
      }
    };

    loadData();
  }, [isSupabaseConfigured]);

  // Save trips to IndexedDB when they change (only in local storage mode)
  useEffect(() => {
    // Only persist to IndexedDB when NOT using Supabase
    if (!isLoadingTrips && !isSupabaseConfigured) {
      trips.forEach((trip) => {
        storage.saveTrip(trip).catch((error) => {
          console.error('[App] Error saving trip:', error);
        });
      });
    }
  }, [trips, isLoadingTrips, isSupabaseConfigured]);

  // Sync sidebar state FROM settings (when settings load or change)
  useEffect(() => {
    if (settings.sidebarCollapsed !== undefined) {
      setIsSidebarCollapsed(settings.sidebarCollapsed);
    }
  }, [settings.sidebarCollapsed]);

  // Sync sidebar state TO Supabase (when user toggles)
  const handleSidebarToggle = React.useCallback(() => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    // Update in Supabase - use direct update to avoid dependency on full settings object
    updateSupabaseSettings({ sidebarCollapsed: newState });
  }, [isSidebarCollapsed, updateSupabaseSettings]);

  // Apply theme from settings (settings are now synced with Supabase)
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Keep user in localStorage for backward compatibility
  useEffect(() => {
    if (user) {
      localStorage.setItem('tripflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('tripflow_user');
    }
  }, [user]);

  // Note: User settings (name, email, avatar, theme) now come from Supabase profiles table
  // and are automatically synced via useSupabaseSettings hook

  // CRUD operations - use Supabase if configured, otherwise local storage
  // Note: When Supabase is configured, the useSupabaseTrips hook handles optimistic updates internally
  const addTrip = async (newTrip: Trip) => {
    const tripWithOwner = { ...newTrip, ownerEmail: user?.email || '' };

    if (isSupabaseConfigured && supabaseUser) {
      // Hook handles optimistic updates internally
      const result = await supabaseCreateTrip(tripWithOwner);
      if (!result.success) {
        console.error('Failed to create trip:', result.error);
        alert(`Failed to create trip: ${result.error}`);
      }
    } else {
      // Local storage mode: update local state and persist
      setLocalTrips(prev => [...prev, tripWithOwner]);
      await storage.saveTrip(tripWithOwner);
    }
  };

  const updateTrip = async (updatedTrip: Trip) => {
    if (isSupabaseConfigured && updatedTrip.id) {
      // Hook handles optimistic updates internally
      const result = await supabaseUpdateTrip(updatedTrip.id, updatedTrip);
      if (result && !result.success) {
        console.error('Failed to update trip:', result.error);
        alert(`Failed to update trip: ${result.error}`);
      }
    } else {
      // Local storage mode: update local state and persist
      setLocalTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
      await storage.saveTrip(updatedTrip);
    }
  };

  // State-only update for optimistic updates (no database sync)
  // Used by mutation hooks to update UI immediately
  const setTripStateOnly = (updatedTrip: Trip) => {
    if (isSupabaseConfigured) {
      setSupabaseTripState(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    } else {
      setLocalTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    }
  };

  const deleteTrip = async (id: string) => {
    if (isSupabaseConfigured) {
      // Hook handles optimistic updates internally
      const result = await supabaseDeleteTrip(id);
      if (!result.success) {
        console.error('Failed to delete trip:', result.error);
        alert(`Failed to delete trip: ${result.error}`);
      }
    } else {
      // Local storage mode: update local state and persist
      setLocalTrips(prev => prev.filter(t => t.id !== id));
      await storage.deleteTrip(id);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabaseSignOut();
    }
    // Local logout is handled by Supabase hook
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
          <p className="text-slate-600">Loading TripFlow...</p>
        </div>
      </div>
    );
  }

  // Check if we're on the auth callback route (before Router is mounted)
  // This handles OAuth redirects when user is not yet authenticated
  // Use exact matching to prevent false positives on unrelated routes
  const isAuthCallback = window.location.hash.startsWith('#/auth/callback') ||
                         window.location.pathname === '/auth/callback';

  // If on auth callback, render the callback handler directly
  // This allows OAuth flow to complete before the user check blocks it
  if (isAuthCallback && isSupabaseConfigured) {
    return <AuthCallback />;
  }

  // Show auth modal if Supabase is configured but no user
  if (isSupabaseConfigured && !user) {
    return (
      <>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center space-y-8">
            <div className="flex justify-center">
              <div className="p-4 bg-brand-primary rounded-3xl shadow-xl shadow-indigo-100">
                <Compass className="text-white" size={48} />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-display font-bold">Welcome to TripFlow</h1>
              <p className="text-slate-500">Plan your next adventure with confidence.</p>
              {isRealtime && (
                <p className="text-xs text-green-600">✓ Real-time sync enabled</p>
              )}
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-brand-secondary text-white py-4 rounded-2xl font-bold hover:bg-brand-primary transition-all shadow-xl"
            >
              Get Started
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // If Supabase not configured, show offline mode (local storage)
  if (!isSupabaseConfigured && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center space-y-8">
          <div className="flex justify-center">
            <div className="p-4 bg-brand-primary rounded-3xl shadow-xl shadow-indigo-100">
              <Compass className="text-white" size={48} />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-bold">Welcome to TripFlow</h1>
            <p className="text-slate-500">Plan your next adventure with confidence.</p>
            <p className="text-xs text-amber-600">⚠️ Offline Mode - Data stored locally</p>
          </div>
          <button
            onClick={() => {
              // Create demo user for offline mode
              // Email must match the ownerEmail in INITIAL_TRIPS (data.ts)
              const demoUser: User = {
                email: 'demo@tripflow.ai',
                name: 'Demo User',
                avatar: 'https://i.pravatar.cc/150?u=demo'
              };
              localStorage.setItem('tripflow_user', JSON.stringify(demoUser));
              window.location.reload();
            }}
            className="w-full bg-brand-secondary text-white py-4 rounded-2xl font-bold hover:bg-brand-primary transition-all shadow-xl"
          >
            Continue Offline
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* PWA Update Banner */}
      {needRefresh && <UpdateBanner onUpdate={updateServiceWorker} />}

      <TerminologyProvider languageMode={settings.languageMode}>
        <Router>
          <AppContent
            user={user}
            trips={trips}
            settings={settings}
            setSettings={setSettings}
            isSidebarCollapsed={isSidebarCollapsed}
            handleSidebarToggle={handleSidebarToggle}
            isOffline={isOffline}
            hasPendingSync={syncStatus.isSyncing}
            handleLogout={handleLogout}
            updateTrip={updateTrip}
            setTripStateOnly={setTripStateOnly}
            addTrip={addTrip}
            deleteTrip={deleteTrip}
          />
        </Router>
      </TerminologyProvider>

      {/* PWA Install Prompt */}
      {isInstallable && <InstallPrompt onInstall={installPrompt} />}
    </QueryClientProvider>
  );
};

export default App;
