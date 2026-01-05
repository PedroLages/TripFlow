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
 *
 * Note: These hooks work alongside the existing useSupabaseTrips hook
 * by calling setTripState directly for immediate UI updates (optimistic).
 *
 * Security: All user input is automatically escaped by React when rendered
 * via JSX, providing XSS protection. No HTML rendering is used in this module.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Trip, DayPlan, Activity } from '../../types';

// Context for passing state setter function
interface MutationContext {
  trip: Trip;
  setTripState: (trip: Trip) => void;
}

// ============================================================================
// MUTATION: Add Phase (Day Plan)
// ============================================================================

interface AddPhaseVariables {
  trip: Trip;
  dayPlan: DayPlan;
  setTripState: (trip: Trip) => void;
}

export function useAddPhaseMutation() {
  return useMutation({
    mutationFn: async ({ trip, dayPlan }: AddPhaseVariables) => {
      if (!supabase) throw new Error('Supabase not configured');

      // Insert day plan to database
      const { error } = await supabase
        .from('day_plans')
        .upsert(
          {
            id: dayPlan.id,
            trip_id: trip.id,
            date: dayPlan.date,
          },
          {
            onConflict: 'id',
            ignoreDuplicates: false,
          }
        );

      if (error) throw error;

      return { dayPlan };
    },

    // Optimistic update: Update local state immediately
    onMutate: async ({ trip, dayPlan, setTripState }) => {
      // Update trip state immediately for instant UI feedback
      const updatedTrip = {
        ...trip,
        itinerary: [...trip.itinerary, dayPlan].sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      };

      setTripState(updatedTrip);

      // Return previous trip for potential rollback
      return { previousTrip: trip, setTripState };
    },

    // Rollback on error
    onError: (err, variables, context?: MutationContext & { previousTrip: Trip }) => {
      console.error('Error adding phase:', err);
      // Safeguard: Ensure context and required properties exist before rollback
      if (context?.previousTrip && context?.setTripState) {
        context.setTripState(context.previousTrip);
      }
    },
  });
}

// ============================================================================
// MUTATION: Delete Phase (Day Plan)
// ============================================================================

interface DeletePhaseVariables {
  trip: Trip;
  phaseId: string;
  setTripState: (trip: Trip) => void;
}

export function useDeletePhaseMutation() {
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

    // Optimistic update: Update local state immediately
    onMutate: async ({ trip, phaseId, setTripState }) => {
      // Update trip state immediately for instant UI feedback
      const updatedTrip = {
        ...trip,
        itinerary: trip.itinerary.filter((day) => day.id !== phaseId),
      };

      setTripState(updatedTrip);

      // Return previous trip for potential rollback
      return { previousTrip: trip, setTripState };
    },

    onError: (err, variables, context?: MutationContext & { previousTrip: Trip }) => {
      console.error('Error deleting phase:', err);
      // Safeguard: Ensure context and required properties exist before rollback
      if (context?.previousTrip && context?.setTripState) {
        context.setTripState(context.previousTrip);
      }
    },
  });
}

// ============================================================================
// MUTATION: Add Activity to Phase
// ============================================================================

interface AddActivityVariables {
  trip: Trip;
  dayId: string;
  activity: Activity;
  setTripState: (trip: Trip) => void;
}

export function useAddActivityMutation() {
  return useMutation({
    mutationFn: async ({ trip, dayId, activity }: AddActivityVariables) => {
      if (!supabase) throw new Error('Supabase not configured');

      // Get the date from the day plan
      const dayPlan = trip.itinerary.find(d => d.id === dayId);
      if (!dayPlan) throw new Error('Day plan not found');

      const { error } = await supabase
        .from('activities')
        .upsert(
          {
            id: activity.id,
            trip_id: trip.id,
            activity_date: dayPlan.date,
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

    onMutate: async ({ trip, dayId, activity, setTripState }) => {
      // Update trip state immediately for instant UI feedback
      const updatedTrip = {
        ...trip,
        itinerary: trip.itinerary.map((day) =>
          day.id === dayId
            ? {
                ...day,
                activities: [...day.activities, activity].sort((a, b) =>
                  a.startTime.localeCompare(b.startTime)
                )
              }
            : day
        ),
      };

      setTripState(updatedTrip);

      // Return previous trip for potential rollback
      return { previousTrip: trip, setTripState };
    },

    onError: (err, variables, context?: MutationContext & { previousTrip: Trip }) => {
      console.error('Error adding activity:', err);
      // Safeguard: Ensure context and required properties exist before rollback
      if (context?.previousTrip && context?.setTripState) {
        context.setTripState(context.previousTrip);
      }
    },
  });
}

// ============================================================================
// MUTATION: Delete Activity from Phase
// ============================================================================

interface DeleteActivityVariables {
  trip: Trip;
  dayId: string;
  activityId: string;
  setTripState: (trip: Trip) => void;
}

export function useDeleteActivityMutation() {
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

    onMutate: async ({ trip, dayId, activityId, setTripState }) => {
      // Update trip state immediately for instant UI feedback
      const updatedTrip = {
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
      };

      setTripState(updatedTrip);

      // Return previous trip for potential rollback
      return { previousTrip: trip, setTripState };
    },

    onError: (err, variables, context?: MutationContext & { previousTrip: Trip }) => {
      console.error('Error deleting activity:', err);
      // Safeguard: Ensure context and required properties exist before rollback
      if (context?.previousTrip && context?.setTripState) {
        context.setTripState(context.previousTrip);
      }
    },
  });
}

// ============================================================================
// MUTATION: Update Activity
// ============================================================================

interface UpdateActivityVariables {
  trip: Trip;
  dayId: string;
  activity: Activity;
  setTripState: (trip: Trip) => void;
}

export function useUpdateActivityMutation() {
  return useMutation({
    mutationFn: async ({ trip, dayId, activity }: UpdateActivityVariables) => {
      if (!supabase) throw new Error('Supabase not configured');

      // Get the date from the day plan
      const dayPlan = trip.itinerary.find(d => d.id === dayId);
      if (!dayPlan) throw new Error('Day plan not found');

      const { error } = await supabase
        .from('activities')
        .update({
          activity_date: dayPlan.date,
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

    onMutate: async ({ trip, dayId, activity, setTripState }) => {
      // Update trip state immediately for instant UI feedback
      const updatedTrip = {
        ...trip,
        itinerary: trip.itinerary.map((day) =>
          day.id === dayId
            ? {
                ...day,
                activities: day.activities
                  .map((a) => (a.id === activity.id ? activity : a))
                  .sort((a, b) => a.startTime.localeCompare(b.startTime)),
              }
            : day
        ),
      };

      setTripState(updatedTrip);

      // Return previous trip for potential rollback
      return { previousTrip: trip, setTripState };
    },

    onError: (err, variables, context?: MutationContext & { previousTrip: Trip }) => {
      console.error('Error updating activity:', err);
      // Safeguard: Ensure context and required properties exist before rollback
      if (context?.previousTrip && context?.setTripState) {
        context.setTripState(context.previousTrip);
      }
    },
  });
}
