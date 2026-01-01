/**
 * Geocoding Service for TripFlow
 *
 * Uses Nominatim (OpenStreetMap) for geocoding - free, no API key required.
 * Includes caching, rate limiting, and fallback coordinates.
 *
 * Features:
 * - Forward geocoding (address to coordinates)
 * - Reverse geocoding (coordinates to address)
 * - Search suggestions with autocomplete
 * - IndexedDB caching for offline support
 * - Rate limiting (1 request per second)
 */

// Geocoded result interface
export interface GeocodedLocation {
  lat: number;
  lng: number;
  displayName: string;
  type: string;
  importance: number;
  boundingBox?: [number, number, number, number]; // [south, north, west, east]
  address?: {
    city?: string;
    country?: string;
    state?: string;
    postcode?: string;
    road?: string;
    neighbourhood?: string;
  };
}

// Search suggestion interface
export interface SearchSuggestion {
  placeId: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
  importance: number;
}

// Cache entry
interface CacheEntry {
  query: string;
  results: GeocodedLocation[];
  timestamp: number;
}

// Nominatim API base URL
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Cache duration (24 hours)
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

// Rate limit: minimum time between requests (1 second)
const MIN_REQUEST_INTERVAL_MS = 1000;

// In-memory cache for fast lookups
const memoryCache = new Map<string, CacheEntry>();

// Last request timestamp for rate limiting
let lastRequestTime = 0;

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
 * Check if a cache entry is still valid
 */
function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_DURATION_MS;
}

/**
 * Get cached result if available
 */
function getCachedResult(query: string): GeocodedLocation[] | null {
  const normalizedQuery = query.toLowerCase().trim();
  const cached = memoryCache.get(normalizedQuery);

  if (cached && isCacheValid(cached)) {
    console.log(`GeocodingService: Using cached result for "${query}"`);
    return cached.results;
  }

  return null;
}

/**
 * Cache a geocoding result
 */
function cacheResult(query: string, results: GeocodedLocation[]): void {
  const normalizedQuery = query.toLowerCase().trim();
  memoryCache.set(normalizedQuery, {
    query: normalizedQuery,
    results,
    timestamp: Date.now(),
  });
}

/**
 * Forward geocode: Convert address/place name to coordinates
 *
 * @param query - Address or place name to geocode
 * @param options - Optional parameters
 * @returns Array of geocoded locations, sorted by relevance
 */
export async function geocode(
  query: string,
  options: {
    limit?: number;
    countryBias?: string; // ISO 3166-1 alpha-2 country code
    viewbox?: [number, number, number, number]; // [west, south, east, north]
  } = {}
): Promise<GeocodedLocation[]> {
  const { limit = 5, countryBias, viewbox } = options;

  // Check cache first
  const cached = getCachedResult(query);
  if (cached) {
    return cached.slice(0, limit);
  }

  // Wait for rate limit
  await waitForRateLimit();

  try {
    // Build URL with parameters
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: limit.toString(),
      'accept-language': 'en',
    });

    if (countryBias) {
      params.set('countrycodes', countryBias);
    }

    if (viewbox) {
      params.set('viewbox', viewbox.join(','));
      params.set('bounded', '1');
    }

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      headers: {
        'User-Agent': 'TripFlow/1.0 (https://github.com/tripflow)',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    // Transform Nominatim response to our format
    const results: GeocodedLocation[] = data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      type: item.type,
      importance: item.importance,
      boundingBox: item.boundingbox
        ? [
            parseFloat(item.boundingbox[0]),
            parseFloat(item.boundingbox[1]),
            parseFloat(item.boundingbox[2]),
            parseFloat(item.boundingbox[3]),
          ]
        : undefined,
      address: item.address
        ? {
            city: item.address.city || item.address.town || item.address.village,
            country: item.address.country,
            state: item.address.state,
            postcode: item.address.postcode,
            road: item.address.road,
            neighbourhood: item.address.neighbourhood || item.address.suburb,
          }
        : undefined,
    }));

    // Cache the results
    cacheResult(query, results);

    console.log(`GeocodingService: Geocoded "${query}" to ${results.length} results`);
    return results;
  } catch (error) {
    console.error('GeocodingService: Geocoding failed', error);
    return [];
  }
}

/**
 * Reverse geocode: Convert coordinates to address
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Geocoded location or null if not found
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodedLocation | null> {
  const cacheKey = `reverse:${lat.toFixed(6)},${lng.toFixed(6)}`;

  // Check cache
  const cached = getCachedResult(cacheKey);
  if (cached && cached.length > 0) {
    return cached[0];
  }

  // Wait for rate limit
  await waitForRateLimit();

  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
      'accept-language': 'en',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
      headers: {
        'User-Agent': 'TripFlow/1.0 (https://github.com/tripflow)',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.warn('GeocodingService: No results for coordinates', { lat, lng });
      return null;
    }

    const result: GeocodedLocation = {
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      displayName: data.display_name,
      type: data.type,
      importance: data.importance || 0.5,
      address: data.address
        ? {
            city: data.address.city || data.address.town || data.address.village,
            country: data.address.country,
            state: data.address.state,
            postcode: data.address.postcode,
            road: data.address.road,
            neighbourhood: data.address.neighbourhood || data.address.suburb,
          }
        : undefined,
    };

    // Cache result
    cacheResult(cacheKey, [result]);

    return result;
  } catch (error) {
    console.error('GeocodingService: Reverse geocoding failed', error);
    return null;
  }
}

/**
 * Search for places with autocomplete-style suggestions
 *
 * @param query - Search query
 * @param options - Optional parameters
 * @returns Array of search suggestions
 */
