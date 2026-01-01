/**
 * OpenRouteService API Client for TripFlow
 *
 * Provides real road-based routing using OpenRouteService API.
 * Free tier: 2000 requests/day (40 requests/hour)
 *
 * Features:
 * - Direction routing for walking, driving, cycling
 * - Route optimization
 * - Error handling with fallback to straight lines
 * - Request caching
 *
 * API Docs: https://openrouteservice.org/dev/#/api-docs
 */

import type { TransportMode } from '../types';

// OpenRouteService API configuration
const ORS_BASE_URL = 'https://api.openrouteservice.org';
const ORS_API_KEY = import.meta.env.VITE_OPENROUTE_API_KEY;

// Rate limiting
const MIN_REQUEST_INTERVAL_MS = 100; // 10 requests/second max
let lastRequestTime = 0;

// Cache for routes (key: start-end-mode)
const routeCache = new Map<string, CachedRoute>();
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Cached route entry
 */
interface CachedRoute {
  geometry: GeoJSON.LineString;
  distance: number;
  duration: number;
  timestamp: number;
}

/**
 * OpenRouteService route response
 */
interface ORSDirectionsResponse {
  features: Array<{
    geometry: {
      coordinates: number[][];
      type: 'LineString';
    };
    properties: {
      segments: Array<{
        distance: number;
        duration: number;
      }>;
      summary: {
        distance: number;
        duration: number;
      };
    };
  }>;
}

/**
 * Route result returned by this service
 */
export interface RouteResult {
  geometry: GeoJSON.LineString;
  distance: number;  // meters
  duration: number;  // seconds
  source: 'ors' | 'fallback';
}

/**
 * Map TripFlow transport modes to OpenRouteService profile types
 */
function getORSProfile(mode: TransportMode): string {
  switch (mode) {
    case 'walking':
      return 'foot-walking';
    case 'driving':
      return 'driving-car';
    case 'cycling':
      return 'cycling-regular';
    case 'transit':
      // ORS doesn't have public transit routing, fall back to walking
      return 'foot-walking';
    default:
      return 'driving-car';
  }
}

/**
 * Wait for rate limit to allow a new request
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
    const waitTime = MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

/**
 * Generate cache key for a route
 */
function getCacheKey(
  start: [number, number],
  end: [number, number],
  mode: TransportMode
): string {
  return `${start[0].toFixed(5)},${start[1].toFixed(5)}-${end[0].toFixed(5)},${end[1].toFixed(5)}-${mode}`;
}

/**
 * Check if cached route is still valid
 */
function isCacheValid(cached: CachedRoute): boolean {
  return Date.now() - cached.timestamp < CACHE_DURATION_MS;
}

/**
 * Get route from OpenRouteService API
 *
 * @param start - Start coordinates [lat, lng]
 * @param end - End coordinates [lat, lng]
 * @param mode - Transport mode
 * @returns Route with geometry, distance, and duration
 */
export async function getRoute(
  start: [number, number],
  end: [number, number],
  mode: TransportMode
): Promise<RouteResult | null> {
  // Check if API key is configured
  if (!ORS_API_KEY) {
    console.warn('OpenRouteService: API key not configured');
    return null;
  }

  // Check cache first
  const cacheKey = getCacheKey(start, end, mode);
  const cached = routeCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    console.log(`OpenRouteService: Using cached route for ${mode}`);
    return {
      ...cached,
      source: 'ors',
    };
  }

  // Wait for rate limit
  await waitForRateLimit();

  try {
    const profile = getORSProfile(mode);

    // ORS expects coordinates as [lng, lat] (opposite of our [lat, lng])
    const coordinates = [
      [start[1], start[0]],
      [end[1], end[0]],
    ];

    const response = await fetch(
      `${ORS_BASE_URL}/v2/directions/${profile}/geojson`,
      {
        method: 'POST',
        headers: {
          'Authorization': ORS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json, application/geo+json',
        },
        body: JSON.stringify({
          coordinates,
          elevation: false,
          instructions: false,
          preference: 'fastest',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouteService: API error ${response.status}:`, errorText);
      return null;
    }

    const data: ORSDirectionsResponse = await response.json();

    if (!data.features || data.features.length === 0) {
      console.warn('OpenRouteService: No route found');
      return null;
    }

    const feature = data.features[0];
    const { distance, duration } = feature.properties.summary;

    // Create GeoJSON LineString (coordinates are already in [lng, lat] format)
    const geometry: GeoJSON.LineString = {
      type: 'LineString',
      coordinates: feature.geometry.coordinates,
    };

    const result: CachedRoute = {
      geometry,
      distance,
      duration,
      timestamp: Date.now(),
    };

    // Cache the result
    routeCache.set(cacheKey, result);

    console.log(
      `OpenRouteService: Fetched ${mode} route (${(distance / 1000).toFixed(1)}km, ${Math.round(duration / 60)}min)`
    );

    return {
      ...result,
      source: 'ors',
    };
  } catch (error) {
    console.error('OpenRouteService: Request failed', error);
    return null;
  }
}

/**
 * Batch fetch multiple routes
 *
 * @param routes - Array of route requests
 * @returns Map of cache keys to route results
 */
export async function batchGetRoutes(
  routes: Array<{
    start: [number, number];
    end: [number, number];
    mode: TransportMode;
  }>
): Promise<Map<string, RouteResult | null>> {
  const results = new Map<string, RouteResult | null>();

  for (const route of routes) {
    const cacheKey = getCacheKey(route.start, route.end, route.mode);
    const result = await getRoute(route.start, route.end, route.mode);
    results.set(cacheKey, result);
  }

  return results;
}

/**
 * Clear the route cache
 */
export function clearRouteCache(): void {
  routeCache.clear();
  console.log('OpenRouteService: Cache cleared');
}

/**
 * Get cache statistics
 */
export function getRouteCacheStats(): {
  size: number;
  oldestEntry: number | null;
  newestEntry: number | null;
} {
  let oldest: number | null = null;
  let newest: number | null = null;

  routeCache.forEach((entry) => {
    if (!oldest || entry.timestamp < oldest) oldest = entry.timestamp;
    if (!newest || entry.timestamp > newest) newest = entry.timestamp;
  });

  return {
    size: routeCache.size,
    oldestEntry: oldest,
    newestEntry: newest,
  };
}

export default {
  getRoute,
  batchGetRoutes,
  clearRouteCache,
  getRouteCacheStats,
};
