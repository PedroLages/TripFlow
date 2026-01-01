import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { openDB } from 'idb';

// Precache all static assets (injected by Workbox during build)
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache Strategies

// App Shell - Cache First (JS, CSS)
registerRoute(
  ({ request, url }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.match(/\.(js|css)$/),
  new CacheFirst({
    cacheName: 'app-shell',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  })
);

// Static Assets - Cache First (images)
registerRoute(
  ({ request, url }) =>
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/),
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// Gemini API - Network First with cache fallback
registerRoute(
  ({ url }) => url.hostname === 'generativelanguage.googleapis.com',
  new NetworkFirst({
    cacheName: 'gemini-api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
    networkTimeoutSeconds: 10,
  })
);

// Map Tiles - Cache First (Carto, MapTiler, Stadia, ArcGIS, OSM, EOX, RainViewer)
// These rarely change and can be cached aggressively
const TILE_PROVIDERS = [
  // Carto basemaps (free, no API key)
  'basemaps.cartocdn.com',
  'cartodb-basemaps-a.global.ssl.fastly.net',
  'cartodb-basemaps-b.global.ssl.fastly.net',
  'cartodb-basemaps-c.global.ssl.fastly.net',
  // Other tile providers
  'api.maptiler.com',
  'tiles.stadiamaps.com',
  'server.arcgisonline.com',
  // OpenStreetMap
  'a.tile.openstreetmap.org',
  'b.tile.openstreetmap.org',
  'c.tile.openstreetmap.org',
  // EOX Sentinel-2 Satellite (free, no API key)
  'tiles.maps.eox.at',
  // RainViewer Weather Radar (free for personal use)
  'tilecache.rainviewer.com',
];

registerRoute(
  ({ url }) => TILE_PROVIDERS.some(provider => url.hostname.includes(provider)),
  new CacheFirst({
    cacheName: 'map-tiles',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 2000, // ~50-100MB for typical area
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        purgeOnQuotaError: true, // Free up space if quota exceeded
      }),
    ],
  })
);

// Map Style JSON - Cache First with shorter TTL
registerRoute(
  ({ url }) =>
    url.pathname.endsWith('style.json') ||
    url.pathname.includes('/styles/'),
  new CacheFirst({
    cacheName: 'map-styles',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
  })
);

// Nominatim Geocoding - Network First (results should be fresh but cache for offline)
registerRoute(
  ({ url }) => url.hostname === 'nominatim.openstreetmap.org',
  new NetworkFirst({
    cacheName: 'geocoding',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
    networkTimeoutSeconds: 5,
  })
);

// Exchange Rate API - Network First (currency rates should be fresh)
registerRoute(
  ({ url }) => url.hostname === 'open.exchangerate-api.com',
  new NetworkFirst({
    cacheName: 'exchange-rates',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
    networkTimeoutSeconds: 5,
  })
);

// RainViewer Weather API - Network First (weather data should be fresh, cached for offline)
registerRoute(
  ({ url }) => url.hostname === 'api.rainviewer.com',
  new NetworkFirst({
    cacheName: 'weather-api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 5,
        maxAgeSeconds: 60 * 10, // 10 minutes (weather data updates frequently)
      }),
    ],
    networkTimeoutSeconds: 5,
  })
);

// Background Sync Event Handler
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event triggered:', event.tag);

  if (event.tag === 'sync-trips') {
    event.waitUntil(syncPendingChanges());
  }
});

/**
 * Process pending sync queue
 *
 * Opens IndexedDB, retrieves all pending sync items,
 * processes them, and clears successful items from the queue.
 */
async function syncPendingChanges() {
  try {
    console.log('[SW] Starting sync process...');

    // Open IndexedDB
    const db = await openDB('tripflow-db', 1);

    // Get all pending sync items
    const syncQueue = await db.getAll('syncQueue');
    console.log(`[SW] Found ${syncQueue.length} items to sync`);

    if (syncQueue.length === 0) {
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    // Process each sync item
    for (const item of syncQueue) {
      try {
        // In the future, this will call backend API
        // For now, we just mark as processed
        console.log('[SW] Processing sync item:', item.entityType, item.entityId);

        // TODO: Call backend API based on item.type (create/update/delete)
        // await fetch('/api/trips', {
        //   method: item.type === 'delete' ? 'DELETE' : 'POST',
        //   body: JSON.stringify(item.data),
        // });

        // Remove from sync queue on success
        if (item.id) {
          await db.delete('syncQueue', item.id);
          successCount++;
        }
      } catch (error) {
        console.error('[SW] Failed to sync item:', error);
        failureCount++;

        // Update retry count
        if (item.id && item.retryCount !== undefined) {
          item.retryCount++;
          await db.put('syncQueue', item);
        }
      }
    }

    // Notify all clients about sync completion
    const clients = await self.clients.matchAll();
    const message = {
      type: 'SYNC_COMPLETE',
      success: failureCount === 0,
      synced: successCount,
      failed: failureCount,
      message: failureCount === 0
        ? `Successfully synced ${successCount} change${successCount !== 1 ? 's' : ''}`
        : `Synced ${successCount}, failed ${failureCount}`,
    };

    clients.forEach((client) => {
      client.postMessage(message);
    });

    console.log('[SW] Sync complete:', message);
  } catch (error) {
    console.error('[SW] Sync process failed:', error);

    // Notify clients about sync failure
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_ERROR',
        error: error.message,
      });
    });
  }
}

