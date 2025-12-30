
import React, { useState } from 'react';
import { Trip, PackingItem } from '../../types';
import { PACKING_CATEGORIES } from '../../data';
import { 
  Package, Check, Plus, Trash2, Luggage, 
  Sparkles, Zap, Loader2, AlertTriangle, 
  ShieldCheck, Info, X, Thermometer, 
  Wind, Sun, CheckCircle2, Footprints, 
  CreditCard, Pill, Gem, HelpCircle,
  MoreVertical, CheckSquare, Square
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, Type } from "@google/genai";

interface PackingTabProps {
  trip: Trip;
  updateTrip: (trip: Trip) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  'Clothing': <Luggage size={18} />,
  'Shoes': <Footprints size={18} />,
  'Electronics': <Zap size={18} />,
  'Documents': <CreditCard size={18} />,
  'Medications': <Pill size={18} />,
  'Toiletries': <ShieldCheck size={18} />,
  'Accessories': <Gem size={18} />,
  'Emergency Gear': <AlertTriangle size={18} />,
  'Miscellaneous': <HelpCircle size={18} />,
  'Misc': <Package size={18} />
};

const PackingTab: React.FC<PackingTabProps> = ({ trip, updateTrip }) => {
  const [newItem, setNewItem] = useState({ name: '', category: PACKING_CATEGORIES[0] });
  const [isAiPacking, setIsAiPacking] = useState(false);

  const toggleItem = (id: string) => {
    const newList = trip.packingList.map(item => 
      item.id === id ? { ...item, isPacked: !item.isPacked } : item
    );
    updateTrip({ ...trip, packingList: newList });
  };

  const bulkAction = (category: string, pack: boolean) => {
    const newList = trip.packingList.map(item => 
      item.category === category ? { ...item, isPacked: pack } : item
    );
    updateTrip({ ...trip, packingList: newList });
  };

  const addItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItem.name) return;
    const item: PackingItem = { 
      id: uuidv4(), 
      name: newItem.name, 
      category: newItem.category, 
      isPacked: false 
    };
    updateTrip({ ...trip, packingList: [...trip.packingList, item] });
    setNewItem({ ...newItem, name: '' });
  };

  const deployAiPacker = async () => {
    setIsAiPacking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a smart packing list for a ${trip.type} trip to ${trip.destinations.join(', ')} in ${trip.startDate}. 
                   The trip is for ${trip.itinerary.length} days. 
                   Return a JSON array of 12 essential items. Each object: {name, category (one of: ${PACKING_CATEGORIES.join(', ')})}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING }
              },
              required: ['name', 'category']
            }
          }
        }
      });
      
      const suggestions = JSON.parse(response.text);
      const newItems = suggestions.map((s: any) => ({
        id: uuidv4(),
        name: s.name,
        category: PACKING_CATEGORIES.includes(s.category) ? s.category : 'Miscellaneous',
        isPacked: false
      }));

      updateTrip({ ...trip, packingList: [...trip.packingList, ...newItems] });
    } catch (e) {
      console.error("AI Packing failed", e);
    } finally {
      setIsAiPacking(false);
    }
  };

  const deleteItem = (id: string) => {
    updateTrip({ ...trip, packingList: trip.packingList.filter(i => i.id !== id) });
  };

  const totalItems = trip.packingList.length;
  const packedItems = trip.packingList.filter(i => i.isPacked).length;
  const progress = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-12 pb-32 no-scrollbar">
      {/* Tactical Loadout Header */}
      <section className="bg-slate-950 rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden shadow-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-primary/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="space-y-8 max-w-2xl">
            <div className="inline-flex items-center gap-4 px-4 py-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <Package size={18} className="text-brand-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/70">Equipment Logistics</span>
            </div>
            <h2 className="text-6xl md:text-7xl font-display font-bold leading-tight">
              Expedition <span className="text-brand-primary">Loadout</span>
            </h2>
            <p className="text-white/50 text-xl font-medium leading-relaxed">
              Synchronize your physical inventory with mission requirements. Deploy AI reconnaissance for optimal gear selection across all mission sectors.
            </p>
            <div className="flex flex-wrap gap-5">
              <button 
                onClick={deployAiPacker}
                disabled={isAiPacking}
                className="group relative px-10 py-5 bg-white text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-4 overflow-hidden transition-all hover:pr-14 disabled:opacity-50 shadow-2xl"
              >
                {isAiPacking ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} className="text-brand-primary" />}
                {isAiPacking ? 'Calculating...' : 'Deploy AI Packer'}
              </button>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white/10 flex flex-col items-center gap-6 min-w-[300px]">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle className="text-white/5" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                <circle 
                  className="text-brand-primary" 
                  strokeWidth="10" 
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - progress / 100)}
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="40" cx="50" cy="50" 
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-display font-bold">{progress}%</span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Global Load</span>
              </div>
            </div>
            <div className="text-center">
               <p className="text-2xl font-display font-bold">{packedItems} / {totalItems}</p>
               <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Assets Verified</p>
            </div>
          </div>
        </div>
      </section>

      {/* Manual Entry HUB */}
      <form onSubmit={addItem} className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-[3rem] shadow-sm border border-slate-100 dark:border-white/5">
        <div className="flex-1 flex items-center gap-4 px-6">
          <Plus size={24} className="text-slate-300" />
          <input 
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder="Register new equipment asset..."
            className="w-full bg-transparent py-4 text-xl font-bold outline-none placeholder:text-slate-300 dark:text-white"
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            className="px-6 py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl outline-none text-[10px] font-black uppercase tracking-widest text-slate-500 border border-transparent focus:border-brand-primary transition-all"
          >
            {PACKING_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <button type="submit" className="bg-brand-primary hover:bg-brand-secondary text-white px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/10 transition-all flex items-center justify-center">
            Add Asset
          </button>
        </div>
      </form>

      {/* Gear Compartments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {PACKING_CATEGORIES.map(cat => {
          const items = trip.packingList.filter(i => i.category === cat);
          if (items.length === 0 && !['Clothing', 'Shoes', 'Toiletries'].includes(cat)) return null;
          
          const catPacked = items.filter(i => i.isPacked).length;
          const catProgress = items.length > 0 ? (catPacked / items.length) * 100 : 0;
          const allPacked = items.length > 0 && catPacked === items.length;

          return (
            <div key={cat} className="group bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-slate-200/60 dark:border-white/5 hover:shadow-3xl transition-all duration-700 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 text-brand-primary">
                    {CATEGORY_ICONS[cat] || <Package size={18} />}
                    <h4 className="font-display font-bold text-2xl text-slate-900 dark:text-white">{cat}</h4>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section {cat.charAt(0)}</p>
                </div>
                <div className="flex items-center gap-2">
                   {items.length > 0 && (
                      <button 
                        onClick={() => bulkAction(cat, !allPacked)}
                        title={allPacked ? "Unpack All" : "Pack All"}
                        className={`p-2 rounded-xl transition-all ${allPacked ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-brand-primary'}`}
                      >
                        {allPacked ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                   )}
                </div>
              </div>

              {/* Individual Category Progress Bar */}
              <div className="mb-6 space-y-2">
                <div className="flex justify-between items-end px-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sector Ready</span>
                  <span className="text-xs font-display font-bold text-brand-primary">{Math.round(catProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${catProgress === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-brand-primary'}`} 
                    style={{ width: `${catProgress}%` }} 
                  />
                </div>
              </div>

              <div className="space-y-3 flex-1">
                {items.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`group/item p-5 rounded-3xl cursor-pointer transition-all border flex items-center justify-between ${
                      item.isPacked 
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-500/10 text-slate-400' 
                        : 'bg-slate-50 dark:bg-slate-950 border-transparent hover:border-brand-primary/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-xl flex items-center justify-center border-2 transition-all ${
                        item.isPacked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}>
                        {item.isPacked && <Check size={14} strokeWidth={4} />}
                      </div>
                      <span className={`text-sm font-bold ${item.isPacked ? 'line-through opacity-50' : 'text-slate-700 dark:text-slate-300'}`}>
                        {item.name}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                      className="opacity-0 group-hover/item:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <Info size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-300">Section Empty</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Critical Assets Strip */}
      <section className="bg-brand-accent/10 border-2 border-dashed border-brand-accent/30 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="flex items-center gap-6">
            <div className="p-5 bg-brand-accent text-white rounded-[2rem] shadow-xl shadow-orange-500/20">
               <AlertTriangle size={32} />
            </div>
            <div>
               <h4 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Critical Readiness</h4>
               <p className="text-slate-500 font-medium">Verified credentials and emergency gear take absolute precedence.</p>
            </div>
         </div>
         <div className="flex gap-4">
            <div className="px-8 py-4 bg-white dark:bg-slate-900 rounded-2xl border border-brand-accent/20 flex items-center gap-3">
               <div className="w-3 h-3 rounded-full bg-brand-accent animate-ping" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Check Alpha</span>
            </div>
         </div>
      </section>
    </div>
  );
};

export default PackingTab;
