/**
 * AppleMapView Component
 *
 * React wrapper for Apple MapKit JS
 * Provides a simple API for rendering Apple Maps with route visualization
 *
 * Usage:
 * ```tsx
 * <AppleMapView
 *   center={{ latitude: 37.7749, longitude: -122.4194 }}
 *   routes={routeSegments}
 *   markers={activityMarkers}
 *   mapType="standard"
 * />
 * ```
 */

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

// MapKit JS types
/// <reference path="../types/mapkit.d.ts" />

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface MarkerData {
  id: string;
  coordinate: Coordinate;
  title: string;
  subtitle?: string;
  color?: string;
  data?: any;
}

interface RouteSegment {
  id: string;
  coordinates: Coordinate[];
  color: string;
  distance?: number;
  data?: any;
}

interface AppleMapViewProps {
  center: Coordinate;
  zoom?: number;
  mapType?: 'standard' | 'mutedStandard' | 'satellite' | 'hybrid';
  colorScheme?: 'light' | 'dark';
  markers?: MarkerData[];
  routes?: RouteSegment[];
  showsUserLocation?: boolean;
  onMapLoad?: (map: mapkit.Map) => void;
  onMarkerClick?: (marker: MarkerData) => void;
  className?: string;
}

// Load MapKit JS SDK
const loadMapKitSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.mapkit) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="mapkit"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load MapKit JS SDK')));
      return;
    }

    // Load SDK from Apple CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.core.js';
    script.crossOrigin = 'anonymous';
    script.async = true;

    script.onload = () => {
      console.log('[AppleMapView] MapKit JS SDK loaded');
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Failed to load MapKit JS SDK from CDN'));
    };

    document.head.appendChild(script);
  });
};

