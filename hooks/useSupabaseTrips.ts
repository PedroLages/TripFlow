/**
 * Supabase Trips Hook with Real-time Sync
 *
 * Provides CRUD operations for trips with real-time updates.
 * Falls back gracefully when Supabase is not configured.
 *
 * Usage:
 * ```tsx
 * const { trips, loading, createTrip, updateTrip, deleteTrip } = useSupabaseTrips();
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseReady, Database } from '../src/lib/supabase';
import type { Trip, DayPlan, Activity, Expense, PackingItem, WishlistPlace, TravelDocument, TravelAlert, Collaborator, Settlement, ActivityLog } from '../types';

type SupabaseTrip = Database['public']['Tables']['trips']['Row'];

export interface UseSupabaseTripsReturn {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  // CRUD operations
  createTrip: (trip: Omit<Trip, 'id'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  updateTrip: (id: string, updates: Partial<Trip>) => Promise<{ success: boolean; error?: string }>;
  deleteTrip: (id: string) => Promise<{ success: boolean; error?: string }>;
  // State-only update (for optimistic updates without database sync)
  setTripState: (updater: (prevTrips: Trip[]) => Trip[]) => void;
  // Real-time status
  isRealtime: boolean;
  // Refresh
  refresh: () => Promise<void>;
}

/**
 * Convert Supabase trip row to TripFlow Trip type
 */
function mapSupabaseTripToTrip(
  dbTrip: SupabaseTrip,
  extras: {
    itinerary?: DayPlan[];
    expenses?: Expense[];
    packingList?: PackingItem[];
    wishlist?: WishlistPlace[];
    documents?: TravelDocument[];
    alerts?: TravelAlert[];
    collaborators?: Collaborator[];
    settlements?: Settlement[];
    activityLogs?: ActivityLog[];
    ownerEmail?: string;
  } = {}
): Trip {
  return {
    id: dbTrip.id,
    name: dbTrip.name,
    destinations: dbTrip.destinations || [],
    startDate: dbTrip.start_date,
    endDate: dbTrip.end_date,
    type: dbTrip.trip_type,
    coverImage: dbTrip.cover_image || '',
    description: dbTrip.description || '',
    budget: Number(dbTrip.budget) || 0,
    itinerary: extras.itinerary || [],
    wishlist: extras.wishlist || [],
    expenses: extras.expenses || [],
    packingList: extras.packingList || [],
    documents: extras.documents || [],
    collaborators: extras.collaborators || [],
    alerts: extras.alerts || [],
    activityLogs: extras.activityLogs || [],
    ownerEmail: extras.ownerEmail || '',
    isPast: new Date(dbTrip.end_date) < new Date(),
    settlements: extras.settlements || [],
  };
}

/**
 * Convert TripFlow Trip to Supabase insert format
 */
function mapTripToSupabaseInsert(trip: Omit<Trip, 'id'>, ownerId: string) {
  return {
    name: trip.name,
    destinations: trip.destinations,
    start_date: trip.startDate,
    end_date: trip.endDate,
    trip_type: trip.type,
    cover_image: trip.coverImage || null,
    description: trip.description || null,
    budget: trip.budget,
    currency: 'USD', // Default, extend later
    owner_id: ownerId,
  };
}

/**
 * Hook for managing trips with Supabase backend
 */
