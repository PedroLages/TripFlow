/**
 * @tripflow/shared - Shared code for TripFlow web and mobile apps
 */

// Types
export * from './types';

// API
export { initializeSupabase, getSupabase, isSupabaseReady } from './api/supabase';
export type { SupabaseConfig } from './api/supabase';
