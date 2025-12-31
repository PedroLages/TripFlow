/**
 * Google Places API Service for TripFlow
 *
 * Provides high-quality place search using Google Places API.
 * Used as an upgrade path from Nominatim for better search accuracy.
 *
 * Features:
 * - Autocomplete suggestions with place predictions
 * - Place details with rich metadata
 * - Session tokens for cost optimization
 * - Fallback to Nominatim when API unavailable
 *
 * Cost Model:
 * - Autocomplete: $2.83 per 1000 requests
 * - Place Details: $17 per 1000 requests (only when selected)
 * - Session tokens bundle autocomplete + details for ~$17 total
 *
 * @see https://developers.google.com/maps/documentation/places/web-service
 */

// Google Places API interfaces
export interface GooglePlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

export interface GooglePlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  website?: string;
  phoneNumber?: string;
  openingHours?: {
    openNow?: boolean;
    weekdayText?: string[];
  };
  photos?: string[];
}

// Search suggestion interface (matches GeocodingService)
export interface PlaceSuggestion {
  placeId: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
  importance: number;
  source: 'google' | 'nominatim';
  rating?: number;
  priceLevel?: number;
}

// Session token for cost optimization
// Google recommends using session tokens to bundle autocomplete + details
let currentSessionToken: string | null = null;
let sessionTokenTimestamp: number = 0;
const SESSION_TOKEN_TTL_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Generate a new session token
 * Session tokens should be refreshed after a place is selected or after 3 minutes
 */
function getSessionToken(): string {
  const now = Date.now();

  if (!currentSessionToken || now - sessionTokenTimestamp > SESSION_TOKEN_TTL_MS) {
    currentSessionToken = crypto.randomUUID();
    sessionTokenTimestamp = now;
  }

  return currentSessionToken;
}

/**
 * Reset session token (call after place selection)
 */
export function resetSessionToken(): void {
  currentSessionToken = null;
  sessionTokenTimestamp = 0;
}

/**
 * Check if Google Places API is available
 */
export function isGooglePlacesAvailable(): boolean {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  return Boolean(apiKey && apiKey.length > 0);
}

/**
 * Get autocomplete suggestions from Google Places API
 *
 * @param query - Search query
 * @param options - Optional parameters
 * @returns Array of place predictions
 */
export async function getAutocompleteSuggestions(
  query: string,
  options: {
    types?: string[]; // e.g., ['establishment', 'geocode']
    location?: { lat: number; lng: number };
    radius?: number; // in meters
    language?: string;
  } = {}
): Promise<GooglePlacePrediction[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.warn('[GooglePlaces] API key not configured, falling back to Nominatim');
    return [];
  }

  if (query.length < 2) {
    return [];
  }

  try {
    const sessionToken = getSessionToken();

    // Build request URL
    const params = new URLSearchParams({
      input: query,
      key: apiKey,
      sessiontoken: sessionToken,
      language: options.language || 'en',
    });

    // Add optional type filter
    if (options.types && options.types.length > 0) {
      params.set('types', options.types.join('|'));
    }

    // Add location bias if provided
    if (options.location) {
      params.set('location', `${options.location.lat},${options.location.lng}`);
      params.set('radius', (options.radius || 50000).toString()); // Default 50km
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[GooglePlaces] API error:', data.status, data.error_message);
      return [];
    }

    // Transform to our format
    return (data.predictions || []).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || '',
      types: p.types || [],
    }));
  } catch (error) {
    console.error('[GooglePlaces] Autocomplete failed:', error);
    return [];
  }
}

/**
 * Get place details from Google Places API
 *
 * @param placeId - Google Place ID
 * @returns Place details or null
 */
export async function getPlaceDetails(
  placeId: string
): Promise<GooglePlaceDetails | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const sessionToken = getSessionToken();

    const params = new URLSearchParams({
      place_id: placeId,
      key: apiKey,
      sessiontoken: sessionToken,
      fields: [
        'place_id',
        'name',
        'formatted_address',
        'geometry',
        'types',
        'rating',
        'user_ratings_total',
        'price_level',
        'website',
        'formatted_phone_number',
        'opening_hours',
        'photos',
      ].join(','),
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('[GooglePlaces] Details error:', data.status);
      return null;
    }

    const result = data.result;

    // Reset session token after successful details fetch
    resetSessionToken();

    return {
      placeId: result.place_id,
      name: result.name,
      formattedAddress: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      types: result.types || [],
      rating: result.rating,
      userRatingsTotal: result.user_ratings_total,
      priceLevel: result.price_level,
      website: result.website,
      phoneNumber: result.formatted_phone_number,
      openingHours: result.opening_hours
        ? {
            openNow: result.opening_hours.open_now,
            weekdayText: result.opening_hours.weekday_text,
          }
        : undefined,
      photos: result.photos
        ? result.photos.slice(0, 5).map((p: any) =>
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photo_reference}&key=${apiKey}`
          )
        : undefined,
    };
  } catch (error) {
    console.error('[GooglePlaces] Details failed:', error);
    return null;
  }
}

/**
 * Search for places and convert to unified format
 * Combines autocomplete + details for a seamless experience
 *
 * @param query - Search query
 * @param options - Search options
 * @returns Array of place suggestions in unified format
 */
export async function searchPlacesGoogle(
  query: string,
  options: {
    limit?: number;
    near?: { lat: number; lng: number };
    types?: string[];
  } = {}
): Promise<PlaceSuggestion[]> {
  const { limit = 6, near, types } = options;

  const predictions = await getAutocompleteSuggestions(query, {
    location: near,
    types,
  });

  if (predictions.length === 0) {
    return [];
  }

  // For efficiency, we don't fetch details for all predictions
  // We only fetch details when the user selects a place
  // Instead, we return predictions with placeholder coordinates
  return predictions.slice(0, limit).map((p, index) => ({
    placeId: p.placeId,
    displayName: p.description,
    lat: 0, // Will be populated when selected
    lng: 0, // Will be populated when selected
    type: p.types[0] || 'place',
    importance: 1 - index * 0.1, // Rank by position
    source: 'google' as const,
  }));
}

/**
 * Resolve a Google Place ID to coordinates
 * Call this when the user selects a place from autocomplete
 *
 * @param placeId - Google Place ID
 * @returns Coordinates [lng, lat] or null
 */
export async function resolveGooglePlaceId(
  placeId: string
): Promise<{ lat: number; lng: number } | null> {
  const details = await getPlaceDetails(placeId);

  if (!details) {
    return null;
  }

  return {
    lat: details.lat,
    lng: details.lng,
  };
}

/**
 * Check if a place ID is a Google Place ID
 */
export function isGooglePlaceId(placeId: string): boolean {
  // Google Place IDs typically start with 'ChIJ' or are longer alphanumeric strings
  return placeId.startsWith('ChIJ') || (placeId.length > 20 && !placeId.includes('-'));
}

export default {
  isGooglePlacesAvailable,
  getAutocompleteSuggestions,
  getPlaceDetails,
  searchPlacesGoogle,
  resolveGooglePlaceId,
  resetSessionToken,
  isGooglePlaceId,
};
