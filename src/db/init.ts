import { openDB, IDBPDatabase } from 'idb';
import type { TripFlowDB } from './schema';
import { DB_NAME, DB_VERSION } from './schema';

let dbInstance: IDBPDatabase<TripFlowDB> | null = null;

/**
 * Initialize and open the IndexedDB database
 *
 * Creates object stores on first run:
 * - trips: Stores trip data with indexes
 * - settings: Stores user preferences
 * - syncQueue: Stores pending sync operations
 *
 * @returns Promise resolving to the database instance
 */
export async function getDB(): Promise<IDBPDatabase<TripFlowDB>> {
  // Return existing instance if already open
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await openDB<TripFlowDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`[DB] Upgrading database from v${oldVersion} to v${newVersion}`);

        // Version 1: Initial schema
        if (oldVersion < 1) {
          // Create trips object store
          if (!db.objectStoreNames.contains('trips')) {
            const tripsStore = db.createObjectStore('trips', { keyPath: 'id' });

            // Create indexes for efficient queries
            tripsStore.createIndex('by-start-date', 'startDate', { unique: false });
            tripsStore.createIndex('by-sync-status', 'syncStatus', { unique: false });
            tripsStore.createIndex('by-owner', 'ownerEmail', { unique: false });

            console.log('[DB] Created trips object store with indexes');
          }

          // Create syncQueue object store
          if (!db.objectStoreNames.contains('syncQueue')) {
            const syncStore = db.createObjectStore('syncQueue', {
              keyPath: 'id',
              autoIncrement: true,
            });

            // Create indexes for sync processing
            syncStore.createIndex('by-timestamp', 'timestamp', { unique: false });
            syncStore.createIndex('by-entity', 'entityId', { unique: false });

            console.log('[DB] Created syncQueue object store with indexes');
          }
        }

        // Version 2: Add settings object store
        // This fixes the issue where some users had v1 DB without settings store
        if (oldVersion < 2) {
          // Create settings object store if it doesn't exist
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
            console.log('[DB] Created settings object store (v2 upgrade)');
          }
        }
      },
      blocked() {
        console.warn('[DB] Database upgrade blocked by another tab');
      },
      blocking() {
        console.warn('[DB] This tab is blocking database upgrade in another tab');
      },
      terminated() {
        console.error('[DB] Database connection unexpectedly terminated');
        dbInstance = null;
      },
    });

    console.log('[DB] Database opened successfully');
    return dbInstance;
  } catch (error) {
    console.error('[DB] Failed to open database:', error);
    throw new Error('Failed to initialize IndexedDB. Please try clearing your browser data.');
  }
}

/**
 * Close the database connection
 *
 * Should be called when the app is about to close or during cleanup
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('[DB] Database closed');
  }
}

/**
 * Delete the database (for testing or data reset)
 *
 * @returns Promise that resolves when the database is deleted
 */
export async function deleteDB(): Promise<void> {
  try {
    closeDB();
    await openDB(DB_NAME, 1).then((db) => {
      db.close();
    });

    // Delete the database
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

    return new Promise((resolve, reject) => {
      deleteRequest.onsuccess = () => {
        console.log('[DB] Database deleted successfully');
        resolve();
      };

      deleteRequest.onerror = () => {
        console.error('[DB] Failed to delete database');
        reject(new Error('Failed to delete database'));
      };

      deleteRequest.onblocked = () => {
        console.warn('[DB] Database deletion blocked. Please close all tabs.');
        reject(new Error('Database deletion blocked'));
      };
    });
  } catch (error) {
    console.error('[DB] Error during database deletion:', error);
    throw error;
  }
}

/**
 * Check if IndexedDB is supported in the current browser
 *
 * @returns true if IndexedDB is available
 */
export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}
