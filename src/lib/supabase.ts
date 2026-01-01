/**
 * Supabase Client Configuration
 *
 * This file initializes the Supabase client for TripFlow.
 *
 * Setup Instructions:
 * 1. Create a project at https://supabase.com
 * 2. Copy your project URL and anon key from Settings > API
 * 3. Create a .env file with:
 *    VITE_SUPABASE_URL=your-project-url
 *    VITE_SUPABASE_ANON_KEY=your-anon-key
 * 4. Run the schema.sql file in the SQL Editor
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create the Supabase client (only if configured)
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Storage key for session persistence
        storageKey: 'tripflow-auth',
      },
      realtime: {
        // Enable realtime for collaborative features
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Check if Supabase is configured and ready to use
 */
export function isSupabaseReady(): boolean {
  return isSupabaseConfigured;
}

/**
 * Get a safe reference to the Supabase client.
 * Throws an error if Supabase is not configured.
 */
export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    );
  }
  return supabase;
}

/**
 * Database type definitions for Supabase
 * These match the schema.sql structure
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          home_location: string | null;
          preferred_currency: string;
          theme: 'light' | 'dark';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      trips: {
        Row: {
          id: string;
          name: string;
          destinations: string[];
          start_date: string;
          end_date: string;
          trip_type: 'Solo' | 'Couple' | 'Family' | 'Friends' | 'Business';
          cover_image: string | null;
          description: string | null;
          budget: number;
          currency: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trips']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['trips']['Insert']>;
      };
      trip_members: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          role: 'Editor' | 'Viewer';
          invited_at: string;
          accepted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['trip_members']['Row'], 'id' | 'invited_at'>;
        Update: Partial<Database['public']['Tables']['trip_members']['Insert']>;
      };
      expenses: {
        Row: {
          id: string;
          trip_id: string;
          amount: number;
          category: 'Flights' | 'Accommodation' | 'Food' | 'Activities' | 'Transport' | 'Shopping' | 'Other';
          date: string;
          notes: string | null;
          currency: string;
          is_split: boolean;
          paid_by: string | null;
          split_method: 'equal' | 'custom' | 'percentage' | 'shares' | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };
      // Add more table definitions as needed
    };
  };
}
