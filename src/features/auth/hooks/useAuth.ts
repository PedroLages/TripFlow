/**
 * useAuth Hook
 *
 * Manages authentication state across the app.
 *
 * Features:
 * - Checks for existing session on mount
 * - Subscribes to auth state changes (login/logout)
 * - Provides user info and loading states
 * - Automatic cleanup on unmount
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
}

/**
 * Hook to access current authentication state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading } = useAuth();
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (!user) return <AuthModal />;
 *
 *   return <div>Welcome, {user.email}</div>;
 * }
 * ```
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

/**
 * Sign out helper
 *
 * @example
 * ```tsx
 * function SignOutButton() {
 *   const handleSignOut = async () => {
 *     await signOut();
 *     // User will be redirected to auth modal automatically
 *   };
 *
 *   return <button onClick={handleSignOut}>Sign Out</button>;
 * }
 * ```
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error);
    throw new Error(error.message);
  }
}