export function useSupabaseTrips(): UseSupabaseTripsReturn {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtime, setIsRealtime] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const isConfigured = isSupabaseReady();

  /**
   * Fetch all trips the user has access to
   */
  const fetchTrips = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTrips([]);
        setLoading(false);
        return;
      }

      // Fetch trips (RLS policy returns trips user owns OR is a member of)
      const { data: ownedTripsData, error: ownedError } = await supabase
        .from('trips')
        .select('*')
        .order('start_date', { ascending: true });

      if (ownedError) {
        throw ownedError;
      }

      // Fetch trips where user is a member (via RPC function to bypass RLS circular dependency)
      const { data: memberTripsData, error: memberError } = await supabase
        .rpc('get_member_trips');

      if (memberError) {
        console.error('Error fetching member trips:', memberError);
        // Continue with just owned trips if member fetch fails
      }

      // Merge and deduplicate trips (owned + member)
      const tripsMap = new Map<string, SupabaseTrip>();

      // Add owned trips
      (ownedTripsData || []).forEach(trip => {
        tripsMap.set(trip.id, trip);
      });

      // Add member trips (won't overwrite if already owned)
      (memberTripsData || []).forEach((trip: SupabaseTrip) => {
        if (!tripsMap.has(trip.id)) {
          tripsMap.set(trip.id, trip);
        }
      });

      const tripsData = Array.from(tripsMap.values()).sort((a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );

      if (!tripsData || tripsData.length === 0) {
        setTrips([]);
        setLoading(false);
        return;
      }

      // Fetch related data for each trip
      const tripIds = tripsData.map(t => t.id);

      // Fetch expenses for all trips
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .in('trip_id', tripIds);

      // Fetch packing items for all trips
      const { data: packingData } = await supabase
        .from('packing_items')
        .select('*')
        .in('trip_id', tripIds);

      // Fetch wishlist places for all trips
      const { data: wishlistData } = await supabase
        .from('wishlist_places')
        .select('*')
        .in('trip_id', tripIds);

      // Fetch documents for all trips
      const { data: documentsData } = await supabase
        .from('travel_documents')
        .select('*')
        .in('trip_id', tripIds);

      // Fetch alerts for all trips
      const { data: alertsData } = await supabase
        .from('travel_alerts')
        .select('*')
        .in('trip_id', tripIds);

      // Fetch day plans (itinerary) for all trips
      const { data: dayPlansData } = await supabase
        .from('day_plans')
        .select('*')
        .in('trip_id', tripIds)
        .order('date', { ascending: true });

      // Fetch activities for the day plans
      const dayPlanIds = dayPlansData?.map(dp => dp.id) || [];
      const { data: activitiesData } = dayPlanIds.length > 0
        ? await supabase
            .from('activities')
            .select('*')
            .in('day_plan_id', dayPlanIds)
            .order('start_time', { ascending: true })
        : { data: [] };

      // Fetch trip members with profiles
      const { data: membersData } = await supabase
        .from('trip_members')
        .select(`
          trip_id,
          role,
          user:profiles(email, full_name, avatar_url)
        `)
        .in('trip_id', tripIds);

      // Fetch owner profiles
      const ownerIds = [...new Set(tripsData.map(t => t.owner_id))];
      const { data: ownersData } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', ownerIds);

      // Build a map of owner data
      const ownerMap = new Map(ownersData?.map(o => [o.id, o]) || []);

      // Map to TripFlow format
      const mappedTrips: Trip[] = tripsData.map(dbTrip => {
        const owner = ownerMap.get(dbTrip.owner_id);

        // Filter related data for this trip
        const tripExpenses: Expense[] = (expensesData || [])
          .filter(e => e.trip_id === dbTrip.id)
          .map(e => ({
            id: e.id,
            amount: Number(e.amount),
            category: e.category as Expense['category'],
            date: e.date,
            notes: e.notes || '',
            currency: e.currency,
            isSplit: e.is_split,
            paidBy: e.paid_by || undefined,
            splitMethod: e.split_method as Expense['splitMethod'],
          }));

        const tripPacking: PackingItem[] = (packingData || [])
          .filter(p => p.trip_id === dbTrip.id)
          .map(p => ({
            id: p.id,
            name: p.name,
            category: p.category || 'Other',
            isPacked: p.is_packed,
          }));

        const tripWishlist: WishlistPlace[] = (wishlistData || [])
          .filter(w => w.trip_id === dbTrip.id)
          .map(w => ({
            id: w.id,
            name: w.name,
            category: w.category as WishlistPlace['category'],
            notes: w.notes || '',
            rating: w.rating,
          }));

        const tripDocuments: TravelDocument[] = (documentsData || [])
          .filter(d => d.trip_id === dbTrip.id)
          .map(d => ({
            id: d.id,
            type: d.doc_type as TravelDocument['type'],
            title: d.title,
            details: d.details || '',
            confirmation: d.confirmation || '',
            price: d.price ? Number(d.price) : undefined,
            date: d.date || undefined,
            status: d.status || undefined,
            gate: d.gate || undefined,
            lastUpdated: d.last_updated || undefined,
          }));

        const tripAlerts: TravelAlert[] = (alertsData || [])
          .filter(a => a.trip_id === dbTrip.id)
          .map(a => ({
            id: a.id,
            type: a.alert_type as TravelAlert['type'],
            title: a.title,
            description: a.description || '',
            severity: a.severity as TravelAlert['severity'],
            date: a.date || '',
          }));

        // Build collaborators list, excluding the owner (they're rendered separately as "Lead Planner")
        const tripCollaborators: Collaborator[] = (membersData || [])
          .filter(m => m.trip_id === dbTrip.id)
          .filter(m => {
            // Exclude owner from collaborators list - they're shown separately in the UI
            const memberEmail = (m.user as any)?.email?.trim().toLowerCase();
            const ownerEmail = owner?.email?.trim().toLowerCase();
            return memberEmail !== ownerEmail;
          })
          .map(m => ({
            email: (m.user as any)?.email || '',
            role: m.role as Collaborator['role'],
            avatar: (m.user as any)?.avatar_url || '',
            isOwner: false,
          }));

        // Map day plans and activities to itinerary
        const tripItinerary: DayPlan[] = (dayPlansData || [])
          .filter(dp => dp.trip_id === dbTrip.id)
          .map(dp => ({
            id: dp.id,
            date: dp.date,
            activities: (activitiesData || [])
              .filter(a => a.day_plan_id === dp.id)
              .map(a => ({
                id: a.id,
                type: a.activity_type as Activity['type'],
                name: a.name,
                startTime: a.start_time,
                endTime: a.end_time,
                location: a.location || '',
                notes: a.notes || '',
                cost: Number(a.cost) || 0,
                iconName: a.icon_name || undefined,
              }))
          }));

        return mapSupabaseTripToTrip(dbTrip, {
          expenses: tripExpenses,
          packingList: tripPacking,
          wishlist: tripWishlist,
          documents: tripDocuments,
          alerts: tripAlerts,
          collaborators: tripCollaborators,
          itinerary: tripItinerary,
          ownerEmail: owner?.email || '',
        });
      });

      setTrips(mappedTrips);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Set up real-time subscription
   */
  useEffect(() => {
    if (!isConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchTrips();

    // Set up real-time subscription
    const channel = supabase
      .channel('trips-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
        },
        (payload) => {
          // Refresh trips on any change
          // Could be optimized to handle INSERT/UPDATE/DELETE separately
          fetchTrips();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
        },
        () => {
          fetchTrips();
        }
      )
      .subscribe((status) => {
        setIsRealtime(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isConfigured, fetchTrips]);

  /**
   * Create a new trip
   */
  const createTrip = useCallback(async (
    trip: Omit<Trip, 'id'>
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    try {
      // Track errors from nested operations
      const errors: string[] = [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const insertData = mapTripToSupabaseInsert(trip, user.id);

      const { data, error: insertError } = await supabase
        .from('trips')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      // Optimistic update: Add trip to state immediately after main insert succeeds
      const newTrip: Trip = {
        ...trip,
        id: data.id,
        ownerEmail: user.email || '',
        isPast: new Date(trip.endDate) < new Date(),
      } as Trip;
      setTrips(prev => [...prev, newTrip]);

      // Insert related data (expenses, packing items, etc.)
      if (trip.expenses && trip.expenses.length > 0) {
        await supabase.from('expenses').insert(
          trip.expenses.map(e => ({
            trip_id: data.id,
            amount: e.amount,
            category: e.category,
            date: e.date,
            notes: e.notes,
            currency: e.currency || 'USD',
            is_split: e.isSplit || false,
            paid_by: e.paidBy || null,
            split_method: e.splitMethod || null,
            created_by: user.id,
          }))
        );
      }

      if (trip.packingList && trip.packingList.length > 0) {
        await supabase.from('packing_items').insert(
          trip.packingList.map(p => ({
            trip_id: data.id,
            name: p.name,
            category: p.category,
            is_packed: p.isPacked,
          }))
        );
      }

      if (trip.wishlist && trip.wishlist.length > 0) {
        await supabase.from('wishlist_places').insert(
          trip.wishlist.map(w => ({
            trip_id: data.id,
            name: w.name,
            category: w.category,
            notes: w.notes,
            rating: w.rating,
          }))
        );
      }

      // Sync documents (flights, hotels, etc.)
      if (trip.documents && trip.documents.length > 0) {
        await supabase.from('travel_documents').insert(
          trip.documents.map(d => ({
            trip_id: data.id,
            doc_type: d.type,
            title: d.title,
            details: d.details || null,
            confirmation: d.confirmation || null,
            price: d.price || null,
            date: d.date || null,
            status: d.status || null,
            gate: d.gate || null,
            last_updated: d.lastUpdated || null,
          }))
        );
      }

      // Sync alerts
      if (trip.alerts && trip.alerts.length > 0) {
        await supabase.from('travel_alerts').insert(
          trip.alerts.map(a => ({
            trip_id: data.id,
            alert_type: a.type,
            title: a.title,
            description: a.description || null,
            severity: a.severity,
            date: a.date || null,
          }))
        );
      }

      // Sync itinerary (day plans and activities)
      if (trip.itinerary && trip.itinerary.length > 0) {
        for (const day of trip.itinerary) {
          // Insert day plan
          const { data: dayData, error: dayError } = await supabase
            .from('day_plans')
            .insert({
              id: day.id,
              trip_id: data.id,
              date: day.date,
            })
            .select()
            .single();

          if (dayError) {
            console.error('Error creating day plan:', dayError);
            errors.push(`Failed to create day plan for ${day.date}: ${dayError.message}`);
            continue; // Skip this day but continue with others
          }

          // Insert activities for this day
          if (day.activities && day.activities.length > 0) {
            const { error: activitiesError } = await supabase
              .from('activities')
              .insert(
                day.activities.map(a => ({
                  id: a.id,
                  day_plan_id: day.id,
                  activity_type: a.type,
                  name: a.name,
                  start_time: a.startTime,
                  end_time: a.endTime,
                  location: a.location || null,
                  notes: a.notes || null,
                  cost: a.cost || 0,
                  icon_name: a.iconName || null,
                }))
              );

            if (activitiesError) {
              console.error('Error creating activities:', activitiesError);
              errors.push(`Failed to create activities for ${day.date}: ${activitiesError.message}`);
            }
          }
        }
      }

      // Sync collaborators (if any were added during creation)
      if (trip.collaborators && trip.collaborators.length > 0) {
        // Filter out the owner (they're added automatically)
        const nonOwnerCollaborators = trip.collaborators.filter(c => !c.isOwner);

        for (const collaborator of nonOwnerCollaborators) {
          // Look up user by email
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', collaborator.email)
            .single();

          if (profileData) {
            // Add as trip member
            await supabase.from('trip_members').insert({
              trip_id: data.id,
              user_id: profileData.id,
              role: collaborator.role,
            });
          }
        }
      }

      // Sync settlements (if any expense splits were created)
      if (trip.settlements && trip.settlements.length > 0) {
        await supabase.from('settlements').insert(
          trip.settlements.map(s => ({
            trip_id: data.id,
            from_email: s.fromEmail,
            to_email: s.toEmail,
            amount: s.amount,
            currency: s.currency || 'USD',
            is_settled: s.isSettled || false,
          }))
        );
      }

      // Activity logs are auto-generated by the database (via triggers),
      // so we don't need to manually insert them here

      // Return success with any partial errors
      if (errors.length > 0) {
        return {
          success: true,
          id: data.id,
          error: `Trip created but some data failed to save: ${errors.join('; ')}`
        };
      }

      return { success: true, id: data.id };
    } catch (err) {
      console.error('Error creating trip:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create trip' };
    }
  }, []);

  /**
   * Update an existing trip
   * Uses optimistic updates for instant UI feedback
   */
  const updateTrip = useCallback(async (
    id: string,
    updates: Partial<Trip>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    // Save previous state for rollback on failure
    const previousTrips = trips;

    // Optimistic update: Update UI immediately
    setTrips(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    try {
      // Track errors from partial updates
      // NOTE: Database operations are NOT atomic across tables.
      // For truly atomic updates, use a Supabase Edge Function with transactions.
      const errors: string[] = [];

      // Update main trip fields
      const tripUpdates: Record<string, any> = {};
      if (updates.name !== undefined) tripUpdates.name = updates.name;
      if (updates.destinations !== undefined) tripUpdates.destinations = updates.destinations;
      if (updates.startDate !== undefined) tripUpdates.start_date = updates.startDate;
      if (updates.endDate !== undefined) tripUpdates.end_date = updates.endDate;
      if (updates.type !== undefined) tripUpdates.trip_type = updates.type;
      if (updates.coverImage !== undefined) tripUpdates.cover_image = updates.coverImage;
      if (updates.description !== undefined) tripUpdates.description = updates.description;
      if (updates.budget !== undefined) tripUpdates.budget = updates.budget;

      if (Object.keys(tripUpdates).length > 0) {
        const { error: updateError } = await supabase
          .from('trips')
          .update(tripUpdates)
          .eq('id', id);

        if (updateError) {
          // Rollback optimistic update on failure
          setTrips(previousTrips);
          return { success: false, error: updateError.message };
        }
      }

      // Handle itinerary updates if provided
      if (updates.itinerary !== undefined) {
        // Batch upsert all day plans at once (more efficient, avoids race conditions)
        if (updates.itinerary.length > 0) {
          // DEBUG: Verify no duplicate UUIDs
          const uuidSet = new Set(updates.itinerary.map(day => day.id));
          if (uuidSet.size !== updates.itinerary.length) {
            console.error('[UUID COLLISION DETECTED]', updates.itinerary);
            return {
              success: false,
              error: 'Duplicate UUIDs detected in itinerary. Please refresh the page.'
            };
          }

          // DEBUG: Log upsert details to verify code version
          console.log('[DAY_PLANS_UPSERT]', {
            codeVersion: 'v3_service_worker_fix',
            timestamp: new Date().toISOString(),
            onConflict: 'id',
            dayCount: updates.itinerary.length,
            dayIds: updates.itinerary.map(d => ({ id: d.id, date: d.date }))
          });

          const { error: upsertError } = await supabase
            .from('day_plans')
            .upsert(
              updates.itinerary.map(day => ({
                id: day.id,
                trip_id: id,
                date: day.date,
              })),
              {
                // Use the primary key for conflict resolution
                // This handles both new inserts and updates to existing day plans
                onConflict: 'id',
                ignoreDuplicates: false
              }
            );

          if (upsertError) {
            console.error('[DAY_PLANS_UPSERT_ERROR]', {
              error: upsertError,
              code: upsertError.code,
              message: upsertError.message,
              details: upsertError.details,
              hint: upsertError.hint,
            });
            return { success: false, error: upsertError.message };
          }

          console.log('[DAY_PLANS_UPSERT_SUCCESS]', { dayCount: updates.itinerary.length });
        }

        // Get current day plan IDs from database to clean up removed ones
        const { data: existingDayPlans } = await supabase
          .from('day_plans')
          .select('id')
          .eq('trip_id', id);

        const existingIds = new Set(existingDayPlans?.map(dp => dp.id) || []);
        const newIds = new Set(updates.itinerary.map(day => day.id));

        // Delete day plans that are no longer in the itinerary
        const idsToDelete = Array.from(existingIds).filter(id => !newIds.has(id));
        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('day_plans')
            .delete()
            .in('id', idsToDelete);

          if (deleteError) {
            console.error('Error deleting removed day plans:', deleteError);
            errors.push(`Failed to delete ${idsToDelete.length} removed day plan(s): ${deleteError.message}`);
          }
        }

        // Handle activities for each day
        for (const day of updates.itinerary) {

          // Handle activities for this day
          // Get existing activities for this day
          const { data: existingActivities } = await supabase
            .from('activities')
            .select('id')
            .eq('day_plan_id', day.id);

          const existingActivityIds = new Set(existingActivities?.map(a => a.id) || []);
          const newActivityIds = new Set((day.activities || []).map(a => a.id));

          // Delete activities that are no longer in this day
          const activityIdsToDelete = Array.from(existingActivityIds).filter(id => !newActivityIds.has(id));
          if (activityIdsToDelete.length > 0) {
            const { error: deleteActivitiesError } = await supabase
              .from('activities')
              .delete()
              .in('id', activityIdsToDelete);

            if (deleteActivitiesError) {
              console.error('Error deleting removed activities:', deleteActivitiesError);
              errors.push(`Failed to delete ${activityIdsToDelete.length} removed activit(ies) from ${day.date}: ${deleteActivitiesError.message}`);
            }
          }

          // Upsert activities for this day
          if (day.activities && day.activities.length > 0) {
            const { error: activitiesError } = await supabase
              .from('activities')
              .upsert(
                day.activities.map(a => ({
                  id: a.id,
                  day_plan_id: day.id,
                  activity_type: a.type,
                  name: a.name,
                  start_time: a.startTime,
                  end_time: a.endTime,
                  location: a.location,
                  notes: a.notes,
                  cost: a.cost || 0,
                  icon_name: a.iconName || null,
                })),
                {
                  // Use primary key for conflict resolution
                  onConflict: 'id',
                  ignoreDuplicates: false
                }
              );

            if (activitiesError) {
              return { success: false, error: activitiesError.message };
            }
          }
        }
      }

      // Handle expenses updates if provided
      if (updates.expenses !== undefined) {
        // Delete existing expenses
        const { error: deleteExpensesError } = await supabase
          .from('expenses')
          .delete()
          .eq('trip_id', id);

        if (deleteExpensesError) {
          console.error('Error deleting expenses:', deleteExpensesError);
          return { success: false, error: `Failed to delete expenses: ${deleteExpensesError.message}` };
        }

        // Insert new expenses
        if (updates.expenses.length > 0) {
          const { data: { user } } = await supabase.auth.getUser();
          const { error: insertExpensesError } = await supabase.from('expenses').insert(
            updates.expenses.map(e => ({
              id: e.id,
              trip_id: id,
              amount: e.amount,
              category: e.category,
              date: e.date,
              notes: e.notes,
              currency: e.currency || 'USD',
              is_split: e.isSplit || false,
              paid_by: e.paidBy || null,
              split_method: e.splitMethod || null,
              created_by: user?.id || null,
            }))
          );

          if (insertExpensesError) {
            console.error('Error inserting expenses:', insertExpensesError);
            return { success: false, error: `Failed to insert expenses: ${insertExpensesError.message}` };
          }
        }
      }

      // Handle packing list updates if provided
      if (updates.packingList !== undefined) {
        // Delete existing packing items
        const { error: deletePackingError } = await supabase
          .from('packing_items')
          .delete()
          .eq('trip_id', id);

        if (deletePackingError) {
          console.error('Error deleting packing items:', deletePackingError);
          return { success: false, error: `Failed to delete packing items: ${deletePackingError.message}` };
        }

        // Insert new packing items
        if (updates.packingList.length > 0) {
          const { error: insertPackingError } = await supabase.from('packing_items').insert(
            updates.packingList.map(p => ({
              id: p.id,
              trip_id: id,
              name: p.name,
              category: p.category,
              is_packed: p.isPacked,
            }))
          );

          if (insertPackingError) {
            console.error('Error inserting packing items:', insertPackingError);
            return { success: false, error: `Failed to insert packing items: ${insertPackingError.message}` };
          }
        }
      }

      // Handle wishlist updates if provided
      if (updates.wishlist !== undefined) {
        // Delete existing wishlist items
        const { error: deleteWishlistError } = await supabase
          .from('wishlist_places')
          .delete()
          .eq('trip_id', id);

        if (deleteWishlistError) {
          console.error('Error deleting wishlist items:', deleteWishlistError);
          return { success: false, error: `Failed to delete wishlist items: ${deleteWishlistError.message}` };
        }

        // Upsert new wishlist items (handles both insert and update)
        if (updates.wishlist.length > 0) {
          const { error: upsertWishlistError } = await supabase
            .from('wishlist_places')
            .upsert(
              updates.wishlist.map(w => ({
                id: w.id,
                trip_id: id,
                name: w.name,
                category: w.category,
                notes: w.notes,
                rating: w.rating,
              })),
              {
                // Use the primary key for conflict resolution
                onConflict: 'id',
                ignoreDuplicates: false
              }
            );

          if (upsertWishlistError) {
            console.error('Error upserting wishlist items:', upsertWishlistError);
            return { success: false, error: `Failed to upsert wishlist items: ${upsertWishlistError.message}` };
          }
        }
      }

      // Handle documents updates if provided
      if (updates.documents !== undefined) {
        // Delete existing documents
        const { error: deleteDocumentsError } = await supabase
          .from('travel_documents')
          .delete()
          .eq('trip_id', id);

        if (deleteDocumentsError) {
          console.error('Error deleting documents:', deleteDocumentsError);
          return { success: false, error: `Failed to delete documents: ${deleteDocumentsError.message}` };
        }

        // Insert new documents
        if (updates.documents.length > 0) {
          const { error: insertDocumentsError } = await supabase.from('travel_documents').insert(
            updates.documents.map(d => ({
              id: d.id,
              trip_id: id,
              doc_type: d.type,
              title: d.title,
              details: d.details || null,
              confirmation: d.confirmation || null,
              price: d.price || null,
              date: d.date || null,
              status: d.status || null,
              gate: d.gate || null,
              last_updated: d.lastUpdated || null,
            }))
          );

          if (insertDocumentsError) {
            console.error('Error inserting documents:', insertDocumentsError);
            return { success: false, error: `Failed to insert documents: ${insertDocumentsError.message}` };
          }
        }
      }

      // Handle alerts updates if provided
      if (updates.alerts !== undefined) {
        // Delete existing alerts
        const { error: deleteAlertsError } = await supabase
          .from('travel_alerts')
          .delete()
          .eq('trip_id', id);

        if (deleteAlertsError) {
          console.error('Error deleting alerts:', deleteAlertsError);
          return { success: false, error: `Failed to delete alerts: ${deleteAlertsError.message}` };
        }

        // Insert new alerts
        if (updates.alerts.length > 0) {
          const { error: insertAlertsError } = await supabase.from('travel_alerts').insert(
            updates.alerts.map(a => ({
              id: a.id,
              trip_id: id,
              alert_type: a.type,
              title: a.title,
              description: a.description || null,
              severity: a.severity,
              date: a.date || null,
            }))
          );

          if (insertAlertsError) {
            console.error('Error inserting alerts:', insertAlertsError);
            return { success: false, error: `Failed to insert alerts: ${insertAlertsError.message}` };
          }
        }
      }

      // Return success with any partial errors
      if (errors.length > 0) {
        return {
          success: true,
          error: `Trip updated but some operations failed: ${errors.join('; ')}`
        };
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating trip:', err);
      // Rollback optimistic update on failure
      setTrips(previousTrips);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update trip' };
    }
  }, [trips]);

  /**
   * Delete a trip
   * Uses optimistic updates for instant UI feedback
   */
  const deleteTrip = useCallback(async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    // Save trip for potential rollback
    const tripToDelete = trips.find(t => t.id === id);

    // Optimistic update: Remove from UI immediately
    setTrips(prev => prev.filter(t => t.id !== id));

    try {
      const { error: deleteError } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);

      if (deleteError) {
        // Rollback: Restore deleted trip
        if (tripToDelete) {
          setTrips(prev => [...prev, tripToDelete]);
        }
        return { success: false, error: deleteError.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting trip:', err);
      // Rollback: Restore deleted trip
      if (tripToDelete) {
        setTrips(prev => [...prev, tripToDelete]);
      }
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete trip' };
    }
  }, [trips]);

  return {
    trips,
    loading,
    error,
    createTrip,
    updateTrip,
    deleteTrip,
    setTripState: setTrips, // Direct state update without database sync
    isRealtime,
    refresh: fetchTrips,
  };
}
