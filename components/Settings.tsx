
import React from 'react';
import { UserSettings } from '../types';
import { User, Globe, DollarSign, Moon, Sun, Shield } from 'lucide-react';

interface SettingsProps {
  settings: UserSettings;
  setSettings: (settings: UserSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings }) => {
  const handleChange = (name: keyof UserSettings, value: string) => {
    setSettings({ ...settings, [name]: value });
  };

  const toggleTheme = () => {
    setSettings({ ...settings, theme: settings.theme === 'light' ? 'dark' : 'light' });
  };

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-10">App Settings</h2>

      <section className="space-y-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-sky-50 dark:bg-sky-900/30 rounded-2xl text-sky-500">
              <User size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Profile Information</h3>
              <p className="text-xs text-slate-400 uppercase font-black tracking-widest">General details</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Display Name</label>
            <input 
              value={settings.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-transparent focus:border-sky-500 rounded-2xl outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Home Location</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  value={settings.homeLocation}
                  onChange={(e) => handleChange('homeLocation', e.target.value)}
                  className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-900 border border-transparent focus:border-sky-500 rounded-2xl outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Default Currency</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  value={settings.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full p-4 pl-12 bg-slate-50 dark:bg-slate-900 border border-transparent focus:border-sky-500 rounded-2xl outline-none transition-all appearance-none"
                >
                  {['USD', 'EUR', 'GBP', 'JPY', 'CAD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${settings.theme === 'dark' ? 'bg-indigo-900/30 text-indigo-400' : 'bg-yellow-50 text-yellow-600'}`}>
              {settings.theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
            </div>
            <div>
              <h3 className="font-bold text-lg">Dark Mode</h3>
              <p className="text-xs text-slate-400 font-medium">Toggle application appearance</p>
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className={`w-14 h-8 rounded-full transition-all relative ${settings.theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${settings.theme === 'dark' ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <div className="p-8 text-center">
          <p className="text-slate-400 text-sm">TripFlow Prototype v1.0.0</p>
          <div className="flex justify-center gap-4 mt-2">
            <button className="text-sky-500 text-xs font-bold hover:underline">Privacy Policy</button>
            <button className="text-sky-500 text-xs font-bold hover:underline">Terms of Service</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
