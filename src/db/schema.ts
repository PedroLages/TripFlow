import type { DBSchema } from 'idb';
import type { Trip, UserSettings } from '../types';

/**
 * Sync status for entities in the database
 */
export type SyncStatus = 'synced' | 'pending' | 'failed';

/**
 * Trip entity with sync metadata
 */
export interface StoredTrip extends Trip {
  syncStatus: SyncStatus;
  lastModified: number; // Unix timestamp
}

/**
 * Sync operation types
 */
export type SyncOperationType = 'create' | 'update' | 'delete';

/**
 * Entity types that can be synced
 */
export type SyncEntityType = 'trip' | 'expense' | 'activity' | 'document';

/**
 * Sync queue item for background synchronization
 */
export interface SyncQueueItem {
  id?: number; // Auto-incremented key
  type: SyncOperationType;
  entityType: SyncEntityType;
  entityId: string;
  data: any; // The entity data to sync
  timestamp: number; // Unix timestamp
  retryCount: number;
}

/**
 * IndexedDB schema for TripFlow
 *
 * Stores:
 * - trips: User's trips with sync status
 * - settings: User preferences and configuration
 * - syncQueue: Pending changes to sync when online
 */
export interface TripFlowDB extends DBSchema {
  // Trips object store
  trips: {
    key: string; // Trip ID
    value: StoredTrip;
    indexes: {
      'by-start-date': string; // Index by startDate for sorting
      'by-sync-status': SyncStatus; // Index by syncStatus for finding pending syncs
      'by-owner': string; // Index by ownerEmail for filtering
    };
  };

  // Settings object store
  settings: {
    key: string; // Setting key (e.g., 'user-preferences', 'theme', 'currency')
    value: any; // Setting value (flexible schema)
  };

  // Sync queue object store
  syncQueue: {
    key: number; // Auto-incremented ID
    value: SyncQueueItem;
    indexes: {
      'by-timestamp': number; // Index by timestamp for FIFO processing
      'by-entity': string; // Index by entityId to find related operations
    };
  };
}

/**
 * Database name and version
 */
export const DB_NAME = 'TripFlowDB';
export const DB_VERSION = 1;

/**
 * Default sync queue retry settings
 */
export const SYNC_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds
} as const;
