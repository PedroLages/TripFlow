import { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import type { UserSettings } from '../types';
import type { User } from '@supabase/supabase-js';

/**
 * Custom hook to manage user settings with Supabase synchronization
 *
 * Features:
 * - Fetches user profile from Supabase profiles table
 * - Automatically imports Google OAuth avatar
 * - Syncs theme and all preferences across devices
 * - Real-time updates when profile changes
 * - Persists to database instead of localStorage
 */
export function useSupabaseSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user settings from Supabase
  const fetchSettings = async (user: User) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // If profile doesn't exist yet, create it with Google OAuth data
        if (profileError.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
              avatar_url: user.user_metadata?.avatar_url || null,
              theme: 'light',
              preferred_currency: 'USD',
              home_location: '',
            })
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }

          // Map new profile to settings
          setSettings({
            name: newProfile.full_name || '',
            email: newProfile.email,
            avatar: newProfile.avatar_url || undefined,
            homeLocation: newProfile.home_location || '',
            currency: newProfile.preferred_currency || 'USD',
            theme: (newProfile.theme as 'light' | 'dark') || 'light',
            sidebarCollapsed: newProfile.sidebar_collapsed || false,
          });
        } else {
          throw profileError;
        }
      } else {
        // Map existing profile to settings
        setSettings({
          name: profile.full_name || '',
          email: profile.email,
          avatar: profile.avatar_url || undefined,
          homeLocation: profile.home_location || '',
          currency: profile.preferred_currency || 'USD',
          theme: (profile.theme as 'light' | 'dark') || 'light',
          sidebarCollapsed: profile.sidebar_collapsed || false,
        });
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Update user settings in Supabase
  const updateSettings = async (updates: Partial<UserSettings>): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Map UserSettings fields to database columns
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.full_name = updates.name;
      if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
      if (updates.homeLocation !== undefined) dbUpdates.home_location = updates.homeLocation;
      if (updates.currency !== undefined) dbUpdates.preferred_currency = updates.currency;
      if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
      if (updates.sidebarCollapsed !== undefined) dbUpdates.sidebar_collapsed = updates.sidebarCollapsed;

      // Update in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Update local state immediately for instant UI feedback
      setSettings(prev => prev ? { ...prev, ...updates } : null);

      return { success: true };
    } catch (err: any) {
      console.error('Error updating settings:', err);
      return { success: false, error: err.message || 'Failed to update settings' };
    }
  };

  // Subscribe to auth state changes and profile updates
  useEffect(() => {
    // Check current auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetchSettings(user);
      } else {
        setSettings(null);
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          fetchSettings(session.user);
        } else if (event === 'SIGNED_OUT') {
          setSettings(null);
          setLoading(false);
        } else if (event === 'USER_UPDATED' && session?.user) {
          // Google avatar might have been updated
          fetchSettings(session.user);
        }
      }
    );

    // Listen for profile changes (real-time sync across devices)
    let profileSubscription: any = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        profileSubscription = supabase
          .channel('profile-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`,
            },
            (payload) => {
              // Update local state when profile changes (from another device/tab)
              const updatedProfile = payload.new;
              setSettings({
                name: updatedProfile.full_name || '',
                email: updatedProfile.email,
                avatar: updatedProfile.avatar_url || undefined,
                homeLocation: updatedProfile.home_location || '',
                currency: updatedProfile.preferred_currency || 'USD',
                theme: (updatedProfile.theme as 'light' | 'dark') || 'light',
                sidebarCollapsed: updatedProfile.sidebar_collapsed || false,
              });
            }
          )
          .subscribe();
      }
    });

    // Cleanup subscriptions
    return () => {
      authSubscription.unsubscribe();
      if (profileSubscription) {
        profileSubscription.unsubscribe();
      }
    };
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
  };
}
