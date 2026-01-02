/**
 * Itinerary Mutations with Optimistic Updates
 *
 * Provides granular mutations for trip itinerary operations with
 * instant UI feedback and automatic error rollback.
 *
 * Uses TanStack Query for:
 * - Optimistic UI updates (instant feedback)
 * - Automatic cache invalidation
 * - Error handling with rollback
 * - Background refetching to ensure sync
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Trip, DayPlan, Activity } from '../../types';

// ============================================================================
// MUTATION: Add Phase (Day Plan)
// ============================================================================

interface AddPhaseVariables {
  tripId: string;
  dayPlan: DayPlan;
}

export function useAddPhaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, dayPlan }: AddPhaseVariables) => {
      if (!supabase) throw new Error('Supabase not configured');

      // Insert day plan
      const { error } = await supabase
        .from('day_plans')
        .upsert(
          {
            id: dayPlan.id,
            trip_id: tripId,
            date: dayPlan.date,
          },
          {
            onConflict: 'id',
            ignoreDuplicates: false,
          }
        );

      if (error) throw error;

      return { tripId, dayPlan };
    },

    // Optimistic update: Add phase to UI immediately
    onMutate: async ({ tripId, dayPlan }) => {
      // Cancel outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['trips'] });

      // Snapshot previous value for rollback
      const previousTrips = queryClient.getQueryData<Trip[]>(['trips']);

      // Optimistically update the UI
      queryClient.setQueryData<Trip[]>(['trips'], (old) => {
        if (!old) return old;

        return old.map((trip) =>
          trip.id === tripId
            ? {
                ...trip,
                itinerary: [...trip.itinerary, dayPlan].sort((a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime()
                ),
              }
            : trip
        );
      });

      // Return context with snapshot for rollback
      return { previousTrips };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      console.error('Error adding phase:', err);
      if (context?.previousTrips) {
        queryClient.setQueryData(['trips'], context.previousTrips);
      }
    },

    // Refetch to ensure sync after mutation completes
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

// ============================================================================
// MUTATION: Delete Phase (Day Plan)
// ============================================================================

interface DeletePhaseVariables {
  tripId: string;
  phaseId: string;
}

export function useDeletePhaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phaseId }: DeletePhaseVariables) => {
      if (!supabase) throw new Error('Supabase not configured');

      const { error } = await supabase
        .from('day_plans')
        .delete()
        .eq('id', phaseId);

      if (error) throw error;

      return { phaseId };
    },

    // Optimistic update: Remove phase from UI immediately
    onMutate: async ({ tripId, phaseId }) => {
      await queryClient.cancelQueries({ queryKey: ['trips'] });

      const previousTrips = queryClient.getQueryData<Trip[]>(['trips']);

      queryClient.setQueryData<Trip[]>(['trips'], (old) => {
        if (!old) return old;

        return old.map((trip) =>
          trip.id === tripId
            ? {
                ...trip,
                itinerary: trip.itinerary.filter((day) => day.id !== phaseId),
              }
            : trip
        );
      });

      return { previousTrips };
    },

    onError: (err, variables, context) => {
      console.error('Error deleting phase:', err);
      if (context?.previousTrips) {
        queryClient.setQueryData(['trips'], context.previousTrips);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

// ============================================================================
// MUTATION: Add Activity to Phase
// ============================================================================

interface AddActivityVariables {
  tripId: string;
  dayId: string;
  activity: Activity;
}

export function useAddActivityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dayId, activity }: AddActivityVariables) => {
      if (!supabase) throw new Error('Supabase not configured');

      const { error } = await supabase
        .from('activities')
        .upsert(
          {
            id: activity.id,
            day_plan_id: dayId,
            activity_type: activity.type,
            name: activity.name,
            start_time: activity.startTime,
            end_time: activity.endTime,
            location: activity.location || null,
            notes: activity.notes || null,
            cost: activity.cost || 0,
            icon_name: activity.iconName || null,
          },
          {
            onConflict: 'id',
            ignoreDuplicates: false,
          }
        );

      if (error) throw error;

      return { dayId, activity };
    },

    onMutate: async ({ tripId, dayId, activity }) => {
      await queryClient.cancelQueries({ queryKey: ['trips'] });

      const previousTrips = queryClient.getQueryData<Trip[]>(['trips']);

      queryClient.setQueryData<Trip[]>(['trips'], (old) => {
        if (!old) return old;

        return old.map((trip) =>
          trip.id === tripId
            ? {
                ...trip,
                itinerary: trip.itinerary.map((day) =>
                  day.id === dayId
                    ? { ...day, activities: [...day.activities, activity] }
                    : day
                ),
              }
            : trip
        );
      });

      return { previousTrips };
    },

    onError: (err, variables, context) => {
      console.error('Error adding activity:', err);
      if (context?.previousTrips) {
        queryClient.setQueryData(['trips'], context.previousTrips);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

// ============================================================================
// MUTATION: Delete Activity from Phase
// ============================================================================

interface DeleteActivityVariables {
  tripId: string;
  dayId: string;
  activityId: string;
}

export function useDeleteActivityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ activityId }: DeleteActivityVariables) => {
      if (!supabase) throw new Error('Supabase not configured');

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      return { activityId };
    },

    onMutate: async ({ tripId, dayId, activityId }) => {
      await queryClient.cancelQueries({ queryKey: ['trips'] });

      const previousTrips = queryClient.getQueryData<Trip[]>(['trips']);

      queryClient.setQueryData<Trip[]>(['trips'], (old) => {
        if (!old) return old;

        return old.map((trip) =>
          trip.id === tripId
            ? {
                ...trip,
                itinerary: trip.itinerary.map((day) =>
                  day.id === dayId
                    ? {
                        ...day,
                        activities: day.activities.filter(
                          (a) => a.id !== activityId
                        ),
                      }
                    : day
                ),
              }
            : trip
        );
      });

      return { previousTrips };
    },

    onError: (err, variables, context) => {
      console.error('Error deleting activity:', err);
      if (context?.previousTrips) {
        queryClient.setQueryData(['trips'], context.previousTrips);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

// ============================================================================
// MUTATION: Update Activity
// ============================================================================

interface UpdateActivityVariables {
  tripId: string;
  dayId: string;
  activity: Activity;
}

export function useUpdateActivityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dayId, activity }: UpdateActivityVariables) => {
      if (!supabase) throw new Error('Supabase not configured');

      const { error } = await supabase
        .from('activities')
        .update({
          activity_type: activity.type,
          name: activity.name,
          start_time: activity.startTime,
          end_time: activity.endTime,
          location: activity.location || null,
          notes: activity.notes || null,
          cost: activity.cost || 0,
          icon_name: activity.iconName || null,
        })
        .eq('id', activity.id);

      if (error) throw error;

      return { dayId, activity };
    },

    onMutate: async ({ tripId, dayId, activity }) => {
      await queryClient.cancelQueries({ queryKey: ['trips'] });

      const previousTrips = queryClient.getQueryData<Trip[]>(['trips']);

      queryClient.setQueryData<Trip[]>(['trips'], (old) => {
        if (!old) return old;

        return old.map((trip) =>
          trip.id === tripId
            ? {
                ...trip,
                itinerary: trip.itinerary.map((day) =>
                  day.id === dayId
                    ? {
                        ...day,
                        activities: day.activities.map((a) =>
                          a.id === activity.id ? activity : a
                        ),
                      }
                    : day
                ),
              }
            : trip
        );
      });

      return { previousTrips };
    },

    onError: (err, variables, context) => {
      console.error('Error updating activity:', err);
      if (context?.previousTrips) {
        queryClient.setQueryData(['trips'], context.previousTrips);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}
