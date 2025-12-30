import type { Trip, UserSettings } from '../types';
import type { StoredTrip, SyncQueueItem, SyncOperationType, SyncEntityType } from '../db/schema';
import { getDB, isIndexedDBSupported, closeDB } from '../db/init';

/**
 * Singleton Storage Manager
 *
 * Centralized storage abstraction with IndexedDB primary storage
 * and localStorage fallback for reliability and backward compatibility.
 *
 * Features:
 * - IndexedDB for structured data storage (50MB+)
 * - Automatic fallback to localStorage on IndexedDB errors
 * - One-time migration from localStorage to IndexedDB
 * - Dual-write during migration period for safety
 */
class StorageManager {
  private static instance: StorageManager;
  private migrationCompleted: boolean = false;
  private useIndexedDB: boolean = true;

  private constructor() {
    // Check IndexedDB support
    this.useIndexedDB = isIndexedDBSupported();

    if (!this.useIndexedDB) {
      console.warn('[Storage] IndexedDB not supported, falling back to localStorage');
    }
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // ==================== TRIP OPERATIONS ====================

  /**
   * Get all trips from storage
   */
  async getAllTrips(): Promise<Trip[]> {
    try {
      if (this.useIndexedDB) {
        const db = await getDB();
        const storedTrips = await db.getAll('trips');

        // Convert StoredTrip back to Trip (remove sync metadata)
        return storedTrips.map((st) => this.stripSyncMetadata(st));
      } else {
        return this.getTripsFromLocalStorage();
      }
    } catch (error) {
      console.error('[Storage] Error getting trips from IndexedDB:', error);
      // Fallback to localStorage
      return this.getTripsFromLocalStorage();
    }
  }

  /**
   * Get a single trip by ID
   */
  async getTrip(id: string): Promise<Trip | undefined> {
    try {
      if (this.useIndexedDB) {
        const db = await getDB();
        const storedTrip = await db.get('trips', id);
        return storedTrip ? this.stripSyncMetadata(storedTrip) : undefined;
      } else {
        const trips = this.getTripsFromLocalStorage();
        return trips.find((t) => t.id === id);
      }
    } catch (error) {
      console.error('[Storage] Error getting trip from IndexedDB:', error);
      const trips = this.getTripsFromLocalStorage();
      return trips.find((t) => t.id === id);
    }
  }

  /**
   * Save a trip (create or update)
   */
  async saveTrip(trip: Trip): Promise<void> {
    try {
      if (this.useIndexedDB) {
        const db = await getDB();
        const storedTrip: StoredTrip = {
          ...trip,
          syncStatus: 'pending',
          lastModified: Date.now(),
        };

        await db.put('trips', storedTrip);
        console.log('[Storage] Trip saved to IndexedDB:', trip.id);

        // Dual-write to localStorage during migration period
        this.saveTripToLocalStorage(trip);

        // Add to sync queue
        await this.addToSyncQueue('update', 'trip', trip.id, trip);
      } else {
        this.saveTripToLocalStorage(trip);
      }
    } catch (error) {
      console.error('[Storage] Error saving trip to IndexedDB:', error);
      // Fallback: save only to localStorage
      this.saveTripToLocalStorage(trip);
    }
  }

  /**
   * Delete a trip
   */
  async deleteTrip(id: string): Promise<void> {
    try {
      if (this.useIndexedDB) {
        const db = await getDB();
        await db.delete('trips', id);
        console.log('[Storage] Trip deleted from IndexedDB:', id);

        // Dual-write: delete from localStorage
        this.deleteTripFromLocalStorage(id);

        // Add to sync queue
        await this.addToSyncQueue('delete', 'trip', id, null);
      } else {
        this.deleteTripFromLocalStorage(id);
      }
    } catch (error) {
      console.error('[Storage] Error deleting trip from IndexedDB:', error);
      this.deleteTripFromLocalStorage(id);
    }
  }

  // ==================== SETTINGS OPERATIONS ====================

  /**
   * Get a setting by key
   */
  async getSetting<T = any>(key: string): Promise<T | null> {
    try {
      if (this.useIndexedDB) {
        const db = await getDB();
        const setting = await db.get('settings', key);
        return setting || null;
      } else {
        const value = localStorage.getItem(`setting_${key}`);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      console.error('[Storage] Error getting setting:', error);
      const value = localStorage.getItem(`setting_${key}`);
      return value ? JSON.parse(value) : null;
    }
  }

  /**
   * Save a setting
   */
  async saveSetting(key: string, value: any): Promise<void> {
    try {
      if (this.useIndexedDB) {
        const db = await getDB();
        await db.put('settings', { key, value });

        // Dual-write to localStorage
        localStorage.setItem(`setting_${key}`, JSON.stringify(value));
      } else {
        localStorage.setItem(`setting_${key}`, JSON.stringify(value));
      }
    } catch (error) {
      console.error('[Storage] Error saving setting:', error);
      localStorage.setItem(`setting_${key}`, JSON.stringify(value));
    }
  }

  // ==================== SYNC QUEUE OPERATIONS ====================

  /**
   * Add an operation to the sync queue
   */
  async addToSyncQueue(
    type: SyncOperationType,
    entityType: SyncEntityType,
    entityId: string,
    data: any
  ): Promise<void> {
    try {
      if (this.useIndexedDB) {
        const db = await getDB();
        const queueItem: SyncQueueItem = {
          type,
          entityType,
          entityId,
          data,
          timestamp: Date.now(),
          retryCount: 0,
        };

        await db.add('syncQueue', queueItem);
        console.log('[Storage] Added to sync queue:', type, entityType, entityId);
      }
    } catch (error) {
      console.error('[Storage] Error adding to sync queue:', error);
    }
  }

  /**
   * Get all pending sync operations
   */
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      if (this.useIndexedDB) {
        const db = await getDB();
        return await db.getAll('syncQueue');
      }
      return [];
    } catch (error) {
      console.error('[Storage] Error getting sync queue:', error);
      return [];
    }
  }

