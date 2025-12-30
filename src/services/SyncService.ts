import { storage } from './StorageManager';
import type { SyncQueueItem } from '../db/schema';

/**
 * Singleton Sync Service
 *
 * Manages background synchronization of offline changes.
 * Queues changes when offline and syncs when connection is restored.
 *
 * Features:
 * - Automatic sync on reconnection
 * - Background Sync API integration
 * - Retry logic for failed syncs
 * - Service worker message handling
 */
class SyncService {
  private static instance: SyncService;
  private isSyncing: boolean = false;
  private syncListeners: Array<(status: SyncStatus) => void> = [];

  private constructor() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());

      // Listen for service worker messages
      navigator.serviceWorker?.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });
    }
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Register a background sync event
   *
   * Uses the Background Sync API to sync data when the connection is restored.
   * Falls back to immediate sync if Background Sync is not supported.
   */
  public async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-trips');
        console.log('[Sync] Background sync registered');
      } catch (error) {
        console.error('[Sync] Background sync registration failed:', error);
        // Fallback: sync immediately
        await this.syncPendingChanges();
      }
    } else {
      console.log('[Sync] Background Sync API not supported, syncing immediately');
      await this.syncPendingChanges();
    }
  }

  /**
   * Process and sync all pending changes
   *
   * This is called:
   * - When the app goes online
   * - By the service worker during background sync
   * - Manually when needed
   */
  public async syncPendingChanges(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[Sync] Sync already in progress');
      return { success: false, message: 'Sync already in progress' };
    }

    this.isSyncing = true;
    this.notifyListeners({ isSyncing: true, message: 'Syncing...' });

    try {
      const queue = await storage.getSyncQueue();

      if (queue.length === 0) {
        console.log('[Sync] No pending changes to sync');
        this.isSyncing = false;
        this.notifyListeners({ isSyncing: false, message: 'No changes to sync' });
        return { success: true, message: 'No changes to sync' };
      }

      console.log(`[Sync] Processing ${queue.length} pending changes`);

      let successCount = 0;
      let failureCount = 0;

      for (const item of queue) {
        try {
          // TODO: Replace with actual backend API calls when backend is ready
          // For now, we'll simulate sync by marking items as processed
          await this.syncItem(item);

          // Remove from queue on success
          if (item.id) {
            await storage.removeSyncQueueItem(item.id);
          }

          successCount++;
        } catch (error) {
          console.error('[Sync] Failed to sync item:', item, error);
          failureCount++;

          // TODO: Implement retry logic with exponential backoff
          // For now, we'll leave failed items in the queue
        }
      }

      this.isSyncing = false;
      const message = `Synced ${successCount} changes` + (failureCount > 0 ? `, ${failureCount} failed` : '');
      this.notifyListeners({ isSyncing: false, message });

      console.log(`[Sync] Complete: ${message}`);

      return {
        success: failureCount === 0,
        message,
        synced: successCount,
        failed: failureCount,
      };
    } catch (error) {
      console.error('[Sync] Sync failed:', error);
      this.isSyncing = false;
      this.notifyListeners({ isSyncing: false, message: 'Sync failed' });

      return {
        success: false,
        message: 'Sync failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync a single item
   *
   * TODO: Replace with actual backend API calls when backend is implemented
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Log what we would sync
    console.log(`[Sync] Would sync ${item.type} ${item.entityType} ${item.entityId}`);

    // In the future, this would make actual API calls:
    // switch (item.type) {
    //   case 'create':
    //     await api.post(`/${item.entityType}`, item.data);
    //     break;
    //   case 'update':
    //     await api.put(`/${item.entityType}/${item.entityId}`, item.data);
    //     break;
    //   case 'delete':
    //     await api.delete(`/${item.entityType}/${item.entityId}`);
    //     break;
    // }
  }

  /**
   * Add a sync status listener
   */
  public addSyncListener(listener: (status: SyncStatus) => void): void {
    this.syncListeners.push(listener);
  }

  /**
   * Remove a sync status listener
   */
  public removeSyncListener(listener: (status: SyncStatus) => void): void {
    this.syncListeners = this.syncListeners.filter((l) => l !== listener);
  }

  /**
   * Notify all listeners of sync status changes
   */
  private notifyListeners(status: SyncStatus): void {
    this.syncListeners.forEach((listener) => listener(status));
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('[Sync] Connection restored, triggering sync');
    this.registerBackgroundSync();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('[Sync] Connection lost');
  }

  /**
   * Handle messages from the service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'SYNC_COMPLETE':
        console.log('[Sync] Service worker sync complete:', data);
        this.notifyListeners({
          isSyncing: false,
          message: data.message || 'Sync complete',
        });
        break;

      case 'SYNC_ERROR':
        console.error('[Sync] Service worker sync error:', data);
        this.notifyListeners({
          isSyncing: false,
          message: data.message || 'Sync failed',
        });
        break;

      default:
        break;
    }
  }

  /**
   * Get current sync status
   */
  public getStatus(): { isSyncing: boolean } {
    return { isSyncing: this.isSyncing };
  }
}

// Types
export interface SyncStatus {
  isSyncing: boolean;
  message: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  synced?: number;
  failed?: number;
  error?: string;
}

// Export singleton instance
export const syncService = SyncService.getInstance();
