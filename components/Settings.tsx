
import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import {
  User, Globe, DollarSign, Moon, Sun, Shield,
  Database, Trash2, Download, Zap, ShieldAlert,
  ChevronRight, CheckCircle2, AlertCircle, Activity,
  Lock, Key, HardDrive, RefreshCw
} from 'lucide-react';

interface SettingsProps {
  settings: UserSettings;
  setSettings: (settings: UserSettings) => void;
  onLogout?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings, onLogout }) => {
  const [cacheSize, setCacheSize] = useState<string>('Calculating...');

  // Calculate cache size on mount
  useEffect(() => {
    const calculateCacheSize = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          const usedMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
          const quotaMB = ((estimate.quota || 0) / (1024 * 1024)).toFixed(0);
          setCacheSize(`${usedMB} MB / ${quotaMB} MB`);
        } catch (error) {
          console.error('[Settings] Error estimating storage:', error);
          setCacheSize('Unable to estimate');
        }
      } else {
        setCacheSize('Not supported');
      }
    };

    calculateCacheSize();
  }, []);

  const handleChange = (name: keyof UserSettings, value: string) => {
    setSettings({ ...settings, [name]: value });
  };

  const toggleTheme = () => {
    setSettings({ ...settings, theme: settings.theme === 'light' ? 'dark' : 'light' });
  };

  const handleClearCache = () => {
    if (confirm('CRITICAL: This will wipe all local mission data and resets. Proceed?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleClearPWACache = async () => {
    if (confirm('Clear service worker cache? This will free up space but the app may be slower on next load.')) {
      try {
        // Clear all caches
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));

        alert('Cache cleared successfully!');

        // Recalculate cache size
        const estimate = await navigator.storage.estimate();
        const usedMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
        const quotaMB = ((estimate.quota || 0) / (1024 * 1024)).toFixed(0);
        setCacheSize(`${usedMB} MB / ${quotaMB} MB`);
      } catch (error) {
        console.error('[Settings] Error clearing cache:', error);
        alert('Failed to clear cache. Please try again.');
      }
    }
  };

  const handleClearAllData = async () => {
    if (
      confirm(
        'DANGER: This will delete ALL app data including trips, settings, and cache. This cannot be undone. Are you sure?'
      )
    ) {
      try {
        // Clear IndexedDB
        const dbs = await indexedDB.databases();
        await Promise.all(dbs.map((db) => {
          if (db.name) {
            return new Promise((resolve, reject) => {
              const request = indexedDB.deleteDatabase(db.name!);
              request.onsuccess = () => resolve(undefined);
              request.onerror = () => reject(request.error);
            });
          }
          return Promise.resolve();
        }));

        // Clear localStorage
        localStorage.clear();

        // Clear caches
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));

        alert('All data cleared. The app will now reload.');
        window.location.reload();
      } catch (error) {
        console.error('[Settings] Error clearing all data:', error);
        alert('Failed to clear all data. Please try again or clear your browser data manually.');
      }
    }
  };

  const handleExport = () => {
    const data = localStorage.getItem('tripflow_trips');
    const blob = new Blob([data || '[]'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tripflow-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-[#F8FAFC] dark:bg-slate-950 transition-colors">
      <div className="p-6 md:p-12 max-w-5xl mx-auto w-full space-y-10 pb-32">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <Lock size={12} /> System Admin
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Operational <span className="text-brand-primary">Parameters</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg">Configure your personal and tactical environment.</p>
          </div>
        </header>

        {/* Profile Card */}
        <section className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-12 border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none font-black text-8xl leading-none uppercase">ID-01</div>
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="relative">
              <img src="https://i.pravatar.cc/150?u=demo" className="w-32 h-32 rounded-[2.5rem] border-4 border-white dark:border-slate-800 shadow-2xl" alt="Pilot" />
              <div className="absolute -bottom-2 -right-2 bg-brand-success text-white p-2 rounded-xl shadow-lg border-2 border-white dark:border-slate-800">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="text-center md:text-left space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-primary">Lead Planner Access</p>
              <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">{settings.name || 'Demo Traveler'}</h2>
              <p className="text-slate-500 font-medium">{settings.email || 'demo@tripflow.ai'}</p>
            </div>
            <div className="md:ml-auto flex gap-3">
               <button className="px-6 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-bold hover:bg-slate-100 transition-all border border-slate-100 dark:border-white/5">Update Photo</button>
               {onLogout && (
                 <button onClick={onLogout} className="px-6 py-3 bg-red-50 text-red-500 rounded-2xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all">Sign Out</button>
               )}
            </div>
          </div>
        </section>

        {/* Grid Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Section 1: Identity & Sector */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-100 dark:border-white/5 shadow-sm space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
              <User size={14} className="text-brand-primary" /> Phase 0: Identity
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Callsign</label>
                <input 
                  value={settings.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Operational Handle"
                  className="w-full p-5 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-brand-primary rounded-[1.5rem] font-bold outline-none transition-all dark:text-white shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Home Sector</label>
                <div className="relative">
                  <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    value={settings.homeLocation}
                    onChange={(e) => handleChange('homeLocation', e.target.value)}
                    className="w-full p-5 pl-14 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-brand-primary rounded-[1.5rem] font-bold outline-none transition-all dark:text-white shadow-inner"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Environment UI */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-100 dark:border-white/5 shadow-sm space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
              <Activity size={14} className="text-brand-primary" /> Phase 1: Environment
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Currency Protocol</label>
                <div className="relative">
                  <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full p-5 pl-14 bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-brand-primary rounded-[1.5rem] font-bold outline-none transition-all dark:text-white appearance-none shadow-inner"
                  >
                    {['USD', 'EUR', 'GBP', 'JPY', 'CAD'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Interface Mode</label>
                <button 
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-950 border-2 border-transparent hover:border-brand-primary/20 rounded-[1.5rem] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${settings.theme === 'dark' ? 'bg-indigo-900/30 text-indigo-400' : 'bg-orange-50 text-orange-600'}`}>
                      {settings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <span className="font-bold dark:text-white capitalize">{settings.theme} Theme Active</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-all relative ${settings.theme === 'dark' ? 'bg-brand-primary' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${settings.theme === 'dark' ? 'left-7' : 'left-1'}`} />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: AI Module Status */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group border border-white/5">
            <Zap className="absolute -right-6 -bottom-6 w-32 h-32 text-brand-primary opacity-5 group-hover:opacity-10 transition-opacity" />
            <div className="space-y-6 relative z-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-3">
                <Zap size={14} className="text-brand-primary" /> Intelligence Module
              </h3>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-display font-bold">Gemini Engine</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mt-1">Status: Active Service</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-brand-primary/20 flex items-center justify-center text-brand-primary">
                      <Key size={20} />
                    </div>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs font-medium text-white/50 leading-relaxed italic">
                   "AI Recon protocols are currently enabled across Itinerary and Budget sectors."
                 </div>
              </div>
            </div>
          </div>

          {/* Section 4: Maintenance Protocols */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-white/5 shadow-sm space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
              <Database size={14} className="text-brand-primary" /> Maintenance
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={handleExport}
                className="w-full p-6 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-4">
                   <Download size={20} className="text-brand-primary" />
                   <div className="text-left">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">Extraction Protocol</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Backup trip data (JSON)</p>
                   </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={handleClearCache}
                className="w-full p-6 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-3xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-4">
                   <Trash2 size={20} className="text-red-500" />
                   <div className="text-left">
                      <p className="font-bold text-red-600 dark:text-red-400 text-sm">Wipe Operations</p>
                      <p className="text-[10px] text-red-400/60 font-bold uppercase tracking-widest">Clear all local mission data</p>
                   </div>
                </div>
                <ShieldAlert size={18} className="text-red-200" />
              </button>
            </div>
          </div>

          {/* Section 5: PWA Storage & Cache */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-white/5 shadow-sm space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
              <HardDrive size={14} className="text-brand-primary" /> Storage & Cache
            </h3>

            {/* Cache Size Display */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Cache Usage</p>
                  <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{cacheSize}</p>
                </div>
                <Activity size={32} className="text-brand-primary opacity-20" />
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={handleClearPWACache}
                className="w-full p-6 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-4">
                  <RefreshCw size={20} className="text-blue-500" />
                  <div className="text-left">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Clear Cache</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Free up space, keep data
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-slate-300 group-hover:translate-x-1 transition-transform"
                />
              </button>

              <button
                onClick={handleClearAllData}
                className="w-full p-6 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-3xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-4">
                  <Trash2 size={20} className="text-red-500" />
                  <div className="text-left">
                    <p className="font-bold text-red-600 dark:text-red-400 text-sm">Clear All Data</p>
                    <p className="text-[10px] text-red-400/60 font-bold uppercase tracking-widest">
                      Delete everything (irreversible)
                    </p>
                  </div>
                </div>
                <ShieldAlert size={18} className="text-red-200" />
              </button>
            </div>
          </div>
        </div>

        {/* System Info Footer */}
        <footer className="pt-10 text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest">
            TripFlow Prototype • Build v1.4.2-Tactical
          </div>
          <div className="flex justify-center gap-8">
            <button className="text-[10px] font-black text-slate-400 hover:text-brand-primary uppercase tracking-widest transition-colors">Privacy Policy</button>
            <button className="text-[10px] font-black text-slate-400 hover:text-brand-primary uppercase tracking-widest transition-colors">Operational Terms</button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Settings;