  /**
   * Clear the sync queue (after successful sync)
   */
  async clearSyncQueue(): Promise<void> {
    try {
      if (this.useIndexedDB) {
        const db = await getDB();
        await db.clear('syncQueue');
        console.log('[Storage] Sync queue cleared');
      }
    } catch (error) {
      console.error('[Storage] Error clearing sync queue:', error);
    }
  }

  /**
   * Remove a specific item from the sync queue
   */
  async removeSyncQueueItem(id: number): Promise<void> {
    try {
      if (this.useIndexedDB) {
        const db = await getDB();
        await db.delete('syncQueue', id);
      }
    } catch (error) {
      console.error('[Storage] Error removing sync queue item:', error);
    }
  }

  // ==================== MIGRATION ====================

  /**
   * Migrate data from localStorage to IndexedDB
   *
   * This is a one-time operation that runs on first load.
   * It copies all trips and settings from localStorage to IndexedDB.
   */
  async migrateFromLocalStorage(): Promise<void> {
    // Skip if already migrated
    const migrated = await this.getSetting<boolean>('migration_completed');
    if (migrated) {
      console.log('[Storage] Migration already completed');
      this.migrationCompleted = true;
      return;
    }

    try {
      console.log('[Storage] Starting migration from localStorage to IndexedDB...');

      // Migrate trips
      const trips = this.getTripsFromLocalStorage();
      if (trips.length > 0) {
        const db = await getDB();
        const tx = db.transaction('trips', 'readwrite');

        for (const trip of trips) {
          const storedTrip: StoredTrip = {
            ...trip,
            syncStatus: 'synced',
            lastModified: Date.now(),
          };
          await tx.store.put(storedTrip);
        }

        await tx.done;
        console.log(`[Storage] Migrated ${trips.length} trips to IndexedDB`);
      }

      // Migrate settings
      const settingKeys = ['user-settings', 'theme', 'currency'];
      for (const key of settingKeys) {
        const value = localStorage.getItem(`setting_${key}`);
        if (value) {
          await this.saveSetting(key, JSON.parse(value));
        }
      }

      // Mark migration as complete
      await this.saveSetting('migration_completed', true);
      this.migrationCompleted = true;

      console.log('[Storage] Migration completed successfully');
    } catch (error) {
      console.error('[Storage] Migration failed:', error);
      // Don't throw - we can continue with dual storage
    }
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Strip sync metadata from StoredTrip to return a clean Trip object
   */
  private stripSyncMetadata(storedTrip: StoredTrip): Trip {
    const { syncStatus, lastModified, ...trip } = storedTrip;
    return trip;
  }

  /**
   * Get trips from localStorage (fallback method)
   */
  private getTripsFromLocalStorage(): Trip[] {
    try {
      const tripsJson = localStorage.getItem('trips');
      return tripsJson ? JSON.parse(tripsJson) : [];
    } catch (error) {
      console.error('[Storage] Error reading trips from localStorage:', error);
      return [];
    }
  }

  /**
   * Save a single trip to localStorage
   */
  private saveTripToLocalStorage(trip: Trip): void {
    try {
      const trips = this.getTripsFromLocalStorage();
      const index = trips.findIndex((t) => t.id === trip.id);

      if (index !== -1) {
        trips[index] = trip;
      } else {
        trips.push(trip);
      }

      localStorage.setItem('trips', JSON.stringify(trips));
    } catch (error) {
      console.error('[Storage] Error saving trip to localStorage:', error);
    }
  }

  /**
   * Delete a trip from localStorage
   */
  private deleteTripFromLocalStorage(id: string): void {
    try {
      const trips = this.getTripsFromLocalStorage();
      const filtered = trips.filter((t) => t.id !== id);
      localStorage.setItem('trips', JSON.stringify(filtered));
    } catch (error) {
      console.error('[Storage] Error deleting trip from localStorage:', error);
    }
  }

  // ==================== CLEANUP ====================

  /**
   * Close database connection (call on app cleanup)
   */
  async cleanup(): Promise<void> {
    closeDB();
  }
}

// Export singleton instance
export const storage = StorageManager.getInstance();