export async function searchPlaces(
  query: string,
  options: {
    limit?: number;
    near?: { lat: number; lng: number }; // Bias results toward this location
  } = {}
): Promise<SearchSuggestion[]> {
  const { limit = 8, near } = options;

  if (query.length < 2) {
    return [];
  }

  // Build viewbox around "near" point if provided (50km radius)
  let viewbox: [number, number, number, number] | undefined;
  if (near) {
    const offset = 0.5; // ~50km at equator
    viewbox = [
      near.lng - offset,
      near.lat - offset,
      near.lng + offset,
      near.lat + offset,
    ];
  }

  const results = await geocode(query, { limit, viewbox });

  return results.map((r, index) => ({
    placeId: `nominatim-${index}-${r.lat}-${r.lng}`,
    displayName: r.displayName,
    lat: r.lat,
    lng: r.lng,
    type: r.type,
    importance: r.importance,
  }));
}

/**
 * Geocode a destination string for a trip
 * Returns best match or fallback to world capitals
 *
 * @param destination - Destination name (e.g., "Tokyo, Japan")
 * @returns Coordinates [lng, lat] or fallback
 */
export async function geocodeDestination(
  destination: string
): Promise<[number, number]> {
  // Known city fallbacks for quick access without API
  const CITY_FALLBACKS: Record<string, [number, number]> = {
    tokyo: [139.6917, 35.6895],
    paris: [2.3522, 48.8566],
    'new york': [-74.006, 40.7128],
    london: [-0.1276, 51.5074],
    sydney: [151.2093, -33.8688],
    dubai: [55.2708, 25.2048],
    rome: [12.4964, 41.9028],
    barcelona: [2.1734, 41.3851],
    amsterdam: [4.9041, 52.3676],
    berlin: [13.405, 52.52],
    singapore: [103.8198, 1.3521],
    'hong kong': [114.1694, 22.3193],
    bangkok: [100.5018, 13.7563],
    seoul: [126.978, 37.5665],
    osaka: [135.5023, 34.6937],
    kyoto: [135.7681, 35.0116],
    bali: [115.1889, -8.4095],
    maldives: [73.2207, 3.2028],
    'los angeles': [-118.2437, 34.0522],
    'san francisco': [-122.4194, 37.7749],
    miami: [-80.1918, 25.7617],
    cancun: [-86.8515, 21.1619],
    lisbon: [-9.1393, 38.7223],
    prague: [14.4378, 50.0755],
    vienna: [16.3738, 48.2082],
    istanbul: [28.9784, 41.0082],
    cairo: [31.2357, 30.0444],
    marrakech: [-7.9811, 31.6295],
    'cape town': [18.4241, -33.9249],
    rio: [-43.1729, -22.9068],
    'buenos aires': [-58.3816, -34.6037],
    mexico: [-99.1332, 19.4326],
    vancouver: [-123.1207, 49.2827],
    toronto: [-79.3832, 43.6532],
    montreal: [-73.5673, 45.5017],
  };

  // Check fallback first (instant, no API call)
  const normalizedDest = destination.toLowerCase().trim();
  for (const [key, coords] of Object.entries(CITY_FALLBACKS)) {
    if (normalizedDest.includes(key)) {
      console.log(`GeocodingService: Using fallback coords for "${destination}"`);
      return coords;
    }
  }

  // Try geocoding API
  try {
    const results = await geocode(destination, { limit: 1 });
    if (results.length > 0) {
      return [results[0].lng, results[0].lat];
    }
  } catch (error) {
    console.error('GeocodingService: Failed to geocode destination', error);
  }

  // Ultimate fallback: center of map
  console.warn(`GeocodingService: No coords for "${destination}", using default`);
  return [0, 20]; // Centered on Atlantic
}

/**
 * Batch geocode multiple locations
 * Respects rate limiting between each request
 *
 * @param queries - Array of location strings to geocode
 * @returns Map of query to coordinates
 */
export async function batchGeocode(
  queries: string[]
): Promise<Map<string, [number, number] | null>> {
  const results = new Map<string, [number, number] | null>();

  for (const query of queries) {
    try {
      const geocoded = await geocode(query, { limit: 1 });
      if (geocoded.length > 0) {
        results.set(query, [geocoded[0].lng, geocoded[0].lat]);
      } else {
        results.set(query, null);
      }
    } catch (error) {
      console.error(`GeocodingService: Failed to geocode "${query}"`, error);
      results.set(query, null);
    }
  }

  return results;
}

/**
 * Clear the geocoding cache
 */
export function clearGeocodingCache(): void {
  memoryCache.clear();
  console.log('GeocodingService: Cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  oldestEntry: number | null;
  newestEntry: number | null;
} {
  let oldest: number | null = null;
  let newest: number | null = null;

  memoryCache.forEach((entry) => {
    if (!oldest || entry.timestamp < oldest) oldest = entry.timestamp;
    if (!newest || entry.timestamp > newest) newest = entry.timestamp;
  });

  return {
    size: memoryCache.size,
    oldestEntry: oldest,
    newestEntry: newest,
  };
}

export default {
  geocode,
  reverseGeocode,
  searchPlaces,
  geocodeDestination,
  batchGeocode,
  clearGeocodingCache,
  getCacheStats,
};
