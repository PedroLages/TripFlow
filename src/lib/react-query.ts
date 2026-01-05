/**
 * React Query Configuration for TripFlow V2
 *
 * Centralized data fetching, caching, and state management for Supabase operations.
 * This replaces V1's manual state management and eliminates duplicate database calls.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Query client configuration optimized for mobile-first experience
 *
 * Key decisions:
 * - staleTime: 5 minutes - balance between fresh data and reduced network requests
 * - retry: 1 - fail fast on mobile (poor connections)
 * - refetchOnWindowFocus: false - prevents unnecessary refetches when switching apps
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 5 minutes before being considered stale
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Only retry once on failure (mobile networks can be flaky)
      retry: 1,

      // Don't refetch on window focus (prevents unnecessary requests)
      refetchOnWindowFocus: false,

      // Retry delay increases exponentially: 1s, 2s, 4s...
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Mutations don't retry by default (user-initiated actions)
      retry: false,
    },
  },
});

/**
 * Query keys factory for consistent cache management
 *
 * Benefits:
 * - Centralized key definitions prevent typos
 * - Type-safe query keys
 * - Easy to invalidate related queries
 *
 * @example
 * ```ts
 * // In a hook
 * const { data: trips } = useQuery({
 *   queryKey: queryKeys.trips.all,
 *   queryFn: fetchTrips,
 * });
 *
 * // Invalidate all trip queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
 *
 * // Invalidate specific trip
 * queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId) });
 * ```
 */
export const queryKeys = {
  // Trips
  trips: {
    all: ['trips'] as const,
    lists: () => [...queryKeys.trips.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.trips.lists(), { filters }] as const,
    details: () => [...queryKeys.trips.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.trips.details(), id] as const,
    activities: (tripId: string) => [...queryKeys.activities.all, tripId] as const,
  },

  // Trip members (collaboration)
  tripMembers: {
    all: ['trip-members'] as const,
    byTrip: (tripId: string) => [...queryKeys.tripMembers.all, tripId] as const,
  },

  // Trip invitations
  tripInvitations: {
    all: ['trip-invitations'] as const,
    byTrip: (tripId: string) => [...queryKeys.tripInvitations.all, tripId] as const,
    byToken: (token: string) => [...queryKeys.tripInvitations.all, 'token', token] as const,
  },

  // User profile
  profile: {
    all: ['profile'] as const,
    current: () => [...queryKeys.profile.all, 'current'] as const,
  },

  // Activities (when implemented)
  activities: {
    all: ['activities'] as const,
    byTrip: (tripId: string) => [...queryKeys.activities.all, tripId] as const,
  },

  // Expenses (when implemented)
  expenses: {
    all: ['expenses'] as const,
    byTrip: (tripId: string) => [...queryKeys.expenses.all, tripId] as const,
  },
} as const;

/**
 * Helper to get query client (for use outside React components)
 */
export function getQueryClient() {
  return queryClient;
}
