
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Trip, Activity, ActivityType } from '../../types';
import { 
  Navigation, Focus, Layers, Target, 
  Sparkles, Compass, Loader2, X,
  ScanLine, Eye, Route, Globe, Landmark, Utensils, Plane, Bed, Coffee, Heart, Camera,
  Filter, Map as MapIcon
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface MapTabProps {
  trip: Trip;
}

const BRIEFING_ICONS: Record<string, any> = { Landmark, Utensils, Plane, Bed, Coffee, Heart, Camera };

const ACTIVITY_TYPES: ActivityType[] = [
  'Attraction', 'Restaurant', 'Transportation', 'Accommodation', 'Tour', 'Free time', 'Custom'
];

const MapTab: React.FC<MapTabProps> = ({ trip }) => {
  const [selectedDay, setSelectedDay] = useState<string | 'all'>(trip.itinerary[0]?.id || 'all');
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [activeTypeFilter, setActiveTypeFilter] = useState<ActivityType | 'All'>('All');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedIntel, setScannedIntel] = useState<{ name: string; type: string }[]>([]);
  const [isSatellite, setIsSatellite] = useState(false);
  
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const pathRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const initialCenter: [number, number] = [35.6762, 139.6503]; // Tokyo center base

  const activities = useMemo(() => {
    return trip.itinerary
      .filter(day => selectedDay === 'all' || day.id === selectedDay)
      .flatMap(day => day.activities)
      .filter(act => act.location)
      .filter(act => activeTypeFilter === 'All' || act.type === activeTypeFilter);
  }, [trip.itinerary, selectedDay, activeTypeFilter]);

  // Leaflet initialization
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !(window as any).L) return;
    const L = (window as any).L;

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true
    }).setView(initialCenter, 13);

    const observer = new ResizeObserver(() => {
      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    });
    observer.observe(mapContainerRef.current);

    updateTileLayer();

    return () => {
      observer.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const updateTileLayer = () => {
    if (!mapRef.current || !(window as any).L) return;
    const L = (window as any).L;

    if (tileLayerRef.current) tileLayerRef.current.remove();

    const url = isSatellite 
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    tileLayerRef.current = L.tileLayer(url, {
      className: isSatellite ? '' : 'tripflow-map-tiles'
    }).addTo(mapRef.current);
  };

  useEffect(() => {
    updateTileLayer();
  }, [isSatellite]);

  // Sync markers and routes with filtered activity list
  useEffect(() => {
    if (!mapRef.current || !(window as any).L) return;
    const L = (window as any).L;

    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();
    
    if (pathRef.current) pathRef.current.remove();

    if (activities.length === 0) return;

    // Generate deterministic coordinates for demo purposes based on ID
    const getCoords = (id: string): [number, number] => {
      const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return [
        initialCenter[0] + (Math.sin(seed * 0.1) * 0.015),
        initialCenter[1] + (Math.cos(seed * 0.1) * 0.015)
      ];
    };

    const coordinates: [number, number][] = activities.map(act => getCoords(act.id));

    activities.forEach((act, i) => {
      const coords = coordinates[i];
      const isActive = activeActivity?.id === act.id;
      
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative transition-all duration-300 ${isActive ? 'scale-125 z-[1000]' : 'scale-100'}">
            <div class="w-10 h-10 rounded-2xl ${isActive ? 'bg-indigo-600 shadow-indigo-500/50' : 'bg-brand-primary'} border-4 border-white dark:border-slate-800 shadow-2xl flex items-center justify-center text-white font-black text-xs transition-all duration-300">
              ${i + 1}
            </div>
            ${isActive ? '<div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping"></div>' : ''}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker(coords, { icon })
        .addTo(mapRef.current)
        .on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          focusWaypoint(act, coords);
        });
      
      // Bind a mini popup for quick info
      marker.bindPopup(`
        <div class="p-2 font-sans">
          <p class="text-[10px] font-black uppercase text-brand-primary tracking-widest mb-1">${act.type}</p>
          <p class="font-bold text-slate-900">${act.name}</p>
          <p class="text-[10px] text-slate-400 mt-1">${act.startTime} - ${act.endTime}</p>
        </div>
      `, { closeButton: false, offset: [0, -10] });

      markersRef.current.set(act.id, marker);
    });

    if (coordinates.length > 1) {
      // Draw a solid tactical line for routes
      pathRef.current = L.polyline(coordinates, {
        color: '#8B5CF6',
        weight: 6,
        opacity: 0.4,
        lineJoin: 'round',
        dashArray: '1, 12',
        lineCap: 'round'
      }).addTo(mapRef.current);

      // Add a glow effect path
      const glowPath = L.polyline(coordinates, {
        color: '#8B5CF6',
        weight: 12,
        opacity: 0.1,
      }).addTo(mapRef.current);
      
      // Wrap them in a group to clean up
      const featureGroup = L.featureGroup([pathRef.current, glowPath]);
      
      mapRef.current.fitBounds(featureGroup.getBounds(), { 
        paddingTopLeft: [460, 50], 
        paddingBottomRight: [50, 50],
        animate: true 
      });
    } else if (coordinates.length === 1) {
      mapRef.current.setView(coordinates[0], 15, { animate: true });
    }
  }, [activities, selectedDay, activeActivity?.id, activeTypeFilter]);

  const focusWaypoint = (act: Activity, coords?: [number, number]) => {
    setActiveActivity(act);
    const marker = markersRef.current.get(act.id);
    const targetCoords = coords || (marker && [marker.getLatLng().lat, marker.getLatLng().lng]);
    if (targetCoords) {
      mapRef.current.flyTo(targetCoords, 15, { 
        duration: 1,
        paddingTopLeft: [460, 0] 
      });
      // Programmatically open the popup
      marker?.openPopup();
    }
  };

  const scanNeighborhood = async () => {
    setIsScanning(true);
    setScannedIntel([]);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Recommend 3 hidden gems near ${activities[0]?.location || trip.destinations[0]}. Return as JSON array: [{name, type}].`,
        config: { 
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { name: { type: Type.STRING }, type: { type: Type.STRING } },
              required: ['name', 'type']
            }
          }
        }
      });
      setScannedIntel(JSON.parse(response.text));
    } catch (e) { console.error(e); } finally { setIsScanning(false); }
  };

  const focusOverview = () => {
    if (markersRef.current.size > 0) {
      const L = (window as any).L;
      const group = new L.featureGroup(Array.from(markersRef.current.values()));
      mapRef.current.fitBounds(group.getBounds(), { 
        paddingTopLeft: [460, 50], 
        paddingBottomRight: [50, 50],
        animate: true 
      });
    }
  };

  const BriefingIcon = activeActivity?.iconName ? BRIEFING_ICONS[activeActivity.iconName] || Target : Target;

  return (
    <div className="h-full flex flex-col md:flex-row bg-white dark:bg-slate-950 overflow-hidden font-sans transition-all duration-500">
      {/* HUD Navigator Sidebar */}
      <div className="w-full md:w-[460px] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/10 p-8 flex flex-col z-30 shadow-3xl overflow-y-auto no-scrollbar transition-colors">
        <div className="mb-8">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <Compass size={14} className="text-brand-primary" /> Phase Grid
          </p>
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            <button 
              onClick={() => setSelectedDay('all')}
              className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedDay === 'all' ? 'bg-brand-primary text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}
            >
              All Phases
            </button>
            {trip.itinerary.map((day, i) => (
              <button 
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedDay === day.id ? 'bg-brand-primary text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}
              >
                Day {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Type Filter HUD */}
        <div className="mb-8">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <Filter size={14} /> Sector Filtering
          </p>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setActiveTypeFilter('All')}
              className={`px-4 py-2.5 rounded-xl text-[9px] font-bold transition-all border ${activeTypeFilter === 'All' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800'}`}
            >
              All Types
            </button>
            {ACTIVITY_TYPES.map(type => (
              <button 
                key={type}
                onClick={() => setActiveTypeFilter(type)}
                className={`px-4 py-2.5 rounded-xl text-[9px] font-bold transition-all border ${activeTypeFilter === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-10 flex-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Waypoint Trace</label>
              <span className="text-[9px] font-black text-brand-primary">{activities.length} Waypoints</span>
            </div>
            <div className="space-y-2">
              {activities.map((act, i) => (
                <div 
                  key={act.id}
                  onClick={() => focusWaypoint(act)}
                  className={`relative flex items-center gap-4 p-5 rounded-[2rem] transition-all cursor-pointer group border ${activeActivity?.id === act.id ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-500/30' : 'hover:bg-slate-50 dark:hover:bg-white/5 border-transparent'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black z-10 transition-all ${activeActivity?.id === act.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-sm truncate ${activeActivity?.id === act.id ? 'text-indigo-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{act.name}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{act.startTime} • {act.type}</p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="py-12 text-center text-slate-400 italic text-xs bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                  No objectives detected in this sector.
                </div>
              )}
            </div>
          </div>

          <div className="pt-8">
            <button 
              onClick={scanNeighborhood}
              disabled={isScanning}
              className="w-full py-5 bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 font-black text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-4 transition-all"
            >
              {isScanning ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
              {isScanning ? 'Syncing...' : 'Scan Neighborhood'}
            </button>
            
            {scannedIntel.length > 0 && (
              <div className="mt-8 space-y-3 animate-in fade-in slide-in-from-bottom-4">
                <p className="text-[9px] font-black text-brand-primary uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Target size={12} /> Local Intel</p>
                {scannedIntel.map((item, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex items-center gap-4 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500"><Sparkles size={16} /></div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{item.name}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{item.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Map Engine */}
      <div className="flex-1 relative bg-slate-100 dark:bg-slate-900">
        <div ref={mapContainerRef} className="w-full h-full" id="tripflow-map-target" />
        
        {/* Map Control Overlays */}
        <div className="absolute top-8 left-[480px] z-[40] hidden lg:block">
           <div className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4">
              <div className="p-2.5 bg-brand-primary rounded-xl text-white shadow-lg"><MapIcon size={20} /></div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Map Mode</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Active Operational Grid</p>
              </div>
           </div>
        </div>

        <div className="absolute top-8 right-8 z-[40] flex flex-col gap-3">
           <button 
            onClick={focusOverview}
            title="Recenter Grid"
            className="w-14 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-slate-800 dark:text-white hover:bg-brand-primary hover:text-white transition-all shadow-xl"
           >
              <Focus size={24} />
           </button>
           <button 
            onClick={() => setIsSatellite(!isSatellite)}
            title="Toggle Satellite View"
            className={`w-14 h-14 rounded-2xl border transition-all shadow-xl flex items-center justify-center ${isSatellite ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-50'}`}
          >
            <Globe size={24} />
          </button>
        </div>

        {/* HUD Briefing Card */}
        {activeActivity && (
          <div className="absolute bottom-10 right-10 z-[50] w-[360px] bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-3xl animate-in slide-in-from-bottom-8 p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-primary">Phase Briefing</span>
                <h4 className="text-xl font-display font-bold text-slate-900 dark:text-white leading-tight">{activeActivity.name}</h4>
              </div>
              <button onClick={() => setActiveActivity(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all text-slate-400"><X size={18} /></button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Slot</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{activeActivity.startTime} - {activeActivity.endTime}</p>
                </div>
                <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-2xl flex items-center justify-center text-indigo-600">
                   <BriefingIcon size={24} />
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2 tracking-widest uppercase">Intel Log</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic">
                  "{activeActivity.notes || 'No specific sub-objectives logged for this sector.'}"
                </p>
              </div>

              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeActivity.name + ' ' + (activeActivity.location || ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-slate-900 dark:bg-brand-primary text-white font-bold rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em]"
              >
                 <Route size={16} /> GPS Engage
              </a>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-div-icon { background: none; border: none; }
        .tripflow-map-tiles { filter: grayscale(0.2) contrast(1.1) brightness(1.02); }
        .dark .tripflow-map-tiles { filter: invert(100%) hue-rotate(180deg) brightness(40%) contrast(120%) saturate(40%); }
        .leaflet-container { cursor: crosshair !important; background-color: #0f172a !important; }
        .leaflet-popup-content-wrapper { border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.05); }
        .leaflet-popup-tip { display: none; }
      `}</style>
    </div>
  );
};

export default MapTab;
