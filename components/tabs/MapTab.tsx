/**
 * MapTab Component - MapLibre GL JS Implementation
 *
 * Features:
 * - Interactive map with smooth flyTo animations
 * - Day-by-day filtering with color-coded markers
 * - Activity type filtering
 * - Route lines connecting waypoints
 * - Light/Dark theme toggle (Voyager styles)
 * - AI-powered neighborhood scanning
 * - Place search with geocoding
 * - Weather radar overlay
 *
 * Tile Providers:
 * - Carto Vector Tiles (free, no API key required)
 * - MapLibre demo tiles (fallback)
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Map as MapGL, Marker, NavigationControl, ScaleControl, Source, Layer, Popup } from '@vis.gl/react-maplibre';
import type { MapRef, MarkerEvent, LngLatLike } from '@vis.gl/react-maplibre';
import type { LineLayerSpecification } from 'maplibre-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Trip, Activity, ActivityType, WishlistPlace, Expense } from '../../types';
import {
  Navigation, Focus, Layers, Target,
  Sparkles, Compass, Loader2, X,
  ScanLine, Eye, Route, Globe, Landmark, Utensils, Plane, Bed, Coffee, Heart, Camera,
  Filter, Map as MapIcon, MapPin, ChevronUp, ChevronDown, Search,
  Star, ShoppingBag, HelpCircle, DollarSign, Receipt,
  Download, CloudOff, Check, AlertCircle, Maximize2, Minimize2, LocateFixed, Crosshair,
  CloudRain, Building2, Mountain, Sun, Moon, Palette, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { geminiService } from '../../src/services/GeminiService';
import { geocodeDestination, geocode, SearchSuggestion } from '../../services/GeocodingService';
import { generateRouteSegments, createRoutesGeoJSON, getDayColor } from '../../services/RouteService';
import PlaceSearch from '../PlaceSearch';
import { useOfflineMap, formatBytes } from '../../hooks/useOfflineMap';

interface MapTabProps {
  trip: Trip;
}

// Map style URLs - Using Carto's free vector tiles (no API key required)
const MAP_STYLES = {
  // Vector styles from Carto (free, no API key)
  light: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', // Voyager - Colorful & detailed
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', // Dark Voyager
  // Fallback to demo tiles if Carto is unavailable
  fallbackLight: 'https://demotiles.maplibre.org/style.json',
};

// Weather radar - RainViewer API (free for personal use)
const RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json';

// Map style display names and icons
type MapStyleKey = 'light' | 'dark';

interface MapStyleOption {
  key: MapStyleKey;
  name: string;
  description: string;
}

const MAP_STYLE_OPTIONS: MapStyleOption[] = [
  { key: 'light', name: 'Voyager', description: 'Colorful & detailed' },
  { key: 'dark', name: 'Dark Voyager', description: 'Night mode voyager' },
];

// Day colors for markers and routes
const DAY_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

// Activity type icons mapping
const BRIEFING_ICONS: Record<string, React.ElementType> = {
  Landmark, Utensils, Plane, Bed, Coffee, Heart, Camera
};

const ACTIVITY_TYPE_ICONS: Record<ActivityType, React.ElementType> = {
  'Attraction': Camera,
  'Restaurant': Utensils,
  'Transportation': Plane,
  'Accommodation': Bed,
  'Tour': Compass,
  'Free time': Coffee,
  'Custom': MapPin,
};

const ACTIVITY_TYPES: ActivityType[] = [
  'Attraction', 'Restaurant', 'Transportation', 'Accommodation', 'Tour', 'Free time', 'Custom'
];

// Wishlist category styling
type WishlistCategory = 'Must See' | 'Maybe' | 'Restaurant' | 'Shopping';

const WISHLIST_CATEGORY_COLORS: Record<WishlistCategory, string> = {
  'Must See': '#EF4444',    // Red
  'Maybe': '#F59E0B',       // Amber
  'Restaurant': '#10B981',  // Emerald
  'Shopping': '#EC4899',    // Pink
};

const WISHLIST_CATEGORY_ICONS: Record<WishlistCategory, React.ElementType> = {
  'Must See': Star,
  'Maybe': HelpCircle,
  'Restaurant': Utensils,
  'Shopping': ShoppingBag,
};

// Expense category colors for markers
const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  'Flights': '#3B82F6',      // Blue
  'Accommodation': '#8B5CF6', // Violet
  'Food': '#10B981',         // Emerald
  'Activities': '#F59E0B',   // Amber
  'Transport': '#6366F1',    // Indigo
  'Shopping': '#EC4899',     // Pink
  'Other': '#6B7280',        // Gray
};

// Generate coordinates offset from a base location for activities without geocoded coords
function generateOffsetCoords(id: string, baseCoords: [number, number]): [number, number] {
  const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return [
    baseCoords[0] + (Math.cos(seed * 0.1) * 0.015),
    baseCoords[1] + (Math.sin(seed * 0.1) * 0.015),
  ];
}

// Activity with coordinates
interface ActivityWithCoords extends Activity {
  dayIndex: number;
  coords: [number, number]; // [lat, lng]
  isGeocoded: boolean;
}

// Custom marker component with staggered animations
interface ActivityMarkerProps {
  activity: Activity;
  index: number;
  dayIndex: number;
  isActive: boolean;
  onClick: () => void;
}

function ActivityMarker({ activity, index, dayIndex, isActive, onClick }: ActivityMarkerProps) {
  const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
  const Icon = ACTIVITY_TYPE_ICONS[activity.type] || MapPin;
  const [isVisible, setIsVisible] = useState(false);

  // Staggered entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center
        w-10 h-10 rounded-2xl
        border-4 border-white dark:border-slate-800
        shadow-xl
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${isActive ? 'scale-125 z-50' : 'scale-100 hover:scale-110'}
      `}
      style={{
        backgroundColor: color,
        transitionDelay: `${index * 50}ms`,
      }}
      title={activity.name}
    >
      <span className="text-white font-black text-xs">{index + 1}</span>

      {/* Activity type icon badge */}
      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md">
        <Icon className="w-3 h-3" style={{ color }} />
      </div>

      {/* Active indicator pulse */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-2xl animate-ping opacity-50"
          style={{ backgroundColor: color }}
        />
      )}

      {/* Hover tooltip */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
        {activity.name}
      </div>
    </button>
  );
}

