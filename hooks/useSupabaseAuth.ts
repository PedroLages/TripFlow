/**
 * Supabase Authentication Hook
 *
 * Provides authentication state and methods for TripFlow.
 * Supports: Magic Link (passwordless), Google OAuth, and Anonymous auth.
 *
 * Usage:
 * ```tsx
 * const { user, loading, signInWithMagicLink, signInWithGoogle, signOut } = useSupabaseAuth();
 *
 * if (loading) return <LoadingSpinner />;
 * if (!user) return <AuthForm />;
 * return <Dashboard />;
 * ```
 */

import { useEffect, useState, useCallback } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseReady } from '../src/lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export interface AuthMethods {
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInAnonymously: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { full_name?: string; avatar_url?: string }) => Promise<{ success: boolean; error?: string }>;
}

export type UseSupabaseAuthReturn = AuthState & AuthMethods & {
  isSupabaseConfigured: boolean;
};

/**
 * Hook for Supabase authentication
 */
export function useSupabaseAuth(): UseSupabaseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const isConfigured = isSupabaseReady();

  useEffect(() => {
    if (!isConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession }, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError);
      } else {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setError(null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  /**
   * Sign in with Magic Link (passwordless email)
   */
  const signInWithMagicLink = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/#/auth/callback`,
      },
    });

    setLoading(false);

    if (signInError) {
      setError(signInError);
      return { success: false, error: signInError.message };
    }

    return { success: true };
  }, []);

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    setError(null);

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/#/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (signInError) {
      setError(signInError);
      return { success: false, error: signInError.message };
    }

    return { success: true };
  }, []);

  /**
   * Sign in anonymously (for trying the app before sign up)
   */
  const signInAnonymously = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInAnonymously();

    setLoading(false);

    if (signInError) {
      setError(signInError);
      return { success: false, error: signInError.message };
    }

    return { success: true };
  }, []);

  /**
   * Sign out
   */
  const signOut = useCallback(async (): Promise<void> => {
    if (!supabase) return;

    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setLoading(false);
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (
    data: { full_name?: string; avatar_url?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  }, [user]);

  return {
    user,
    session,
    loading,
    error,
    isSupabaseConfigured: isConfigured,
    signInWithMagicLink,
    signInWithGoogle,
    signInAnonymously,
    signOut,
    updateProfile,
  };
}

/**
 * Get the current user's profile from the profiles table
 */
export async function getCurrentProfile() {
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return profile;
}
