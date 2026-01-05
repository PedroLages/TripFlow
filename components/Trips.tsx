/**
 * Trips Page
 *
 * List view of all user trips
 * Mobile-optimized with FAB for creating new trips
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Trip } from '../types';
import { format, formatDistance } from 'date-fns';

interface TripsProps {
  trips: Trip[];
}

const Trips: React.FC<TripsProps> = ({ trips }) => {
  const navigate = useNavigate();

  const handleTripClick = (tripId: string) => {
    navigate(`/trip/${tripId}/itinerary`);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-[#F8FAFC] dark:bg-slate-950">
      <div className="p-6 md:p-12 max-w-7xl mx-auto w-full space-y-8 pb-32">

        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
            Your <span className="text-brand-primary">Trips</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            {trips.length} {trips.length === 1 ? 'trip' : 'trips'} planned
          </p>
        </header>

        {/* Trips Grid */}
        {trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
              <Calendar size={40} className="text-slate-400" />
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-2">
              No trips yet
            </h3>
            <p className="text-slate-500 mb-6 max-w-md">
              Start planning your next adventure by creating your first trip
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              const startDate = new Date(trip.startDate);
              const endDate = new Date(trip.endDate);
              const isUpcoming = startDate > new Date();
              const timeUntil = isUpcoming ? formatDistance(startDate, new Date(), { addSuffix: true }) : 'Past trip';

              return (
                <button
                  key={trip.id}
                  onClick={() => handleTripClick(trip.id)}
                  className="group bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-left"
                >
                  {/* Trip Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={trip.coverImage}
                      alt={trip.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isUpcoming
                          ? 'bg-brand-primary text-white'
                          : 'bg-slate-900/50 text-white backdrop-blur-sm'
                      }`}>
                        {isUpcoming ? 'Upcoming' : 'Past'}
                      </span>
                    </div>

                    {/* Trip Name Overlay */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-display font-bold text-white mb-1">
                        {trip.name}
                      </h3>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin size={16} />
                      <span className="text-sm font-medium">{trip.destination}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Calendar size={16} />
                      <span className="text-sm font-medium">
                        {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                      </span>
                    </div>

                    {trip.travelers && trip.travelers.length > 0 && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Users size={16} />
                        <span className="text-sm font-medium">
                          {trip.travelers.length} {trip.travelers.length === 1 ? 'traveler' : 'travelers'}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                        {timeUntil}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Trips;
