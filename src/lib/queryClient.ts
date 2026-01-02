/**
 * TanStack Query Client Configuration
 *
 * Provides centralized query client with optimized settings for TripFlow.
 *
 * Key configurations:
 * - staleTime: 60s (data considered fresh for 1 minute)
 * - cacheTime: 5 minutes (unused data kept in cache)
 * - refetchOnWindowFocus: true (sync when user returns to tab)
 * - retry: 3 attempts with exponential backoff
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Consider data fresh for 60 seconds
      staleTime: 60 * 1000,

      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,

      // Refetch when user focuses window (helps with collaboration)
      refetchOnWindowFocus: true,

      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once before giving up
      retry: 1,
      retryDelay: 1000,
    },
  },
});
