
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
import { LogIn, Compass, UserPlus } from 'lucide-react';

// Added setSettings to the destructured props in AppContent to fix the compilation error
const AppContent: React.FC<{
  user: User | null;
  setUser: (user: User | null) => void;
  trips: Trip[];
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  handleLogout: () => void;
  updateTrip: (t: Trip) => void;
  addTrip: (t: Trip) => void;
  deleteTrip: (id: string) => void;
}> = ({ user, trips, settings, setSettings, isSidebarCollapsed, setIsSidebarCollapsed, handleLogout, updateTrip, addTrip, deleteTrip }) => {
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
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <main className="flex-1 flex flex-col relative h-screen overflow-hidden">
        <Routes>
          <Route path="/" element={<Dashboard trips={trips.filter(t => t.ownerEmail === user!.email || t.collaborators.some(c => c.email === user!.email))} settings={settings} deleteTrip={deleteTrip} />} />
          <Route path="/create" element={<TripForm onSubmit={addTrip} />} />
          <Route path="/edit/:id" element={<TripForm trips={trips} onSubmit={updateTrip} />} />
          <Route path="/trip/:id/*" element={<TripDetail trips={trips} updateTrip={updateTrip} currentUser={user!} />} />
          <Route path="/settings" element={<Settings settings={settings} setSettings={setSettings} onLogout={handleLogout} />} />
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
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tripflow_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('tripflow_sidebar_collapsed');
    return saved === 'true';
  });

  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('tripflow_trips');
    return saved ? JSON.parse(saved) : INITIAL_TRIPS;
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('tripflow_settings');
    return saved ? JSON.parse(saved) : {
      name: 'Traveler',
      email: '',
      homeLocation: 'San Francisco',
      currency: 'USD',
      theme: 'light'
    };
  });

  useEffect(() => {
    localStorage.setItem('tripflow_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('tripflow_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('tripflow_settings', JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('tripflow_user', JSON.stringify(user));
      setSettings(prev => ({ ...prev, name: user.name, email: user.email }));
    } else {
      localStorage.removeItem('tripflow_user');
    }
  }, [user]);

  const addTrip = (newTrip: Trip) => setTrips(prev => [...prev, { ...newTrip, ownerEmail: user?.email || '' }]);
  const updateTrip = (updatedTrip: Trip) => setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
  const deleteTrip = (id: string) => setTrips(prev => prev.filter(t => t.id !== id));

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
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
          </div>
          <div className="space-y-4 pt-4">
            <button 
              onClick={() => setUser({ email: 'demo@tripflow.ai', name: 'Demo Traveler', avatar: 'https://i.pravatar.cc/150?u=demo' })}
              className="w-full bg-brand-secondary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-brand-primary transition-all shadow-xl"
            >
              <LogIn size={20} /> Sign In to Dashboard
            </button>
            <button className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-3">
              <UserPlus size={20} /> Create New Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppContent 
        user={user} 
        setUser={setUser} 
        trips={trips} 
        setTrips={setTrips} 
        settings={settings} 
        setSettings={setSettings} 
        isSidebarCollapsed={isSidebarCollapsed} 
        setIsSidebarCollapsed={setIsSidebarCollapsed} 
        handleLogout={handleLogout}
        updateTrip={updateTrip}
        addTrip={addTrip}
        deleteTrip={deleteTrip}
      />
    </Router>
  );
};

export default App;
// Test comment
