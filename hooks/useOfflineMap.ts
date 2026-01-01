/**
 * useOfflineMap Hook
 *
 * Manages offline map tile caching for PWA.
 * Communicates with service worker to cache/clear tiles.
 *
 * Features:
 * - Download tiles for a specific area
 * - Progress tracking during download
 * - Cache statistics
 * - Clear cache
 */

import { useState, useEffect, useCallback } from 'react';

// Bounds for tile caching
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Cache progress state
export interface CacheProgress {
  status: 'idle' | 'caching' | 'complete' | 'error';
  totalTiles: number;
  cachedTiles: number;
  failedTiles: number;
  percent: number;
  error?: string;
}

// Cache statistics
export interface CacheStats {
  mapTiles: number;
  mapStyles: number;
  geocoding: number;
  storage: {
    used: number;
    quota: number;
    percent: number;
  } | null;
}

export function useOfflineMap() {
  const [progress, setProgress] = useState<CacheProgress>({
    status: 'idle',
    totalTiles: 0,
    cachedTiles: 0,
    failedTiles: 0,
    percent: 0,
  });

  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // Check if service worker is available
  useEffect(() => {
    setIsSupported('serviceWorker' in navigator && navigator.serviceWorker.controller !== null);
  }, []);

  // Listen for service worker messages
  useEffect(() => {
    if (!isSupported) return;

    const handleMessage = (event: MessageEvent) => {
      const { data } = event;

      switch (data.type) {
        case 'CACHE_TILES_STARTED':
          setProgress({
            status: 'caching',
            totalTiles: data.totalTiles,
            cachedTiles: 0,
            failedTiles: 0,
            percent: 0,
          });
          break;

        case 'CACHE_TILES_PROGRESS':
          setProgress({
            status: 'caching',
            totalTiles: data.total,
            cachedTiles: data.cached,
            failedTiles: data.failed,
            percent: data.percent,
          });
          break;

        case 'CACHE_TILES_COMPLETE':
          setProgress({
            status: 'complete',
            totalTiles: data.total,
            cachedTiles: data.cached,
            failedTiles: data.failed,
            percent: 100,
          });
          break;

        case 'CACHE_TILES_ERROR':
          setProgress((prev) => ({
            ...prev,
            status: 'error',
            error: data.error,
          }));
          break;

        case 'CACHE_STATS':
          setStats({
            mapTiles: data.stats['map-tiles']?.entries || 0,
            mapStyles: data.stats['map-styles']?.entries || 0,
            geocoding: data.stats['geocoding']?.entries || 0,
            storage: data.stats.storage || null,
          });
          break;

        case 'CACHE_CLEARED':
          // Refresh stats after clearing
          fetchCacheStats();
          break;
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [isSupported]);

  /**
   * Download map tiles for a specific area
   */
  const downloadTilesForArea = useCallback(
    async (bounds: MapBounds, minZoom = 10, maxZoom = 14) => {
      if (!isSupported || !navigator.serviceWorker.controller) {
        console.error('Service worker not available');
        setProgress((prev) => ({
          ...prev,
          status: 'error',
          error: 'Offline maps not supported in this browser',
        }));
        return;
      }

      // Calculate approximate tile count to show warning for large areas
      const tileCount = estimateTileCount(bounds, minZoom, maxZoom);
      if (tileCount > 1000) {
        console.warn(`Large download: ~${tileCount} tiles, ~${Math.round(tileCount * 0.05)}MB`);
      }

      setProgress({
        status: 'caching',
        totalTiles: tileCount,
        cachedTiles: 0,
        failedTiles: 0,
        percent: 0,
      });

      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_MAP_TILES',
        payload: { bounds, minZoom, maxZoom },
      });
    },
    [isSupported]
  );

  /**
   * Download tiles for a trip's destination
   */
  const downloadTilesForTrip = useCallback(
    async (center: [number, number], radiusKm = 10) => {
      // Convert radius to approximate lat/lng offset
      // 1 degree latitude ≈ 111km
      const latOffset = radiusKm / 111;
      const lngOffset = radiusKm / (111 * Math.cos((center[1] * Math.PI) / 180));

      const bounds: MapBounds = {
        north: center[1] + latOffset,
        south: center[1] - latOffset,
        east: center[0] + lngOffset,
        west: center[0] - lngOffset,
      };

      await downloadTilesForArea(bounds, 10, 15);
    },
    [downloadTilesForArea]
  );

  /**
   * Fetch cache statistics
   */
  const fetchCacheStats = useCallback(() => {
    if (!isSupported || !navigator.serviceWorker.controller) {
      return;
    }

    navigator.serviceWorker.controller.postMessage({
      type: 'GET_CACHE_STATS',
    });
  }, [isSupported]);

  /**
   * Clear map tile cache
   */
  const clearMapCache = useCallback(() => {
    if (!isSupported || !navigator.serviceWorker.controller) {
      return;
    }

    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_MAP_CACHE',
    });

    setStats((prev) =>
      prev
        ? {
            ...prev,
            mapTiles: 0,
          }
        : null
    );
  }, [isSupported]);

  /**
   * Reset progress state
   */
  const resetProgress = useCallback(() => {
    setProgress({
      status: 'idle',
      totalTiles: 0,
      cachedTiles: 0,
      failedTiles: 0,
      percent: 0,
    });
  }, []);

  // Fetch stats on mount
  useEffect(() => {
    if (isSupported) {
      fetchCacheStats();
    }
  }, [isSupported, fetchCacheStats]);

  return {
    isSupported,
    progress,
    stats,
    downloadTilesForArea,
    downloadTilesForTrip,
    clearMapCache,
    fetchCacheStats,
    resetProgress,
  };
}

/**
 * Estimate tile count for a given area and zoom range
 */
function estimateTileCount(
  bounds: MapBounds,
  minZoom: number,
  maxZoom: number
): number {
  let total = 0;

  for (let z = minZoom; z <= maxZoom; z++) {
    const n = Math.pow(2, z);

    const xMin = Math.floor(((bounds.west + 180) / 360) * n);
    const xMax = Math.floor(((bounds.east + 180) / 360) * n);

    const latRadMin = (bounds.south * Math.PI) / 180;
    const latRadMax = (bounds.north * Math.PI) / 180;

    const yMin = Math.floor(
      ((1 - Math.log(Math.tan(latRadMax) + 1 / Math.cos(latRadMax)) / Math.PI) / 2) * n
    );
    const yMax = Math.floor(
      ((1 - Math.log(Math.tan(latRadMin) + 1 / Math.cos(latRadMin)) / Math.PI) / 2) * n
    );

    const tilesInZoom = (Math.abs(xMax - xMin) + 1) * (Math.abs(yMax - yMin) + 1);
    total += tilesInZoom;
  }

  return total;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default useOfflineMap;
