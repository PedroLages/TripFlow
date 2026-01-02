/**
 * Apple Maps Demo Component
 *
 * Simple demonstration of AppleMapView component
 * Shows markers and routes with TripFlow sample data
 *
 * Usage: Add route to App.tsx for testing
 * <Route path="/map-demo" element={<AppleMapDemo />} />
 */

import React, { useState } from 'react';
import { MapPin, Navigation, Satellite, Map as MapIcon } from 'lucide-react';
import AppleMapView from './AppleMapView';
import { useToast } from '../contexts/ToastContext';

// Sample San Francisco activities
const sampleMarkers = [
  {
    id: 'golden-gate',
    coordinate: { latitude: 37.8199, longitude: -122.4783 },
    title: 'Golden Gate Bridge',
    subtitle: 'Iconic suspension bridge',
    color: '#FF6B6B',
  },
  {
    id: 'alcatraz',
    coordinate: { latitude: 37.8267, longitude: -122.4230 },
    title: 'Alcatraz Island',
    subtitle: 'Historic federal prison',
    color: '#4ECDC4',
  },
  {
    id: 'fishermans-wharf',
    coordinate: { latitude: 37.8080, longitude: -122.4177 },
    title: "Fisherman's Wharf",
    subtitle: 'Waterfront neighborhood',
    color: '#FFE66D',
  },
  {
    id: 'union-square',
    coordinate: { latitude: 37.7879, longitude: -122.4075 },
    title: 'Union Square',
    subtitle: 'Shopping district',
    color: '#95E1D3',
  },
  {
    id: 'coit-tower',
    coordinate: { latitude: 37.8024, longitude: -122.4058 },
    title: 'Coit Tower',
    subtitle: 'Art Deco tower',
    color: '#F38181',
  },
];

// Sample route connecting activities
const sampleRoutes = [
  {
    id: 'route-1',
    coordinates: [
      { latitude: 37.8199, longitude: -122.4783 }, // Golden Gate
      { latitude: 37.8267, longitude: -122.4230 }, // Alcatraz
      { latitude: 37.8080, longitude: -122.4177 }, // Fisherman's Wharf
    ],
    color: '#6366F1', // Indigo
    distance: 8500,
  },
  {
    id: 'route-2',
    coordinates: [
      { latitude: 37.8080, longitude: -122.4177 }, // Fisherman's Wharf
      { latitude: 37.8024, longitude: -122.4058 }, // Coit Tower
      { latitude: 37.7879, longitude: -122.4075 }, // Union Square
    ],
    color: '#14B8A6', // Teal
    distance: 5200,
  },
];

const AppleMapDemo: React.FC = () => {
  const { showToast } = useToast();
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [showMarkers, setShowMarkers] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  const handleMarkerClick = (marker: any) => {
    showToast(`${marker.title} - ${marker.subtitle}`, 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-brand-primary rounded-2xl shadow-lg">
              <MapIcon className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
                Apple Maps Demo
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Testing MapKit JS integration with TripFlow
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 mb-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Map Type</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setMapType('standard')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                  mapType === 'standard'
                    ? 'bg-brand-primary text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <MapIcon size={18} />
                Standard
              </button>
              <button
                onClick={() => setMapType('satellite')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                  mapType === 'satellite'
                    ? 'bg-brand-primary text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <Satellite size={18} />
                Satellite
              </button>
              <button
                onClick={() => setMapType('hybrid')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                  mapType === 'hybrid'
                    ? 'bg-brand-primary text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <Navigation size={18} />
                Hybrid
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Display Options</h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowMarkers(!showMarkers)}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                  showMarkers
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <MapPin size={18} />
                {showMarkers ? 'Hide' : 'Show'} Markers ({sampleMarkers.length})
              </button>
              <button
                onClick={() => setShowRoutes(!showRoutes)}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                  showRoutes
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <Navigation size={18} />
                {showRoutes ? 'Hide' : 'Show'} Routes ({sampleRoutes.length})
              </button>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6">
          <AppleMapView
            center={{ latitude: 37.8024, longitude: -122.4250 }}
            zoom={12}
            mapType={mapType}
            colorScheme="light"
            markers={showMarkers ? sampleMarkers : []}
            routes={showRoutes ? sampleRoutes : []}
            showsUserLocation={false}
            onMarkerClick={handleMarkerClick}
            onMapLoad={(map) => {
              console.log('[AppleMapDemo] Map loaded successfully!', map);
            }}
            className="w-full h-[600px]"
          />
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="text-brand-primary" size={20} />
              <span className="text-xs font-bold text-slate-500 uppercase">Markers</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{sampleMarkers.length}</p>
            <p className="text-xs text-slate-500">Activity locations</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Navigation className="text-blue-500" size={20} />
              <span className="text-xs font-bold text-slate-500 uppercase">Routes</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{sampleRoutes.length}</p>
            <p className="text-xs text-slate-500">Day itineraries</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Satellite className="text-purple-500" size={20} />
              <span className="text-xs font-bold text-slate-500 uppercase">Distance</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {((sampleRoutes.reduce((sum, r) => sum + (r.distance || 0), 0)) / 1000).toFixed(1)} km
            </p>
            <p className="text-xs text-slate-500">Total route distance</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <MapIcon size={18} />
            Setup Instructions
          </h3>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
            <li>Ensure token server is running: <code className="bg-blue-100 dark:bg-blue-950 px-1 rounded">npm run dev:token</code></li>
            <li>Check <code className="bg-blue-100 dark:bg-blue-950 px-1 rounded">.env</code> has Apple Maps credentials</li>
            <li>See <code className="bg-blue-100 dark:bg-blue-950 px-1 rounded">docs/guides/apple-maps-setup.md</code> for full setup guide</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AppleMapDemo;
