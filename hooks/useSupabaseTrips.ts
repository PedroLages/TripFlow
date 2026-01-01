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
import type { Trip, DayPlan, Expense, PackingItem, WishlistPlace, TravelDocument, TravelAlert, Collaborator, Settlement, ActivityLog } from '../types';

type SupabaseTrip = Database['public']['Tables']['trips']['Row'];

export interface UseSupabaseTripsReturn {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  // CRUD operations
  createTrip: (trip: Omit<Trip, 'id'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  updateTrip: (id: string, updates: Partial<Trip>) => Promise<{ success: boolean; error?: string }>;
  deleteTrip: (id: string) => Promise<{ success: boolean; error?: string }>;
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
    ownerEmail: '', // Will be populated from profile
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

      // Fetch trips (RLS handles access control)
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .order('start_date', { ascending: true });

      if (tripsError) {
        throw tripsError;
      }

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

        const tripCollaborators: Collaborator[] = (membersData || [])
          .filter(m => m.trip_id === dbTrip.id)
          .map(m => ({
            email: (m.user as any)?.email || '',
            role: m.role as Collaborator['role'],
            avatar: (m.user as any)?.avatar_url || '',
            isOwner: false,
          }));

        // Add owner as collaborator
        if (owner) {
          tripCollaborators.unshift({
            email: owner.email,
            role: 'Editor',
            avatar: owner.avatar_url || '',
            isOwner: true,
          });
        }

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

      return { success: true, id: data.id };
    } catch (err) {
      console.error('Error creating trip:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create trip' };
    }
  }, []);

  /**
   * Update an existing trip
   */
  const updateTrip = useCallback(async (
    id: string,
    updates: Partial<Trip>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    try {
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
          return { success: false, error: updateError.message };
        }
      }

      // Handle itinerary updates if provided
      if (updates.itinerary !== undefined) {
        // Delete existing day plans and activities (cascade will handle activities)
        const { error: deleteError } = await supabase
          .from('day_plans')
          .delete()
          .eq('trip_id', id);

        if (deleteError) {
          return { success: false, error: deleteError.message };
        }

        // Insert new day plans and their activities
        for (const day of updates.itinerary) {
          const { data: dayData, error: dayError } = await supabase
            .from('day_plans')
            .insert({
              id: day.id,
              trip_id: id,
              date: day.date,
            })
            .select()
            .single();

          if (dayError) {
            return { success: false, error: dayError.message };
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
                  location: a.location,
                  notes: a.notes,
                  cost: a.cost || 0,
                  icon_name: a.iconName || null,
                }))
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
        await supabase.from('expenses').delete().eq('trip_id', id);

        // Insert new expenses
        if (updates.expenses.length > 0) {
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from('expenses').insert(
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
        }
      }

      // Handle packing list updates if provided
      if (updates.packingList !== undefined) {
        // Delete existing packing items
        await supabase.from('packing_items').delete().eq('trip_id', id);

        // Insert new packing items
        if (updates.packingList.length > 0) {
          await supabase.from('packing_items').insert(
            updates.packingList.map(p => ({
              id: p.id,
              trip_id: id,
              name: p.name,
              category: p.category,
              is_packed: p.isPacked,
            }))
          );
        }
      }

      // Handle wishlist updates if provided
      if (updates.wishlist !== undefined) {
        // Delete existing wishlist items
        await supabase.from('wishlist_places').delete().eq('trip_id', id);

        // Insert new wishlist items
        if (updates.wishlist.length > 0) {
          await supabase.from('wishlist_places').insert(
            updates.wishlist.map(w => ({
              id: w.id,
              trip_id: id,
              name: w.name,
              category: w.category,
              notes: w.notes,
              rating: w.rating,
            }))
          );
        }
      }

      // Handle documents updates if provided
      if (updates.documents !== undefined) {
        // Delete existing documents
        await supabase.from('travel_documents').delete().eq('trip_id', id);

        // Insert new documents
        if (updates.documents.length > 0) {
          await supabase.from('travel_documents').insert(
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
        }
      }

      // Handle alerts updates if provided
      if (updates.alerts !== undefined) {
        // Delete existing alerts
        await supabase.from('travel_alerts').delete().eq('trip_id', id);

        // Insert new alerts
        if (updates.alerts.length > 0) {
          await supabase.from('travel_alerts').insert(
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
        }
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating trip:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update trip' };
    }
  }, []);

  /**
   * Delete a trip
   */
  const deleteTrip = useCallback(async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    try {
      const { error: deleteError } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting trip:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to delete trip' };
    }
  }, []);

  return {
    trips,
    loading,
    error,
    createTrip,
    updateTrip,
    deleteTrip,
    isRealtime,
    refresh: fetchTrips,
  };
}
