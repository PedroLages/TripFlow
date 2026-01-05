/**
 * TripCard Component - Mobile-First Trip Card
 *
 * Displays a single trip in the dashboard grid.
 * Touch-friendly with 48px minimum tap target.
 *
 * Mobile-first design:
 * - Full width on mobile (< 640px)
 * - Proportional in grid on tablet/desktop
 * - Optimized touch targets
 * - Fast-loading with lazy images
 */

import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { format, formatDistance, isPast, isFuture } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ROUTES } from '@/src/lib/router';
import type { Database } from '@/src/shared/types/supabase';

type Trip = Database['public']['Tables']['trips']['Row'];

interface TripCardProps {
  trip: Trip;
}

/**
 * TripCard - Individual trip card for dashboard
 *
 * Shows:
 * - Cover image (or placeholder)
 * - Trip name
 * - Dates (formatted for mobile)
 * - Status badge (upcoming/ongoing/past)
 * - Location (if available)
 */
export function TripCard({ trip }: TripCardProps) {
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);

  // Calculate trip status
  const isUpcoming = isFuture(startDate);
  const isPastTrip = isPast(endDate);
  const isOngoing = !isUpcoming && !isPastTrip;

  // Status badge
  const statusConfig = {
    upcoming: { label: 'Upcoming', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    ongoing: { label: 'In Progress', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    past: { label: 'Completed', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  };

  const status = isUpcoming ? 'upcoming' : isOngoing ? 'ongoing' : 'past';
  const { label: statusLabel, className: statusClassName } = statusConfig[status];

  // Format dates for display
  const dateRange = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
  const relativeTime = isUpcoming
    ? formatDistance(startDate, new Date(), { addSuffix: true })
    : isPastTrip
    ? formatDistance(endDate, new Date(), { addSuffix: true })
    : 'Now';

  return (
    <Link
      to={ROUTES.tripDetail(trip.id)}
      className="block group"
    >
      <Card className="
        overflow-hidden transition-all duration-200
        hover:shadow-lg hover:scale-[1.02]
        active:scale-[0.98]
        h-full
      ">
        {/* Cover Image */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
          {trip.cover_image ? (
            <img
              src={trip.cover_image}
              alt={trip.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="h-12 w-12 text-white/50" />
            </div>
          )}

          {/* Status Badge - Overlay */}
          <div className="absolute top-3 right-3">
            <span className={`
              px-3 py-1 rounded-full text-xs font-medium
              backdrop-blur-sm
              ${statusClassName}
            `}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <CardHeader className="pb-3">
          <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {trip.name}
          </h3>
        </CardHeader>

        <CardContent className="space-y-2">
          {/* Dates */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="font-medium">{dateRange}</span>
              <span className="text-xs">{relativeTime}</span>
            </div>
          </div>

          {/* Location (if available) */}
          {trip.destinations && trip.destinations.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {trip.destinations[0]}
                {trip.destinations.length > 1 && ` +${trip.destinations.length - 1} more`}
              </span>
            </div>
          )}

          {/* Budget Preview (if available) */}
          {trip.budget && trip.budget > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: trip.currency || 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(trip.budget)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default TripCard;