// Wishlist marker component with animations
interface WishlistMarkerProps {
  place: WishlistPlace & { coords: [number, number] };
  isActive: boolean;
  onClick: () => void;
  index?: number;
}

function WishlistMarker({ place, isActive, onClick, index = 0 }: WishlistMarkerProps) {
  const color = WISHLIST_CATEGORY_COLORS[place.category] || '#6B7280';
  const Icon = WISHLIST_CATEGORY_ICONS[place.category] || Star;
  const [isVisible, setIsVisible] = useState(false);

  // Staggered entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 400 + index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center
        w-9 h-9 rounded-full
        border-3 border-white dark:border-slate-800
        shadow-lg
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
        ${isActive ? 'scale-125 z-50' : 'hover:scale-110'}
      `}
      style={{
        backgroundColor: color,
        transitionDelay: `${index * 50}ms`,
      }}
      title={place.name}
    >
      <Icon className="w-4 h-4 text-white" />

      {/* Rating badge */}
      {place.rating > 0 && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md text-[9px] font-black" style={{ color }}>
          {place.rating}
        </div>
      )}

      {/* Active indicator pulse */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-50"
          style={{ backgroundColor: color }}
        />
      )}
    </button>
  );
}

const MapTab: React.FC<MapTabProps> = ({ trip }) => {
  const location = useLocation();

  // Theme detection
  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Map state
  const mapRef = useRef<MapRef>(null);
  const [selectedDay, setSelectedDay] = useState<string | 'all'>(trip.itinerary[0]?.id || 'all');
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [activeTypeFilter, setActiveTypeFilter] = useState<ActivityType | 'All'>('All');
  const [popupInfo, setPopupInfo] = useState<{ activity: Activity; coords: [number, number] } | null>(null);

  // Map style and layers state
  const [mapStyleKey, setMapStyleKey] = useState<MapStyleKey>('light');
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showWeatherRadar, setShowWeatherRadar] = useState(false);
  const [show3DBuildings, setShow3DBuildings] = useState(false);
  const [showTerrain, setShowTerrain] = useState(false);
  const [showRoutes, setShowRoutes] = useState(true);
  const [weatherRadarPath, setWeatherRadarPath] = useState<string | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Geocoding state
  const [baseCoords, setBaseCoords] = useState<[number, number]>([139.6503, 35.6762]); // Default Tokyo [lng, lat]
  const [isGeocodingDestination, setIsGeocodingDestination] = useState(false);
  const [geocodedActivities, setGeocodedActivities] = useState<Map<string, [number, number]>>(new Map());
  const [geocodedWishlist, setGeocodedWishlist] = useState<Map<string, [number, number]>>(new Map());
  const [showSearch, setShowSearch] = useState(false);

  // Layer visibility toggles
  const [showWishlist, setShowWishlist] = useState(() => {
    // Check if we're navigating from wishlist tab
    const state = location.state as { showWishlist?: boolean } | null;
    return state?.showWishlist ?? true;
  });
  const [activeWishlistPlace, setActiveWishlistPlace] = useState<WishlistPlace | null>(null);

  // AI scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scannedIntel, setScannedIntel] = useState<{ name: string; type: string }[]>([]);

  // Bottom sheet state (mobile)
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // User location state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Initial animation state
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);

  // Route visualization - now async with OpenRouteService
  const [routeSegments, setRouteSegments] = useState<any[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

  // Phase Grid scroll ref for desktop navigation
  const phaseGridRef = useRef<HTMLDivElement>(null);

  // Scroll Phase Grid left/right (for desktop arrow navigation)
  const scrollPhaseGrid = useCallback((direction: 'left' | 'right') => {
    if (!phaseGridRef.current) return;

    const container = phaseGridRef.current;
    const scrollAmount = 150; // Scroll by ~1 button width
    const newScrollLeft = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  }, []);

  // Generate route segments (async - fetches from OpenRouteService)
  useEffect(() => {
    if (geocodedActivities.size === 0) {
      setRouteSegments([]);
      return;
    }

    let cancelled = false;

    const fetchRoutes = async () => {
      setIsLoadingRoutes(true);
      try {
        const segments = await generateRouteSegments(
          trip.itinerary,
          geocodedActivities,
          {
            useRealRoutes: true, // Enable OpenRouteService routing
            onProgress: (current, total) => {
              console.log(`RouteService: Generating routes ${current}/${total}`);
            },
          }
        );

        if (!cancelled) {
          setRouteSegments(segments);
        }
      } catch (error) {
        console.error('Failed to generate route segments:', error);
        if (!cancelled) {
          setRouteSegments([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRoutes(false);
        }
      }
    };

    fetchRoutes();

    return () => {
      cancelled = true;
    };
  }, [trip.itinerary, geocodedActivities]);

  const routesGeoJSON = useMemo(() => {
    // Convert day ID ('day-1', 'day-2', 'all') to day number (1, 2, null)
    let dayNumber: number | null = null;
    if (selectedDay !== 'all') {
      const dayIndex = trip.itinerary.findIndex(day => day.id === selectedDay);
      dayNumber = dayIndex >= 0 ? dayIndex + 1 : null;
    }

    return createRoutesGeoJSON(routeSegments, dayNumber);
  }, [routeSegments, selectedDay, trip.itinerary]);

  // Offline map caching
  const {
    isSupported: isOfflineSupported,
    progress: offlineProgress,
    downloadTilesForTrip,
    resetProgress: resetOfflineProgress,
  } = useOfflineMap();

  // Handle offline download
  const handleDownloadOffline = useCallback(() => {
    if (baseCoords) {
      downloadTilesForTrip(baseCoords, 15); // 15km radius around destination
    }
  }, [baseCoords, downloadTilesForTrip]);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Get user's current location
  const handleLocateUser = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setIsLocating(false);

        // Fly to user location
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 15,
          duration: 1500,
          essential: true,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Initial animation - fly to destination after geocoding
  useEffect(() => {
    if (!isGeocodingDestination && baseCoords && !hasAnimatedIn && mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.flyTo({
          center: baseCoords,
          zoom: 13,
          duration: 2000,
          essential: true,
        });
        setHasAnimatedIn(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isGeocodingDestination, baseCoords, hasAnimatedIn]);

  // Geocode trip destination on mount
  useEffect(() => {
    const geocodeTripDestination = async () => {
      if (!trip.destinations || trip.destinations.length === 0) return;

      setIsGeocodingDestination(true);
      try {
        const destination = trip.destinations[0];
        const coords = await geocodeDestination(destination);
        setBaseCoords(coords);
        console.log(`MapTab: Geocoded "${destination}" to`, coords);
      } catch (error) {
        console.error('MapTab: Failed to geocode destination', error);
      } finally {
        setIsGeocodingDestination(false);
      }
    };

    geocodeTripDestination();
  }, [trip.destinations]);

  // Geocode activities with location names (lazy, on first view)
  useEffect(() => {
    const geocodeActivitiesWithLocations = async () => {
      // Get all activities with location names that haven't been geocoded
      const activitiesToGeocode = trip.itinerary
        .flatMap((day) => day.activities)
        .filter((act) => act.location && !geocodedActivities.has(act.id));

      if (activitiesToGeocode.length === 0) return;

      // Geocode in batches to respect rate limiting
      const newCoords = new Map(geocodedActivities);

      for (const activity of activitiesToGeocode.slice(0, 3)) {
        // Limit to 3 per render to avoid rate limiting
        try {
          const searchQuery = `${activity.location}, ${trip.destinations[0] || ''}`;
          const results = await geocode(searchQuery, { limit: 1 });

          if (results.length > 0) {
            newCoords.set(activity.id, [results[0].lat, results[0].lng]);
            console.log(`MapTab: Geocoded activity "${activity.name}" to`, results[0]);
          } else {
            // Nominatim returned 0 results - use fallback offset coordinates
            const fallbackCoords = generateOffsetCoords(activity.id, [baseCoords[1], baseCoords[0]]);
            newCoords.set(activity.id, fallbackCoords);
            console.log(`MapTab: Used fallback coords for activity "${activity.name}" (geocoding failed)`);
          }
        } catch (error) {
          // Error during geocoding - use fallback offset coordinates
          const fallbackCoords = generateOffsetCoords(activity.id, [baseCoords[1], baseCoords[0]]);
          newCoords.set(activity.id, fallbackCoords);
          console.error(`MapTab: Failed to geocode activity "${activity.name}", using fallback coords`, error);
        }
      }

      if (newCoords.size !== geocodedActivities.size) {
        setGeocodedActivities(newCoords);
      }
    };

    // Delay to avoid blocking initial render
    const timeoutId = setTimeout(geocodeActivitiesWithLocations, 1000);
    return () => clearTimeout(timeoutId);
  }, [trip.itinerary, trip.destinations, geocodedActivities]);

  // Geocode wishlist places with location names
  useEffect(() => {
    const geocodeWishlistPlaces = async () => {
      // Get wishlist places with location or name that haven't been geocoded
      const placesToGeocode = trip.wishlist
        .filter((place) => !geocodedWishlist.has(place.id))
        .filter((place) => place.location || place.name);

      if (placesToGeocode.length === 0) return;

      const newCoords = new Map(geocodedWishlist);

      for (const place of placesToGeocode.slice(0, 2)) {
        // Limit to 2 per render
        try {
          // Use coordinates if already provided
          if (place.coordinates) {
            newCoords.set(place.id, place.coordinates);
            continue;
          }

          const searchQuery = `${place.location || place.name}, ${trip.destinations[0] || ''}`;
          const results = await geocode(searchQuery, { limit: 1 });

          if (results.length > 0) {
            newCoords.set(place.id, [results[0].lat, results[0].lng]);
            console.log(`MapTab: Geocoded wishlist "${place.name}" to`, results[0]);
          }
        } catch (error) {
          console.error(`MapTab: Failed to geocode wishlist "${place.name}"`, error);
        }
      }

      if (newCoords.size !== geocodedWishlist.size) {
        setGeocodedWishlist(newCoords);
      }
    };

    const timeoutId = setTimeout(geocodeWishlistPlaces, 2000);
    return () => clearTimeout(timeoutId);
  }, [trip.wishlist, trip.destinations, geocodedWishlist]);

  // Wishlist places with coordinates
  const wishlistPlaces = useMemo(() => {
    return trip.wishlist
      .filter((place) => {
        // Has explicit coordinates or has been geocoded
        return place.coordinates || geocodedWishlist.has(place.id);
      })
      .map((place) => ({
        ...place,
        coords: (place.coordinates || geocodedWishlist.get(place.id) ||
          generateOffsetCoords(place.id, [baseCoords[1], baseCoords[0]])) as [number, number],
      }));
  }, [trip.wishlist, geocodedWishlist, baseCoords]);

  // Filtered activities with coordinates
  const activities: ActivityWithCoords[] = useMemo(() => {
    return trip.itinerary
      .filter(day => selectedDay === 'all' || day.id === selectedDay)
      .flatMap((day) =>
        day.activities
          .filter(act => act.location)
          .filter(act => activeTypeFilter === 'All' || act.type === activeTypeFilter)
          .map(act => {
            // Use geocoded coords if available, otherwise generate offset from base
            const geocodedCoord = geocodedActivities.get(act.id);
            const coords: [number, number] = geocodedCoord
              ? geocodedCoord
              : generateOffsetCoords(act.id, [baseCoords[1], baseCoords[0]]);

            return {
              ...act,
              dayIndex: trip.itinerary.findIndex(d => d.id === day.id),
              coords,
              isGeocoded: !!geocodedCoord,
            };
          })
      );
  }, [trip.itinerary, selectedDay, activeTypeFilter, baseCoords, geocodedActivities]);

  // Automatically fit map bounds to show all activities
  useEffect(() => {
    if (!mapRef.current || activities.length === 0) return;

    const map = mapRef.current.getMap();
    if (!map) return;

    // Calculate bounds that include all activity markers
    const bounds = activities.reduce((bounds, activity) => {
      return bounds.extend([activity.coords[1], activity.coords[0]]);
    }, new maplibregl.LngLatBounds(
      [activities[0].coords[1], activities[0].coords[0]],
      [activities[0].coords[1], activities[0].coords[0]]
    ));

    // Fit map to bounds with padding (consistent padding to prevent "cutting" effect)
    map.fitBounds(bounds, {
      padding: { top: 100, bottom: 100, left: 100, right: 100 },
      duration: 1000, // Smooth animation
      maxZoom: 15, // Don't zoom in too close
    });
  }, [activities]);

  // Get day index for an activity
  const getDayIndex = useCallback((activityId: string): number => {
    for (let i = 0; i < trip.itinerary.length; i++) {
      if (trip.itinerary[i].activities.some(a => a.id === activityId)) {
        return i;
      }
    }
    return 0;
  }, [trip.itinerary]);

  // Route line GeoJSON (DEPRECATED - replaced with day-colored routes)
  // Using routesGeoJSON from line 338-340 instead

  // Map style based on selected style key
  const mapStyle = useMemo(() => {
    return MAP_STYLES[mapStyleKey] || MAP_STYLES.light;
  }, [mapStyleKey]);

  // Fetch weather radar data from RainViewer
  const fetchWeatherRadar = useCallback(async () => {
    if (!showWeatherRadar) return;

    setIsLoadingWeather(true);
    try {
      const response = await fetch(RAINVIEWER_API);
      const data = await response.json();

      // Get the most recent radar frame
      if (data.radar?.past?.length > 0) {
        const latestFrame = data.radar.past[data.radar.past.length - 1];
        setWeatherRadarPath(latestFrame.path);
      }
    } catch (error) {
      console.error('Failed to fetch weather radar:', error);
    } finally {
      setIsLoadingWeather(false);
    }
  }, [showWeatherRadar]);

  // Fetch weather radar when enabled
  useEffect(() => {
    if (showWeatherRadar) {
      fetchWeatherRadar();
      // Refresh every 5 minutes
      const interval = setInterval(fetchWeatherRadar, 5 * 60 * 1000);
      return () => clearInterval(interval);
    } else {
      setWeatherRadarPath(null);
    }
  }, [showWeatherRadar, fetchWeatherRadar]);

  // Add/remove 3D buildings layer when map loads or setting changes
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const handleStyleLoad = () => {
      if (show3DBuildings) {
        // Add 3D building extrusion layer
        if (!map.getLayer('3d-buildings')) {
          // Check if source exists
          if (!map.getSource('carto')) {
            // For Carto styles, buildings are already in the style
            // We just need to modify the building layer or add an extrusion
            const layers = map.getStyle()?.layers;
            const buildingLayer = layers?.find(l => l.id.includes('building'));

            if (buildingLayer) {
              // Add 3D extrusion effect to buildings
              map.addLayer({
                id: '3d-buildings',
                type: 'fill-extrusion',
                source: buildingLayer.source || 'carto',
                'source-layer': 'building',
                minzoom: 14,
                paint: {
                  'fill-extrusion-color': isDarkMode ? '#1e293b' : '#d1d5db',
                  'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 10],
                  'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
                  'fill-extrusion-opacity': 0.6,
                },
              });
            }
          }
        }
      } else {
        // Remove 3D buildings layer
        if (map.getLayer('3d-buildings')) {
          map.removeLayer('3d-buildings');
        }
      }
    };

    map.on('style.load', handleStyleLoad);
    // Also run immediately if style is already loaded
    if (map.isStyleLoaded()) {
      handleStyleLoad();
    }

    return () => {
      map.off('style.load', handleStyleLoad);
    };
  }, [show3DBuildings, isDarkMode]);

  // Add/update route visualization layer
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const handleStyleLoad = () => {
      // Add routes source if not exists
      if (!map.getSource('routes')) {
        map.addSource('routes', {
          type: 'geojson',
          data: routesGeoJSON,
        });
      } else {
        // Update existing source with new data
        const source = map.getSource('routes') as maplibregl.GeoJSONSource;
        source.setData(routesGeoJSON);
      }

      // Add routes layer if not exists
      if (!map.getLayer('routes-layer')) {
        map.addLayer({
          id: 'routes-layer',
          type: 'line',
          source: 'routes',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
            'visibility': showRoutes ? 'visible' : 'none',
          },
          paint: {
            'line-color': ['get', 'color'], // Use day color from properties
            'line-width': 3,
            'line-opacity': 0.8,
          },
        });
      }

      // Add route labels layer if not exists
      if (!map.getLayer('routes-labels')) {
        map.addLayer({
          id: 'routes-labels',
          type: 'symbol',
          source: 'routes',
          layout: {
            'text-field': [
              'concat',
              ['get', 'distanceText'],
              ' • ',
              ['get', 'walkingTime']
            ],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 12,
            'symbol-placement': 'line-center',
            'text-rotation-alignment': 'map',
            'text-pitch-alignment': 'viewport',
            'text-max-angle': 45,
            'visibility': showRoutes ? 'visible' : 'none',
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': ['get', 'color'], // Match route color
            'text-halo-width': 2,
            'text-halo-blur': 1,
          },
          minzoom: 13, // Only show labels when zoomed in
        });
      }
    };

    map.on('style.load', handleStyleLoad);
    // Also run immediately if style is already loaded
    if (map.isStyleLoaded()) {
      handleStyleLoad();
    }

    return () => {
      map.off('style.load', handleStyleLoad);
    };
  }, [routesGeoJSON]);

  // Update route layer visibility when toggle changes
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const updateVisibility = () => {
      const visibility = showRoutes ? 'visible' : 'none';

      if (map.getLayer('routes-layer')) {
        map.setLayoutProperty('routes-layer', 'visibility', visibility);
      }

      if (map.getLayer('routes-labels')) {
        map.setLayoutProperty('routes-labels', 'visibility', visibility);
      }
    };

    // Update immediately if style is loaded
    if (map.isStyleLoaded()) {
      updateVisibility();
    }

    // Also listen for style load in case map is reinitialized
    map.on('style.load', updateVisibility);

    return () => {
      map.off('style.load', updateVisibility);
    };
  }, [showRoutes]);

  // Focus on an activity
  const focusWaypoint = useCallback((activity: Activity & { coords: [number, number] }) => {
    setActiveActivity(activity);
    setPopupInfo({ activity, coords: activity.coords });

    mapRef.current?.flyTo({
      center: [activity.coords[1], activity.coords[0]],
      zoom: 15,
      duration: 1200,
      essential: true,
    });
  }, []);

  // Focus overview (fit all markers)
  const focusOverview = useCallback(() => {
    if (activities.length === 0) return;

    const bounds = activities.reduce(
      (acc, act) => ({
        minLng: Math.min(acc.minLng, act.coords[1]),
        maxLng: Math.max(acc.maxLng, act.coords[1]),
        minLat: Math.min(acc.minLat, act.coords[0]),
        maxLat: Math.max(acc.maxLat, act.coords[0]),
      }),
      { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity }
    );

    mapRef.current?.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      {
        padding: { top: 100, bottom: 100, left: 480, right: 100 },
        duration: 1000,
      }
    );

    setActiveActivity(null);
    setPopupInfo(null);
  }, [activities]);

  // Handle search result selection
  const handleSearchSelect = useCallback((place: SearchSuggestion) => {
    setShowSearch(false);

    // Fly to the selected place
    mapRef.current?.flyTo({
      center: [place.lng, place.lat],
      zoom: 15,
      duration: 1500,
      essential: true,
    });
  }, []);

  // Focus on a wishlist place
  const focusWishlistPlace = useCallback((place: WishlistPlace & { coords: [number, number] }) => {
    setActiveWishlistPlace(place);
    setActiveActivity(null);
    setPopupInfo(null);

    mapRef.current?.flyTo({
      center: [place.coords[1], place.coords[0]],
      zoom: 15,
      duration: 1200,
      essential: true,
    });
  }, []);

  // AI neighborhood scan
  const scanNeighborhood = async () => {
    setIsScanning(true);
    setScannedIntel([]);
    try {
      const targetLocation = activities[0]?.location || trip.destinations[0];

      // Get context from current activities
      const nearbyActivities = activities
        .filter(act => act.location)
        .map(act => `${act.type}: ${act.name}`)
        .slice(0, 3);

      const activityContext = nearbyActivities.length > 0
        ? `You're planning: ${nearbyActivities.join('; ')}.`
        : '';

      const response = await geminiService.generateText({
        prompt: `You're a local expert in ${targetLocation}. Find 4 authentic hidden gems that locals love - NOT touristy spots.

**Context:**
${activityContext}
Trip type: ${trip.type}
Location: ${targetLocation}

**Requirements:**
1. Only recommend places locals actually visit - no tourist traps
2. Mix types: cafes, viewpoints, shops, parks, street food, galleries
3. Within walking distance or short ride from ${targetLocation}
4. Each recommendation should include type (Cafe/Viewpoint/Shop/Park/Food/Gallery/Bar)
5. Focus on unique character, not chains or franchises

Return JSON array: [{name, type}] with 4 authentic local spots.`,
        model: 'gemini-2.0-flash-exp',
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, type: { type: 'string' } },
              required: ['name', 'type']
            }
          }
        }
      });
      setScannedIntel(JSON.parse(response || '[]'));
    } catch (e) {
      console.error('Scan failed:', e);
    } finally {
      setIsScanning(false);
    }
  };

  // Route line layer style with day-based colors and transport mode patterns
  const routeLayerStyle: LineLayerSpecification = {
    id: 'route',
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': ['get', 'color'], // Use color from feature properties
      'line-width': 4,
      'line-opacity': 0.8,
      // Different line patterns based on transport mode
      'line-dasharray': [
        'match',
        ['get', 'mode'],
        'walking', ['literal', [2, 2]],      // Dashed for walking
        'cycling', ['literal', [0.5, 2]],    // Dotted for cycling
        'transit', ['literal', [4, 2]],      // Long dash for transit
        'driving', ['literal', [1]],         // Solid for driving (default)
        ['literal', [1]]                      // Default solid line
      ],
    },
  };

  const routeGlowStyle: LineLayerSpecification = {
    id: 'route-glow',
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': ['get', 'color'], // Use color from feature properties
      'line-width': 10,
      'line-opacity': 0.2,
      'line-blur': 4,
    },
  };

  const BriefingIcon = activeActivity?.iconName ? BRIEFING_ICONS[activeActivity.iconName] || Target : Target;

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col md:flex-row bg-white dark:bg-slate-950 overflow-hidden font-sans transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-[100]' : ''}`}
    >
      {/* HUD Navigator Sidebar */}
      <div className="w-full md:w-[460px] h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/10 p-8 flex flex-col z-30 shadow-3xl overflow-y-auto no-scrollbar transition-colors flex-shrink-0">
        <div className="mb-8">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <Compass size={14} className="text-brand-primary" /> Phase Grid
          </p>
          <div className="relative group">
            {/* Left arrow - Desktop only */}
            <button
              onClick={() => scrollPhaseGrid('left')}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-full items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ChevronLeft size={16} className="text-slate-600 dark:text-slate-300" />
            </button>

            {/* Scrollable Phase Grid */}
            <div ref={phaseGridRef} className="flex gap-2 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory scroll-smooth">
              <button
                onClick={() => setSelectedDay('all')}
                className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 snap-center ${selectedDay === 'all' ? 'bg-brand-primary text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}
              >
                All Phases
              </button>
              {trip.itinerary.map((day, i) => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day.id)}
                  className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 flex-shrink-0 snap-center ${selectedDay === day.id ? 'bg-brand-primary text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: DAY_COLORS[i % DAY_COLORS.length] }}
                  />
                  Day {i + 1}
                </button>
              ))}
            </div>

            {/* Right arrow - Desktop only */}
            <button
              onClick={() => scrollPhaseGrid('right')}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-full items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ChevronRight size={16} className="text-slate-600 dark:text-slate-300" />
            </button>
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
            {ACTIVITY_TYPES.map(type => {
              const TypeIcon = ACTIVITY_TYPE_ICONS[type];
              return (
                <button
                  key={type}
                  onClick={() => setActiveTypeFilter(type)}
                  className={`px-4 py-2.5 rounded-xl text-[9px] font-bold transition-all border flex items-center gap-2 ${activeTypeFilter === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800'}`}
                >
                  <TypeIcon className="w-3 h-3" />
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Waypoint List */}
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
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black z-10 transition-all text-white`}
                    style={{ backgroundColor: DAY_COLORS[act.dayIndex % DAY_COLORS.length] }}
                  >
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

          {/* AI Scan Button */}
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

      {/* Main Map Engine - Using absolute positioning for reliable height */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 overflow-hidden">
        {/* Loading overlay during geocoding */}
        {isGeocodingDestination && (
          <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full border-4 border-indigo-100 dark:border-indigo-900 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe className="w-10 h-10 text-indigo-600 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">
                Locating Destination
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {trip.destinations[0]}
              </p>
            </div>
          </div>
        )}

        {/* Map Error Overlay */}
        {mapError && (
          <div className="absolute inset-0 z-50 bg-red-50 dark:bg-red-900/20 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="bg-white dark:bg-slate-900 border-2 border-red-500 rounded-2xl p-8 max-w-md text-center shadow-2xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <MapIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Map Loading Error
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                {mapError}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setMapError(null);
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => setMapError(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                Check browser console (F12) for details
              </p>
            </div>
          </div>
        )}

        <MapGL
          ref={mapRef}
          initialViewState={{
            longitude: baseCoords[0],
            latitude: baseCoords[1],
            zoom: 13,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={mapStyle}
          attributionControl={false}
          onClick={() => {
            setPopupInfo(null);
            setActiveActivity(null);
          }}
          onLoad={() => {
            console.log('[MapTab] Map loaded successfully');
            setIsMapLoaded(true);
            setMapError(null);
          }}
          onError={(error) => {
            console.error('[MapTab] Map error:', error);
            setMapError(`Map failed to load: ${error?.message || 'Unknown error'}`);
            setIsMapLoaded(false);

            // Try fallback to demo tiles
            if (mapStyle !== MAP_STYLES.fallbackLight) {
              console.warn('[MapTab] Falling back to demo tiles');
              setTimeout(() => {
                setMapStyleKey('light');
              }, 1000);
            }
          }}
        >
          {/* Navigation controls */}
          <NavigationControl position="top-right" showCompass showZoom />
          <ScaleControl position="bottom-left" maxWidth={100} unit="metric" />

          {/* Weather Radar Layer */}
          {showWeatherRadar && weatherRadarPath && (
            <Source
              id="weather-radar"
              type="raster"
              tiles={[`https://tilecache.rainviewer.com/v2/radar/${weatherRadarPath}/256/{z}/{x}/{y}/2/1_1.png`]}
              tileSize={256}
            >
              <Layer
                id="weather-radar-layer"
                type="raster"
                paint={{
                  'raster-opacity': 0.6,
                }}
              />
            </Source>
          )}

          {/* Route lines (day-colored polylines between activities) */}
          {routesGeoJSON && routesGeoJSON.features.length > 0 && (
            <Source id="route" type="geojson" data={routesGeoJSON}>
              <Layer {...routeGlowStyle} />
              <Layer {...routeLayerStyle} />
            </Source>
          )}

          {/* Activity markers */}
          {activities.map((act, i) => (
            <Marker
              key={act.id}
              longitude={act.coords[1]}
              latitude={act.coords[0]}
              anchor="center"
            >
              <ActivityMarker
                activity={act}
                index={i}
                dayIndex={act.dayIndex}
                isActive={activeActivity?.id === act.id}
                onClick={() => focusWaypoint(act)}
              />
            </Marker>
          ))}

          {/* Wishlist markers */}
          {showWishlist && wishlistPlaces.map((place, idx) => (
            <Marker
              key={`wishlist-${place.id}`}
              longitude={place.coords[1]}
              latitude={place.coords[0]}
              anchor="center"
            >
              <WishlistMarker
                place={place}
                index={idx}
                isActive={activeWishlistPlace?.id === place.id}
                onClick={() => focusWishlistPlace(place)}
              />
            </Marker>
          ))}

          {/* User location marker */}
          {userLocation && (
            <Marker
              longitude={userLocation[1]}
              latitude={userLocation[0]}
              anchor="center"
            >
              <div className="relative">
                {/* Outer pulse ring */}
                <div className="absolute inset-0 w-12 h-12 -ml-4 -mt-4 bg-blue-500/20 rounded-full animate-ping" />
                {/* Inner pulse ring */}
                <div className="absolute inset-0 w-8 h-8 -ml-2 -mt-2 bg-blue-500/30 rounded-full animate-pulse" />
                {/* Center dot */}
                <div className="relative w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg shadow-blue-500/50" />
              </div>
            </Marker>
          )}

          {/* Popup */}
          {popupInfo && (
            <Popup
              longitude={popupInfo.coords[1]}
              latitude={popupInfo.coords[0]}
              anchor="bottom"
              onClose={() => setPopupInfo(null)}
              closeButton={false}
              className="maplibre-popup-custom"
            >
              <div className="p-3 min-w-[200px]">
                <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-1">
                  {popupInfo.activity.type}
                </p>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {popupInfo.activity.name}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {popupInfo.activity.startTime} - {popupInfo.activity.endTime}
                </p>
              </div>
            </Popup>
          )}
        </MapGL>

        {/* Map Control Overlays */}
        <div className="absolute top-8 left-[480px] z-[40] hidden lg:block">
          {/* Search input or mode badge */}
          {showSearch ? (
            <div className="w-[400px] relative">
              <PlaceSearch
                onSelect={handleSearchSelect}
                placeholder="Search for a place..."
                nearLocation={baseCoords ? { lat: baseCoords[1], lng: baseCoords[0] } : undefined}
              />
              <button
                onClick={() => setShowSearch(false)}
                className="absolute right-14 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          ) : (
            <div className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4">
              <div className="p-2.5 bg-brand-primary rounded-xl text-white shadow-lg"><MapIcon size={20} /></div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {isGeocodingDestination ? 'Locating...' : 'Map Mode'}
                </p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {isGeocodingDestination ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Finding {trip.destinations[0]}
                    </span>
                  ) : (
                    MAP_STYLE_OPTIONS.find(s => s.key === mapStyleKey)?.name || 'Map View'
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowSearch(true)}
                className="ml-2 p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                title="Search places"
              >
                <Search className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          )}
        </div>

        <div className="absolute top-24 right-4 z-[40] flex flex-col gap-3">
          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className={`w-14 h-14 rounded-2xl border transition-all shadow-xl flex items-center justify-center ${
              isFullscreen
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-50'
            }`}
          >
            {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
          </button>

          {/* Locate user button */}
          <button
            onClick={handleLocateUser}
            disabled={isLocating}
            title="Find my location"
            className={`w-14 h-14 rounded-2xl border transition-all shadow-xl flex items-center justify-center ${
              userLocation
                ? 'bg-blue-500 border-blue-400 text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-50'
            }`}
          >
            {isLocating ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <Crosshair size={24} />
            )}
          </button>

          <button
            onClick={focusOverview}
            title="Recenter Grid"
            className="w-14 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-slate-800 dark:text-white hover:bg-brand-primary hover:text-white transition-all shadow-xl"
          >
            <Focus size={24} />
          </button>
          {/* Layer Control Toggle */}
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            title="Map Layers"
            className={`w-14 h-14 rounded-2xl border transition-all shadow-xl flex items-center justify-center ${showLayerPanel ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-50'}`}
          >
            <Layers size={24} />
          </button>

          {/* Wishlist Layer Toggle */}
          <button
            onClick={() => setShowWishlist(!showWishlist)}
            title={showWishlist ? 'Hide wishlist places' : 'Show wishlist places'}
            className={`w-14 h-14 rounded-2xl border transition-all shadow-xl flex items-center justify-center ${
              showWishlist
                ? 'bg-pink-500 border-pink-400 text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-50'
            }`}
          >
            <Heart size={24} className={showWishlist ? 'fill-white' : ''} />
          </button>

          {/* Offline Download Button */}
          {isOfflineSupported && (
            <button
              onClick={handleDownloadOffline}
              disabled={offlineProgress.status === 'caching'}
              title={
                offlineProgress.status === 'complete'
                  ? 'Map saved for offline'
                  : offlineProgress.status === 'caching'
                  ? `Downloading ${offlineProgress.percent}%`
                  : 'Download map for offline use'
              }
              className={`w-14 h-14 rounded-2xl border transition-all shadow-xl flex items-center justify-center relative ${
                offlineProgress.status === 'complete'
                  ? 'bg-emerald-500 border-emerald-400 text-white'
                  : offlineProgress.status === 'error'
                  ? 'bg-red-500 border-red-400 text-white'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-50'
              }`}
            >
              {offlineProgress.status === 'caching' ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  {/* Progress ring */}
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90"
                    viewBox="0 0 56 56"
                  >
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={`${(offlineProgress.percent / 100) * 150} 150`}
                      className="text-blue-500"
                    />
                  </svg>
                </>
              ) : offlineProgress.status === 'complete' ? (
                <Check size={24} />
              ) : offlineProgress.status === 'error' ? (
                <AlertCircle size={24} />
              ) : (
                <Download size={24} />
              )}
            </button>
          )}
        </div>

        {/* Layer Control Panel */}
        {showLayerPanel && (
          <div className="absolute top-24 right-20 z-[45] w-72 bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl animate-in slide-in-from-right-4 fade-in duration-300 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <Layers size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Map Layers</h3>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest">Customize view</p>
                </div>
              </div>
              <button
                onClick={() => setShowLayerPanel(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            {/* Map Style Selection */}
            <div className="p-4 border-b border-slate-100 dark:border-white/10">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Palette size={12} /> Base Map Style
              </p>
              <div className="grid grid-cols-1 gap-2">
                {MAP_STYLE_OPTIONS.map((style) => (
                  <button
                    key={style.key}
                    onClick={() => setMapStyleKey(style.key)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      mapStyleKey === style.key
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {style.key === 'light' && <Palette size={14} className="text-emerald-500" />}
                      {style.key === 'dark' && <Moon size={14} className="text-indigo-500" />}
                      <span className={`text-xs font-bold ${
                        mapStyleKey === style.key ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {style.name}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400">{style.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Overlay Layers */}
            <div className="p-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Layers size={12} /> Overlay Layers
              </p>
              <div className="space-y-2">
                {/* Weather Radar Toggle */}
                <button
                  onClick={() => setShowWeatherRadar(!showWeatherRadar)}
                  className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between ${
                    showWeatherRadar
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      showWeatherRadar ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      <CloudRain size={16} />
                    </div>
                    <div className="text-left">
                      <span className={`text-xs font-bold block ${
                        showWeatherRadar ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        Weather Radar
                      </span>
                      <span className="text-[9px] text-slate-400">Live precipitation</span>
                    </div>
                  </div>
                  <div className={`transition-colors ${showWeatherRadar ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'}`}>
                    {showWeatherRadar ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </div>
                </button>

                {/* 3D Buildings Toggle */}
                <button
                  onClick={() => setShow3DBuildings(!show3DBuildings)}
                  className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between ${
                    show3DBuildings
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      show3DBuildings ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      <Building2 size={16} />
                    </div>
                    <div className="text-left">
                      <span className={`text-xs font-bold block ${
                        show3DBuildings ? 'text-violet-600 dark:text-violet-400' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        3D Buildings
                      </span>
                      <span className="text-[9px] text-slate-400">Building extrusion at zoom 14+</span>
                    </div>
                  </div>
                  <div className={`transition-colors ${show3DBuildings ? 'text-violet-500' : 'text-slate-300 dark:text-slate-600'}`}>
                    {show3DBuildings ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </div>
                </button>

                {/* Wishlist Places Toggle */}
                <button
                  onClick={() => setShowWishlist(!showWishlist)}
                  className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between ${
                    showWishlist
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      showWishlist ? 'bg-pink-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      <Heart size={16} className={showWishlist ? 'fill-white' : ''} />
                    </div>
                    <div className="text-left">
                      <span className={`text-xs font-bold block ${
                        showWishlist ? 'text-pink-600 dark:text-pink-400' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        Wishlist Places
                      </span>
                      <span className="text-[9px] text-slate-400">{wishlistPlaces.length} places saved</span>
                    </div>
                  </div>
                  <div className={`transition-colors ${showWishlist ? 'text-pink-500' : 'text-slate-300 dark:text-slate-600'}`}>
                    {showWishlist ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </div>
                </button>

                {/* Route Visualization Toggle */}
                <button
                  onClick={() => setShowRoutes(!showRoutes)}
                  className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between ${
                    showRoutes
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      showRoutes ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {isLoadingRoutes ? <Loader2 size={16} className="animate-spin" /> : <Route size={16} />}
                    </div>
                    <div className="text-left">
                      <span className={`text-xs font-bold block ${
                        showRoutes ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        Activity Routes
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {isLoadingRoutes ? 'Generating...' : `${routeSegments.length} route segments`}
                      </span>
                    </div>
                  </div>
                  <div className={`transition-colors ${showRoutes ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'}`}>
                    {showRoutes ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </div>
                </button>
              </div>
            </div>

            {/* Route Generation Loading Indicator */}
            {isLoadingRoutes && (
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Generating route segments...</span>
                </div>
              </div>
            )}

            {/* Weather Loading Indicator */}
            {isLoadingWeather && (
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Loading weather data...</span>
                </div>
              </div>
            )}

            {/* Attribution Footer */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-white/5">
              <p className="text-[8px] text-slate-400 text-center">
                Weather: RainViewer • Map Tiles: Carto Vector
              </p>
            </div>
          </div>
        )}

        {/* HUD Briefing Card */}
        {activeActivity && (
          <div className="absolute bottom-10 right-10 z-[50] w-[360px] bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-3xl animate-in slide-in-from-bottom-8 p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-primary">Phase Briefing</span>
                <h4 className="text-xl font-display font-bold text-slate-900 dark:text-white leading-tight">{activeActivity.name}</h4>
              </div>
              <button onClick={() => { setActiveActivity(null); setPopupInfo(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all text-slate-400"><X size={18} /></button>
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

        {/* Wishlist Info Card */}
        {activeWishlistPlace && (
          <div className="absolute bottom-10 right-10 z-[50] w-[360px] bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-3xl animate-in slide-in-from-bottom-8 p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <span
                  className="text-[9px] font-black uppercase tracking-[0.3em]"
                  style={{ color: WISHLIST_CATEGORY_COLORS[activeWishlistPlace.category] }}
                >
                  Wishlist • {activeWishlistPlace.category}
                </span>
                <h4 className="text-xl font-display font-bold text-slate-900 dark:text-white leading-tight">
                  {activeWishlistPlace.name}
                </h4>
              </div>
              <button
                onClick={() => setActiveWishlistPlace(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {/* Rating */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rating</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={star <= activeWishlistPlace.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
                      />
                    ))}
                  </div>
                </div>
                {/* Category Icon */}
                <div
                  className="p-4 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: `${WISHLIST_CATEGORY_COLORS[activeWishlistPlace.category]}15`,
                    color: WISHLIST_CATEGORY_COLORS[activeWishlistPlace.category]
                  }}
                >
                  {React.createElement(WISHLIST_CATEGORY_ICONS[activeWishlistPlace.category] || Star, { size: 24 })}
                </div>
              </div>

              {/* Notes */}
              {activeWishlistPlace.notes && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p
                    className="text-[9px] font-bold flex items-center gap-2 mb-2 tracking-widest uppercase"
                    style={{ color: WISHLIST_CATEGORY_COLORS[activeWishlistPlace.category] }}
                  >
                    Notes
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic">
                    "{activeWishlistPlace.notes}"
                  </p>
                </div>
              )}

              {/* Actions */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeWishlistPlace.name + ' ' + (activeWishlistPlace.location || trip.destinations[0] || ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 text-white font-bold rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em]"
                style={{ backgroundColor: WISHLIST_CATEGORY_COLORS[activeWishlistPlace.category] }}
              >
                <Route size={16} /> View on Maps
              </a>
            </div>
          </div>
        )}
        </div>{/* Close absolute inset-0 wrapper */}
      </div>

      {/* Custom popup styles */}
      <style>{`
        /* Popup styling */
        .maplibregl-popup-content {
          background: rgba(255, 255, 255, 0.98) !important;
          border-radius: 20px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
          padding: 0 !important;
          overflow: hidden;
          animation: popup-enter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes popup-enter {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .dark .maplibregl-popup-content {
          background: rgba(15, 23, 42, 0.98) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        .maplibregl-popup-tip {
          border-top-color: rgba(255, 255, 255, 0.98) !important;
        }

        .dark .maplibregl-popup-tip {
          border-top-color: rgba(15, 23, 42, 0.98) !important;
        }

        .maplibregl-popup-close-button {
          display: none !important;
        }

        /* Navigation controls styling */
        .maplibregl-ctrl-group {
          border-radius: 16px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
          border: none !important;
          overflow: hidden;
          backdrop-filter: blur(8px);
        }

        .maplibregl-ctrl-group button {
          width: 44px !important;
          height: 44px !important;
          transition: all 0.2s ease !important;
        }

        .maplibregl-ctrl-group button:hover {
          background-color: rgba(99, 102, 241, 0.1) !important;
        }

        .maplibregl-ctrl-group button:active {
          transform: scale(0.95);
        }

        /* Scale control styling */
        .maplibregl-ctrl-scale {
          background: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(8px);
          border-radius: 8px !important;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          padding: 4px 8px !important;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
        }

        .dark .maplibregl-ctrl-scale {
          background: rgba(15, 23, 42, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #94a3b8 !important;
        }

        /* Attribution styling */
        .maplibregl-ctrl-attrib {
          background: rgba(255, 255, 255, 0.8) !important;
          backdrop-filter: blur(8px);
          border-radius: 8px !important;
          font-size: 9px !important;
          padding: 2px 6px !important;
        }

        .dark .maplibregl-ctrl-attrib {
          background: rgba(15, 23, 42, 0.8) !important;
          color: #64748b !important;
        }

        /* Smooth map transitions */
        .maplibregl-canvas {
          transition: filter 0.3s ease;
        }

        /* Fullscreen specific styles */
        :fullscreen .maplibregl-canvas-container {
          height: 100dvh !important;
        }

        /* Custom scrollbar for sidebar */
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        /* Marker hover effects */
        .marker-hover-effect {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .marker-hover-effect:hover {
          transform: scale(1.15);
          z-index: 100;
        }
      `}</style>
    </div>
  );
};

export default MapTab;
