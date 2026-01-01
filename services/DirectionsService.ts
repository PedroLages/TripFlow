/**
 * Directions Service for TripFlow
 *
 * Provides real road-based routing using OpenRouteService API.
 * Falls back to Haversine straight-line distance if API is unavailable.
 *
 * API: OpenRouteService (free tier: 2000 requests/day)
 * @see https://openrouteservice.org/dev/#/api-docs
 */

export type TransportMode = 'foot-walking' | 'cycling-regular' | 'driving-car';

export interface DirectionsResult {
  distance: number; // meters
  duration: number; // seconds
  geometry: GeoJSON.LineString;
  source: 'openroute' | 'haversine';
}

/**
 * Check if OpenRouteService API is available
 */
export function isOpenRouteServiceAvailable(): boolean {
  const apiKey = import.meta.env.VITE_OPENROUTE_API_KEY;
  return Boolean(apiKey && apiKey.length > 0);
}

/**
 * Get directions between two points using OpenRouteService
 *
 * @param start - Start coordinates [lat, lng]
 * @param end - End coordinates [lat, lng]
 * @param mode - Transport mode (default: foot-walking)
 * @returns Directions result with distance, duration, and geometry
 */
export async function getDirections(
  start: [number, number],
  end: [number, number],
  mode: TransportMode = 'foot-walking'
): Promise<DirectionsResult | null> {
  const apiKey = import.meta.env.VITE_OPENROUTE_API_KEY;

  if (!apiKey) {
    console.warn('[DirectionsService] API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/${mode}`,
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [
            [start[1], start[0]], // OpenRouteService uses [lng, lat]
            [end[1], end[0]],
          ],
          format: 'geojson',
        }),
      }
    );

    if (!response.ok) {
      console.error(`[DirectionsService] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.error('[DirectionsService] No route found');
      return null;
    }

    const route = data.features[0];

    return {
      distance: route.properties.summary.distance, // meters
      duration: route.properties.summary.duration, // seconds
      geometry: route.geometry, // GeoJSON LineString
      source: 'openroute',
    };
  } catch (error) {
    console.error('[DirectionsService] Failed to fetch directions:', error);
    return null;
  }
}

/**
 * Batch directions request for multiple segments
 * Implements rate limiting to respect API quotas
 *
 * @param segments - Array of [start, end] coordinate pairs
 * @param mode - Transport mode
 * @param delayMs - Delay between requests (default: 500ms for 2 req/sec)
 * @returns Array of directions results
 */
export async function batchDirections(
  segments: Array<{ start: [number, number]; end: [number, number] }>,
  mode: TransportMode = 'foot-walking',
  delayMs: number = 500
): Promise<Array<DirectionsResult | null>> {
  const results: Array<DirectionsResult | null> = [];

  for (let i = 0; i < segments.length; i++) {
    const { start, end } = segments[i];
    const result = await getDirections(start, end, mode);
    results.push(result);

    // Rate limiting: wait between requests (except for last one)
    if (i < segments.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

export default {
  isOpenRouteServiceAvailable,
  getDirections,
  batchDirections,
};
