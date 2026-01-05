/**
 * Shared Supabase Client for Web and Mobile
 *
 * Platform-specific storage is injected at initialization
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  storage?: any; // AsyncStorage for React Native, localStorage for web
}

let supabaseInstance: SupabaseClient | null = null;

/**
 * Initialize the Supabase client
 * Must be called before using getSupabase()
 */
export function initializeSupabase(config: SupabaseConfig): SupabaseClient {
  if (!config.url || !config.anonKey) {
    throw new Error('Supabase URL and anon key are required');
  }

  supabaseInstance = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'tripflow-auth',
      // Use platform-specific storage (AsyncStorage for RN, localStorage for web)
      storage: config.storage,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return supabaseInstance;
}

/**
 * Get the initialized Supabase client
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    throw new Error(
      'Supabase client not initialized. Call initializeSupabase() first.'
    );
  }
  return supabaseInstance;
}

/**
 * Check if Supabase is initialized
 */
export function isSupabaseReady(): boolean {
  return supabaseInstance !== null;
}
