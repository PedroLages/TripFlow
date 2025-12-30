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
});

// Activate immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  console.log('[SW] Service worker activated and claimed clients');
});

console.log('[SW] TripFlow service worker loaded');
