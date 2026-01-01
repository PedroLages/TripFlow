/**
 * Route Service for TripFlow
 *
 * Handles route calculation and visualization between activities.
 * - Primary: Uses OpenRouteService API for real road-based routes
 * - Fallback: Uses Haversine formula for straight-line distances
 *
 * Features:
 * - Automatic transport mode inference
 * - Real road routing with turn-by-turn geometry
 * - Route caching for performance
 * - Graceful fallback to straight lines
 */

import type { Activity, DayPlan, RouteSegment, TransportMode } from '../types';
import * as OpenRouteService from './OpenRouteService';

/**
 * Infer transport mode based on distance and activity types
 * Simple heuristics for automatic mode detection
 *
 * @param distance - Distance in meters
 * @param fromActivity - Starting activity
 * @param toActivity - Ending activity
 * @returns Inferred transport mode
 */
export function inferTransportMode(
  distance: number,
  fromActivity: Activity,
  toActivity: Activity
): TransportMode {
  // If either activity is Transportation type, assume transit
  if (
    fromActivity.type === 'Transportation' ||
    toActivity.type === 'Transportation'
  ) {
    return 'transit';
  }

  // Distance-based heuristics
  if (distance < 500) {
    // Very short distance - walking
    return 'walking';
  } else if (distance < 2000) {
    // Short distance - could be walking or cycling
    return 'walking';
  } else if (distance < 10000) {
    // Medium distance - likely driving or transit
    return 'driving';
  } else {
    // Long distance - definitely driving or transit
    return 'driving';
  }
}

/**
 * Day colors matching the MapTab day filter
 */
export const DAY_COLORS = [
  '#3B82F6', // Day 1 - Blue
  '#10B981', // Day 2 - Green
  '#F59E0B', // Day 3 - Amber
  '#EF4444', // Day 4 - Red
  '#8B5CF6', // Day 5 - Purple
  '#EC4899', // Day 6 - Pink
  '#14B8A6', // Day 7 - Teal
];

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 *
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in meters
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Format distance for display
 *
 * @param meters - Distance in meters
 * @returns Formatted string (e.g., "2.3 km" or "450 m")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Estimate walking time for a distance
 * Assumes average walking speed of 5 km/h
 *
 * @param meters - Distance in meters
 * @returns Formatted time string (e.g., "5 min" or "1h 15min")
 */
