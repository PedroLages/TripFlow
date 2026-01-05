/**
 * React Query hooks for activities
 *
 * Handles:
 * - Fetching activities for a trip
 * - Creating new activities
 * - Automatic caching and invalidation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { queryKeys } from '@/src/lib/react-query';
import type { Database } from '@/src/shared/types/supabase';

// Type aliases for activity
type Activity = Database['public']['Tables']['activities']['Row'];
type ActivityInsert = Database['public']['Tables']['activities']['Insert'];

/**
 * Fetch all activities for a trip
 *
 * Returns activities sorted by date and time.
 * RLS policies automatically filter to activities the user can access.
 */
async function fetchActivities(tripId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('trip_id', tripId)
    .order('activity_date', { ascending: true })
    .order('activity_time', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching activities:', error);
    throw new Error(`Failed to fetch activities: ${error.message}`);
  }

  return data;
}

/**
 * Hook to fetch activities for a trip
 *
 * @example
 * ```tsx
 * function Itinerary({ tripId }: { tripId: string }) {
 *   const { data: activities, isLoading } = useActivities(tripId);
 *
 *   if (isLoading) return <LoadingSpinner />;
 *
 *   return (
 *     <div>
 *       {activities?.map(activity => (
 *         <ActivityCard key={activity.id} activity={activity} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useActivities(tripId: string) {
  return useQuery({
    queryKey: queryKeys.trips.activities(tripId),
    queryFn: () => fetchActivities(tripId),
    enabled: !!tripId,
  });
}

/**
 * Create a new activity
 *
 * Requires:
 * - trip_id: UUID
 * - name: string
 * - activity_date: string (YYYY-MM-DD)
 * - activity_time: string (HH:MM:SS) - optional
 * - location: string - optional
 * - notes: string - optional
 */
async function createActivity(
  activityData: Pick<
    ActivityInsert,
    'trip_id' | 'name' | 'activity_date' | 'activity_time' | 'location' | 'notes'
  >
): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .insert(activityData)
    .select()
    .single();

  if (error) {
    console.error('Error creating activity:', error);
    throw new Error(`Failed to create activity: ${error.message}`);
  }

  return data;
}

/**
 * Hook to create a new activity
 *
 * Features:
 * - Automatic cache invalidation (refetches activity list)
 * - Loading and error states
 *
 * @example
 * ```tsx
 * const createActivity = useCreateActivity();
 *
 * const handleSubmit = async (formData) => {
 *   try {
 *     const newActivity = await createActivity.mutateAsync({
 *       trip_id: tripId,
 *       name: formData.name,
 *       activity_date: formData.date,
 *       activity_time: formData.time || null,
 *       location: formData.location || null,
 *       notes: formData.notes || null,
 *     });
 *   } catch (error) {
 *     console.error('Failed to create activity:', error);
 *   }
 * };
 * ```
 */
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createActivity,
    onSuccess: (newActivity) => {
      // Invalidate activities list for this trip
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips.activities(newActivity.trip_id),
      });
    },
  });
}
