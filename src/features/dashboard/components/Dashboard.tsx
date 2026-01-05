/**
 * Dashboard Component - Mobile-First Trip List
 *
 * Primary entry point for TripFlow V2.
 * Displays all trips the user has access to (owned or shared).
 *
 * Mobile-first design:
 * - Single column on mobile (< 640px)
 * - 2 columns on tablet (640px - 1024px)
 * - 3 columns on desktop (> 1024px)
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTrips } from '@/src/features/trips/hooks/useTrips';
import { useAuth } from '@/src/features/auth/hooks/useAuth';
import { TripCard } from './TripCard';
import { CreateTripModal } from './CreateTripModal';
import { AuthModal } from '@/src/features/auth/components/AuthModal';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

/**
 * Dashboard - Main trip list view
 *
 * Shows:
 * - Auth modal if not logged in
 * - Loading state while fetching trips
 * - Empty state if no trips
 * - Grid of trip cards (responsive)
 * - Floating action button to create new trip (mobile)
 */
export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: trips, isLoading: tripsLoading, error } = useTrips();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isLoading = authLoading || tripsLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" label="Loading your trips..." />
      </div>
    );
  }

  // Auth required - show auth modal
  if (!user) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-2">Welcome to TripFlow!</h2>
            <p className="text-muted-foreground mb-8">
              Sign in to start planning your next adventure.
            </p>
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => setIsAuthModalOpen(true)}
            >
              Sign In / Sign Up
            </Button>
          </div>
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            setIsAuthModalOpen(false);
            // Trips will automatically load via useAuth triggering re-render
          }}
        />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">
          Oops! Something went wrong
        </h2>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : 'Failed to load trips'}
        </p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  // Empty state
  if (!trips || trips.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-2">Welcome to TripFlow!</h2>
            <p className="text-muted-foreground mb-8">
              Start planning your next adventure by creating your first trip.
            </p>
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Trip
            </Button>
          </div>
        </div>

        <CreateTripModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </>
    );
  }

  // Trips grid
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header - Mobile-first */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Your Trips</h1>
        <p className="text-muted-foreground">
          {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
        </p>
      </div>

      {/* Trip Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>

      {/* Floating Action Button - Mobile only */}
      <div className="fixed bottom-6 right-6 sm:hidden">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">Create new trip</span>
        </Button>
      </div>

      {/* Desktop: Create button in header */}
      <div className="hidden sm:block fixed top-6 right-6">
        <Button size="default" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-5 w-5" />
          Create Trip
        </Button>
      </div>

      {/* Create Trip Modal */}
      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}

export default Dashboard;