// Fetch JWT token from token server
const fetchMapKitToken = async (): Promise<string> => {
  const tokenAPI = import.meta.env.VITE_MAPKIT_TOKEN_API || 'http://localhost:3002/api/mapkit-token';

  try {
    const response = await fetch(tokenAPI, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    if (!response.ok) {
      throw new Error(`Token fetch failed: ${response.status} ${response.statusText}`);
    }

    const token = await response.text();
    console.log('[AppleMapView] Token fetched successfully');
    return token;
  } catch (error) {
    console.error('[AppleMapView] Token fetch error:', error);
    throw new Error('Failed to fetch MapKit token. Ensure token server is running.');
  }
};

export const AppleMapView: React.FC<AppleMapViewProps> = ({
  center,
  zoom = 13,
  mapType = 'standard',
  colorScheme = 'light',
  markers = [],
  routes = [],
  showsUserLocation = false,
  onMapLoad,
  onMarkerClick,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapkit.Map | null>(null);
  const annotationsRef = useRef<Map<string, mapkit.MarkerAnnotation>>(new Map());
  const overlaysRef = useRef<Map<string, mapkit.PolylineOverlay>>(new Map());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize MapKit JS
  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      if (!mapContainerRef.current) return;

      try {
        setLoading(true);
        setError(null);

        // Load MapKit SDK
        await loadMapKitSDK();

        // Initialize MapKit with token callback
        if (!window.mapkit.isInitialized) {
          window.mapkit.init({
            authorizationCallback: (done) => {
              fetchMapKitToken()
                .then((token) => done(token))
                .catch((error) => {
                  console.error('[AppleMapView] Token callback error:', error);
                  setError(error.message);
                });
            },
            language: 'en',
          });
        }

        // Wait for initialization
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!isMounted) return;

        // Create map instance
        const map = new window.mapkit.Map(mapContainerRef.current, {
          center: new window.mapkit.Coordinate(center.latitude, center.longitude),
          mapType: mapType,
          colorScheme: colorScheme,
          showsMapTypeControl: true,
          showsCompass: 'adaptive',
          showsScale: 'adaptive',
          showsUserLocation: showsUserLocation,
          isRotationEnabled: true,
          isZoomEnabled: true,
          isScrollEnabled: true,
        });

        mapInstanceRef.current = map;

        // Call onMapLoad callback
        if (onMapLoad) {
          onMapLoad(map);
        }

        setLoading(false);
        console.log('[AppleMapView] Map initialized successfully');
      } catch (error) {
        console.error('[AppleMapView] Initialization error:', error);
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Failed to initialize map');
          setLoading(false);
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [center.latitude, center.longitude, mapType, colorScheme, showsUserLocation, onMapLoad]);

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.mapkit) return;

    // Remove old markers
    const existingMarkerIds = new Set(annotationsRef.current.keys());
    const newMarkerIds = new Set(markers.map((m) => m.id));

    // Remove markers that no longer exist
    for (const id of existingMarkerIds) {
      if (!newMarkerIds.has(id)) {
        const annotation = annotationsRef.current.get(id);
        if (annotation) {
          map.removeAnnotation(annotation);
          annotationsRef.current.delete(id);
        }
      }
    }

    // Add or update markers
    for (const marker of markers) {
      const existing = annotationsRef.current.get(marker.id);

      if (existing) {
        // Update existing marker
        existing.coordinate = new window.mapkit.Coordinate(marker.coordinate.latitude, marker.coordinate.longitude);
        existing.title = marker.title;
        existing.subtitle = marker.subtitle || '';
      } else {
        // Create new marker
        const annotation = new window.mapkit.MarkerAnnotation(
          new window.mapkit.Coordinate(marker.coordinate.latitude, marker.coordinate.longitude),
          {
            title: marker.title,
            subtitle: marker.subtitle,
            color: marker.color || '#007AFF',
            data: marker.data,
          }
        );

        // Add click listener
        if (onMarkerClick) {
          annotation.addEventListener('select', () => {
            onMarkerClick(marker);
          });
        }

        map.addAnnotation(annotation);
        annotationsRef.current.set(marker.id, annotation);
      }
    }
  }, [markers, onMarkerClick]);

  // Update routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.mapkit) return;

    // Remove old routes
    const existingRouteIds = new Set(overlaysRef.current.keys());
    const newRouteIds = new Set(routes.map((r) => r.id));

    for (const id of existingRouteIds) {
      if (!newRouteIds.has(id)) {
        const overlay = overlaysRef.current.get(id);
        if (overlay) {
          map.removeOverlay(overlay);
          overlaysRef.current.delete(id);
        }
      }
    }

    // Add or update routes
    for (const route of routes) {
      const existing = overlaysRef.current.get(route.id);

      if (!existing) {
        // Create new route polyline
        const coordinates = route.coordinates.map(
          (coord) => new window.mapkit.Coordinate(coord.latitude, coord.longitude)
        );

        const style = new window.mapkit.Style({
          strokeColor: route.color,
          lineWidth: 4,
          strokeOpacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
        });

        const overlay = new window.mapkit.PolylineOverlay(coordinates, {
          style: style,
          data: route.data,
        });

        map.addOverlay(overlay);
        overlaysRef.current.set(route.id, overlay);
      }
    }
  }, [routes]);

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-3xl ${className}`}>
        <div className="text-center p-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">Map Initialization Failed</h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">{error}</p>
          <details className="text-xs text-red-600 dark:text-red-400 text-left">
            <summary className="cursor-pointer font-semibold mb-2">Troubleshooting</summary>
            <ul className="list-disc list-inside space-y-1">
              <li>Ensure the token server is running: <code className="bg-red-100 dark:bg-red-950 px-1 rounded">npm run dev:token</code></li>
              <li>Check .env file has Apple Maps credentials configured</li>
              <li>Verify private key (.p8 file) path is correct</li>
              <li>See <code>docs/guides/apple-maps-setup.md</code> for setup instructions</li>
            </ul>
          </details>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-3xl ${className}`}>
        <div className="text-center p-8">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading Apple Maps...</p>
        </div>
      </div>
    );
  }

  // Map container
  return (
    <div
      ref={mapContainerRef}
      className={`rounded-3xl overflow-hidden ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default AppleMapView;