// Message Handler (for manual sync requests from app)
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'SYNC_NOW') {
    event.waitUntil(syncPendingChanges());
  }

  if (event.data && event.data.type === 'CACHE_MAP_TILES') {
    event.waitUntil(cacheMapTiles(event.data.payload, event.source));
  }

  if (event.data && event.data.type === 'GET_CACHE_STATS') {
    event.waitUntil(getCacheStats(event.source));
  }

  if (event.data && event.data.type === 'CLEAR_MAP_CACHE') {
    event.waitUntil(clearMapCache(event.source));
  }
});

/**
 * Pre-cache map tiles for a specific area
 *
 * @param {Object} payload - Contains bounds, zoom levels, and tile style URL
 * @param {Client} client - The client to send progress updates to
 */
async function cacheMapTiles(payload, client) {
  const { bounds, minZoom = 10, maxZoom = 15, styleUrl } = payload;

  if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
    client?.postMessage({
      type: 'CACHE_TILES_ERROR',
      error: 'Invalid bounds provided',
    });
    return;
  }

  console.log('[SW] Starting tile cache for bounds:', bounds, 'zoom:', minZoom, '-', maxZoom);

  const cache = await caches.open('map-tiles');
  let cachedCount = 0;
  let failedCount = 0;
  let totalTiles = 0;

  // Calculate total tiles first
  for (let z = minZoom; z <= maxZoom; z++) {
    const minTile = latLngToTile(bounds.south, bounds.west, z);
    const maxTile = latLngToTile(bounds.north, bounds.east, z);
    const tilesInZoom = (Math.abs(maxTile.x - minTile.x) + 1) * (Math.abs(maxTile.y - minTile.y) + 1);
    totalTiles += tilesInZoom;
  }

  console.log('[SW] Total tiles to cache:', totalTiles);

  client?.postMessage({
    type: 'CACHE_TILES_STARTED',
    totalTiles,
  });

  // Cache tiles for each zoom level
  for (let z = minZoom; z <= maxZoom; z++) {
    const minTile = latLngToTile(bounds.south, bounds.west, z);
    const maxTile = latLngToTile(bounds.north, bounds.east, z);

    for (let x = Math.min(minTile.x, maxTile.x); x <= Math.max(minTile.x, maxTile.x); x++) {
      for (let y = Math.min(minTile.y, maxTile.y); y <= Math.max(minTile.y, maxTile.y); y++) {
        try {
          // OpenStreetMap tile URL format
          const tileUrl = `https://a.tile.openstreetmap.org/${z}/${x}/${y}.png`;

          // Check if already cached
          const cached = await cache.match(tileUrl);
          if (!cached) {
            const response = await fetch(tileUrl);
            if (response.ok) {
              await cache.put(tileUrl, response);
              cachedCount++;
            } else {
              failedCount++;
            }
          } else {
            cachedCount++;
          }

          // Send progress update every 10 tiles
          if ((cachedCount + failedCount) % 10 === 0) {
            client?.postMessage({
              type: 'CACHE_TILES_PROGRESS',
              cached: cachedCount,
              failed: failedCount,
              total: totalTiles,
              percent: Math.round(((cachedCount + failedCount) / totalTiles) * 100),
            });
          }
        } catch (error) {
          console.warn('[SW] Failed to cache tile:', error);
          failedCount++;
        }
      }
    }
  }

  console.log('[SW] Tile caching complete:', cachedCount, 'cached,', failedCount, 'failed');

  client?.postMessage({
    type: 'CACHE_TILES_COMPLETE',
    cached: cachedCount,
    failed: failedCount,
    total: totalTiles,
  });
}

/**
 * Convert lat/lng to tile coordinates
 */
function latLngToTile(lat, lng, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

/**
 * Get cache statistics
 */
async function getCacheStats(client) {
  try {
    const cacheNames = ['map-tiles', 'map-styles', 'geocoding', 'app-shell', 'static-assets'];
    const stats = {};
    let totalSize = 0;

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      stats[name] = {
        entries: keys.length,
      };
    }

    // Estimate storage usage
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      stats.storage = {
        used: estimate.usage,
        quota: estimate.quota,
        percent: Math.round((estimate.usage / estimate.quota) * 100),
      };
    }

    client?.postMessage({
      type: 'CACHE_STATS',
      stats,
    });
  } catch (error) {
    console.error('[SW] Failed to get cache stats:', error);
    client?.postMessage({
      type: 'CACHE_STATS_ERROR',
      error: error.message,
    });
  }
}

/**
 * Clear map tile cache
 */
async function clearMapCache(client) {
  try {
    const deleted = await caches.delete('map-tiles');
    console.log('[SW] Map tiles cache cleared:', deleted);

    client?.postMessage({
      type: 'CACHE_CLEARED',
      cache: 'map-tiles',
      success: deleted,
    });
  } catch (error) {
    console.error('[SW] Failed to clear map cache:', error);
    client?.postMessage({
      type: 'CACHE_CLEAR_ERROR',
      error: error.message,
    });
  }
}

// Activate immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  console.log('[SW] Service worker activated and claimed clients');
});

console.log('[SW] TripFlow service worker loaded');