export function estimateWalkingTime(meters: number): string {
  const walkingSpeedKmh = 5; // Average walking speed
  const hours = meters / 1000 / walkingSpeedKmh;
  const minutes = Math.round(hours * 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/**
 * Create a GeoJSON LineString geometry
 *
 * @param from - Start coordinates [lat, lng]
 * @param to - End coordinates [lat, lng]
 * @returns GeoJSON LineString
 */
function createLineString(
  from: [number, number],
  to: [number, number]
): GeoJSON.LineString {
  return {
    type: 'LineString',
    coordinates: [
      [from[1], from[0]], // MapLibre uses [lng, lat]
      [to[1], to[0]],
    ],
  };
}

/**
 * Generate route segments for a trip's itinerary
 *
 * @param itinerary - Array of day plans
 * @param geocodedActivities - Map of activity ID to [lat, lng] coordinates
 * @param options - Optional configuration
 * @returns Array of route segments
 */
export async function generateRouteSegments(
  itinerary: DayPlan[],
  geocodedActivities: Map<string, [number, number]>,
  options: {
    useRealRoutes?: boolean; // Use OpenRouteService for real road routes
    onProgress?: (current: number, total: number) => void; // Progress callback
  } = {}
): Promise<RouteSegment[]> {
  const { useRealRoutes = true, onProgress } = options;
  const segments: RouteSegment[] = [];

  // Collect all route requests first
  const routeRequests: Array<{
    fromActivity: Activity;
    toActivity: Activity;
    fromCoords: [number, number];
    toCoords: [number, number];
    dayNumber: number;
    distance: number;
    mode: TransportMode;
  }> = [];

  itinerary.forEach((day, dayIndex) => {
    const dayNumber = dayIndex + 1;
    const activities = day.activities;

    // Create segments between consecutive activities in the same day
    for (let i = 0; i < activities.length - 1; i++) {
      const fromActivity = activities[i];
      const toActivity = activities[i + 1];

      // Get coordinates for both activities
      const fromCoords = geocodedActivities.get(fromActivity.id);
      const toCoords = geocodedActivities.get(toActivity.id);

      // Skip if either activity doesn't have coordinates
      if (!fromCoords || !toCoords) {
        continue;
      }

      // Calculate straight-line distance
      const distance = haversineDistance(
        fromCoords[0],
        fromCoords[1],
        toCoords[0],
        toCoords[1]
      );

      // Infer transport mode based on distance and activity types
      const mode = inferTransportMode(distance, fromActivity, toActivity);

      routeRequests.push({
        fromActivity,
        toActivity,
        fromCoords,
        toCoords,
        dayNumber,
        distance,
        mode,
      });
    }
  });

  // Process each route request
  for (let i = 0; i < routeRequests.length; i++) {
    const request = routeRequests[i];

    // Report progress
    if (onProgress) {
      onProgress(i + 1, routeRequests.length);
    }

    let geometry: GeoJSON.LineString;
    let actualDistance = request.distance;
    let duration: number | undefined;

    // Try to get real route from OpenRouteService
    if (useRealRoutes) {
      try {
        const orsRoute = await OpenRouteService.getRoute(
          request.fromCoords,
          request.toCoords,
          request.mode
        );

        if (orsRoute) {
          geometry = orsRoute.geometry;
          actualDistance = orsRoute.distance;
          duration = orsRoute.duration;
        } else {
          // Fallback to straight line
          geometry = createLineString(request.fromCoords, request.toCoords);
        }
      } catch (error) {
        console.warn('RouteService: ORS failed, using straight line', error);
        geometry = createLineString(request.fromCoords, request.toCoords);
      }
    } else {
      // Use straight line
      geometry = createLineString(request.fromCoords, request.toCoords);
    }

    // Create route segment
    segments.push({
      id: `${request.fromActivity.id}-${request.toActivity.id}`,
      fromActivity: request.fromActivity,
      toActivity: request.toActivity,
      fromCoords: request.fromCoords,
      toCoords: request.toCoords,
      day: request.dayNumber,
      distance: actualDistance,
      geometry,
      mode: request.mode,
      duration,
    });
  }

  return segments;
}

/**
 * Get color for a specific day
 *
 * @param dayNumber - Day number (1-indexed)
 * @returns Hex color code
 */
export function getDayColor(dayNumber: number): string {
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
}

/**
 * Create GeoJSON FeatureCollection for routes
 * Used for MapLibre data source
 *
 * @param segments - Array of route segments
 * @param filterDay - Optional day filter (1-indexed, null for all days)
 * @returns GeoJSON FeatureCollection
 */
export function createRoutesGeoJSON(
  segments: RouteSegment[],
  filterDay: number | null = null
): GeoJSON.FeatureCollection {
  const filteredSegments =
    filterDay === null
      ? segments
      : segments.filter((seg) => seg.day === filterDay);

  return {
    type: 'FeatureCollection',
    features: filteredSegments.map((segment) => ({
      type: 'Feature',
      id: segment.id,
      geometry: segment.geometry,
      properties: {
        id: segment.id,
        day: segment.day,
        distance: segment.distance,
        distanceText: formatDistance(segment.distance),
        walkingTime: estimateWalkingTime(segment.distance),
        fromName: segment.fromActivity.name,
        toName: segment.toActivity.name,
        color: getDayColor(segment.day),
        mode: segment.mode,
      },
    })),
  };
}

export default {
  haversineDistance,
  formatDistance,
  estimateWalkingTime,
  generateRouteSegments,
  getDayColor,
  createRoutesGeoJSON,
  DAY_COLORS,
};
