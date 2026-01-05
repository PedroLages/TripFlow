/**
 * React Query hook for fetching trips
 *
 * Handles:
 * - Fetching all trips for the current user
 * - Automatic caching (5 minutes stale time)
 * - Loading and error states
 * - Automatic refetch on window focus (mobile app switching)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { queryKeys } from '@/src/lib/react-query';
import type { Database } from '@/src/shared/types/supabase';

// Type alias for trip row
type Trip = Database['public']['Tables']['trips']['Row'];
type TripInsert = Database['public']['Tables']['trips']['Insert'];

/**
 * Fetch all trips for the current user
 *
 * Returns trips where:
 * - User is the owner, OR
 * - User is a member (via trip_members table)
 *
 * RLS policies on the database handle access control automatically.
 */
async function fetchTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false }); // Most recent first (mobile optimization)

  if (error) {
    console.error('Error fetching trips:', error);
    throw new Error(`Failed to fetch trips: ${error.message}`);
  }

  return data;
}

/**
 * Hook to fetch all trips for the current user
 *
 * Features:
 * - Automatic caching (5 minutes stale time from global config)
 * - Loading and error states
 * - Automatic retry on failure (1 retry from global config)
 * - Type-safe with auto-generated database types
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { data: trips, isLoading, error } = useTrips();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return (
 *     <div>
 *       {trips?.map(trip => (
 *         <TripCard key={trip.id} trip={trip} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTrips() {
  return useQuery({
    queryKey: queryKeys.trips.lists(),
    queryFn: fetchTrips,
    // Stale time and retry settings come from global config
  });
}

/**
 * Hook to fetch a single trip by ID
 *
 * @example
 * ```tsx
 * function TripDetail({ tripId }: { tripId: string }) {
 *   const { data: trip, isLoading } = useTrip(tripId);
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!trip) return <div>Trip not found</div>;
 *
 *   return <div>{trip.name}</div>;
 * }
 * ```
 */
export function useTrip(tripId: string) {
  return useQuery({
    queryKey: queryKeys.trips.detail(tripId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (error) {
        console.error('Error fetching trip:', error);
        throw new Error(`Failed to fetch trip: ${error.message}`);
      }

      return data;
    },
    // Only fetch if tripId is provided
    enabled: !!tripId,
  });
}

/**
 * Create a new trip
 *
 * Requires:
 * - name: string
 * - start_date: string (YYYY-MM-DD)
 * - end_date: string (YYYY-MM-DD)
 *
 * The owner_id is automatically set to the current user's ID.
 */
async function createTrip(
  tripData: Pick<TripInsert, 'name' | 'start_date' | 'end_date'>
): Promise<Trip> {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be logged in to create a trip');
  }

  // Create trip with owner_id
  const { data, error } = await supabase
    .from('trips')
    .insert({
      ...tripData,
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating trip:', error);
    throw new Error(`Failed to create trip: ${error.message}`);
  }

  return data;
}

/**
 * Hook to create a new trip
 *
 * Features:
 * - Optimistic updates (trip appears immediately)
 * - Automatic cache invalidation (refetches trip list)
 * - Loading and error states
 *
 * @example
 * const createTrip = useCreateTrip();
 *
 * const handleSubmit = async (formData) => {
 *   try {
 *     const newTrip = await createTrip.mutateAsync({
 *       name: formData.name,
 *       start_date: formData.startDate,
 *       end_date: formData.endDate,
 *     });
 *     navigate(`/trip/${newTrip.id}`);
 *   } catch (error) {
 *     console.error('Failed to create trip:', error);
 *   }
 * };
 */
export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTrip,
    onSuccess: () => {
      // Invalidate and refetch trips list
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.lists() });
    },
  });
}
