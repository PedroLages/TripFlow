/**
 * TripDetail Component
 *
 * Main trip view with tabbed interface for managing all trip aspects.
 * Mobile-first design with swipeable tabs and back navigation.
 *
 * Features:
 * - Trip header with cover image, name, dates
 * - Tab navigation (Itinerary, Budget, Packing, Documents, Map)
 * - Back button to return to dashboard
 * - Loading and error states
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react';
import { useTrip } from '@/src/features/trips/hooks/useTrips';
import { useActivities } from '@/src/features/trips/hooks/useActivities';
import { AddActivityModal } from './AddActivityModal';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { format } from 'date-fns';

type Tab = 'itinerary' | 'budget' | 'packing' | 'documents' | 'map';

/**
 * TripDetail - Full trip view with tabs
 *
 * Shows:
 * - Trip header (cover, name, dates, location)
 * - Tab navigation
 * - Tab content (starting with Itinerary)
 */
export function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: trip, isLoading, error } = useTrip(id!);
  const { data: activities, isLoading: activitiesLoading } = useActivities(id!);
  const [activeTab, setActiveTab] = useState<Tab>('itinerary');
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" label="Loading trip..." />
      </div>
    );
  }

  // Error state
  if (error || !trip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">
          Trip not found
        </h2>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "This trip doesn't exist or you don't have access to it."}
        </p>
        <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'budget', label: 'Budget' },
    { id: 'packing', label: 'Packing' },
    { id: 'documents', label: 'Documents' },
    { id: 'map', label: 'Map' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with cover image */}
      <div className="relative">
        {/* Cover Image */}
        <div className="relative h-48 sm:h-64 bg-gradient-to-br from-blue-500 to-purple-600">
          {trip.cover_image ? (
            <img
              src={trip.cover_image}
              alt={trip.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="h-16 w-16 text-white/50" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Trip Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{trip.name}</h1>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
            {/* Dates */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
              </span>
            </div>

            {/* Location */}
            {trip.destinations && trip.destinations.length > 0 && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>
                  {trip.destinations[0]}
                  {trip.destinations.length > 1 && ` +${trip.destinations.length - 1} more`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 min-w-[100px] px-4 py-3 text-sm font-medium transition-all
                ${activeTab === tab.id
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {activeTab === 'itinerary' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Itinerary</h2>
              <Button onClick={() => setIsAddActivityModalOpen(true)} size="sm">
                Add Activity
              </Button>
            </div>

            {/* Loading activities */}
            {activitiesLoading && (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="md" label="Loading activities..." />
              </div>
            )}

            {/* Empty state */}
            {!activitiesLoading && (!activities || activities.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No activities yet. Start adding items to your itinerary!</p>
              </div>
            )}

            {/* Activities list */}
            {!activitiesLoading && activities && activities.length > 0 && (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 bg-card border border-border rounded-xl hover:border-brand-primary/30 transition-all"
                  >
                    <h3 className="font-semibold text-base mb-2">{activity.name}</h3>

                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {/* Date */}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{format(new Date(activity.activity_date), 'MMM d, yyyy')}</span>
                      </div>

                      {/* Time */}
                      {activity.activity_time && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{activity.activity_time}</span>
                        </div>
                      )}

                      {/* Location */}
                      {activity.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{activity.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {activity.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">{activity.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Budget</h2>
            <div className="text-center py-12 text-muted-foreground">
              <p>Track your expenses here</p>
            </div>
          </div>
        )}

        {activeTab === 'packing' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Packing List</h2>
            <div className="text-center py-12 text-muted-foreground">
              <p>Create your packing checklist</p>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Documents</h2>
            <div className="text-center py-12 text-muted-foreground">
              <p>Store your travel documents</p>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Map</h2>
            <div className="text-center py-12 text-muted-foreground">
              <p>View your trip on a map</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={isAddActivityModalOpen}
        onClose={() => setIsAddActivityModalOpen(false)}
        tripId={trip.id}
        tripStartDate={trip.start_date}
        tripEndDate={trip.end_date}
      />
    </div>
  );
}

export default TripDetail;
