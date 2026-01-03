import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../src/lib/supabase';
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight, MapPin, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

interface InvitationDetails {
  invitation: {
    id: string;
    role: string;
    invitee_email: string;
    created_at: string;
    expires_at: string;
  };
  trip: {
    id: string;
    name: string;
    destinations: string[];
    start_date: string;
    end_date: string;
    trip_type: string;
    cover_image: string | null;
  };
  inviter: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'auth-required'>('loading');
  const [message, setMessage] = useState('');
  const [tripId, setTripId] = useState<string | null>(null);
  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);

  // Fetch invitation details (works even for unauthenticated users)
  const fetchInvitationDetails = useCallback(async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('get_invitation_details', {
        p_invitation_token: token
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string } & InvitationDetails;

      if (!result.success) {
        setStatus('error');
        setMessage(result.error || 'Invalid or expired invitation');
        return null;
      }

      setInvitationDetails(result);
      return result;
    } catch (err) {
      console.error('Error fetching invitation details:', err);
      setStatus('error');
      setMessage('Failed to load invitation details');
      return null;
    }
  }, []);

  const acceptInvitation = useCallback(async (token: string) => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setStatus('auth-required');
        setMessage('Sign in to join this trip');
        // Store the token in localStorage (survives page reloads) so we can accept after login
        localStorage.setItem('pending_invitation_token', token);
        return;
      }

      // Call the accept_invitation RPC function
      const { data, error } = await supabase.rpc('accept_invitation', {
        p_invitation_token: token
      });

      if (error) {
        console.error('Error accepting invitation:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to accept invitation. Please try again.');
        return;
      }

      // Parse the response
      const result = data as { success: boolean; error?: string; trip_id?: string; role?: string };

      if (!result.success) {
        setStatus('error');
        setMessage(result.error || 'Failed to accept invitation.');
        return;
      }

      // Success!
      setStatus('success');
      setMessage(`You've been added to the trip as ${result.role}!`);
      setTripId(result.trip_id || null);

      // Clear the pending invitation token from localStorage
      localStorage.removeItem('pending_invitation_token');

      // Redirect to the trip after 2 seconds with full page reload to refresh all data
      setTimeout(() => {
        if (result.trip_id) {
          // Use window.location.hash for full reload to ensure trips data is refreshed
          window.location.hash = `/trip/${result.trip_id}/itinerary`;
          window.location.reload();
        } else {
          window.location.hash = '/';
          window.location.reload();
        }
      }, 2000);

    } catch (err) {
      console.error('Unexpected error:', err);
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
    }
  }, [navigate]);

  useEffect(() => {
    const initializeInvitation = async () => {
      // Check URL for token first
      let token = searchParams.get('token');

      // If no token in URL, check localStorage for pending invitation
      if (!token) {
        const pendingToken = localStorage.getItem('pending_invitation_token');
        if (pendingToken) {
          token = pendingToken;
          console.log('[AcceptInvitation] Found pending token in localStorage:', token.substring(0, 20) + '...');
        }
      }

      if (!token) {
        setStatus('error');
        setMessage('Invalid invitation link. No token provided.');
        return;
      }

      // First, fetch invitation details (works for unauthenticated users)
      const details = await fetchInvitationDetails(token);
      if (!details) return; // Error already set by fetchInvitationDetails

      // Then try to accept the invitation
      await acceptInvitation(token);
    };

    initializeInvitation();
  }, [searchParams, fetchInvitationDetails, acceptInvitation]);

  const handleSignIn = () => {
    const token = searchParams.get('token');
    if (token) {
      // Store just the token in localStorage (survives page reloads)
      localStorage.setItem('pending_invitation_token', token);
    }
    // Redirect to home page which will show the login modal
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/5">

          {/* Cover Image or Gradient */}
          {invitationDetails?.trip.cover_image ? (
            <div
              className="h-32 bg-cover bg-center"
              style={{ backgroundImage: `url(${invitationDetails.trip.cover_image})` }}
            />
          ) : (
            <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
          )}

          <div className="p-8 sm:p-12 space-y-6">

            {/* Status Icon */}
            <div className="flex justify-center -mt-16 mb-4">
              {status === 'loading' && (
                <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center border-4 border-white dark:border-slate-800">
                  <Loader2 size={32} className="text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center border-4 border-white dark:border-slate-800 animate-in zoom-in duration-300">
                  <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
                </div>
              )}
              {status === 'error' && (
                <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center border-4 border-white dark:border-slate-800 animate-in zoom-in duration-300">
                  <XCircle size={32} className="text-red-600 dark:text-red-400" />
                </div>
              )}
              {status === 'auth-required' && invitationDetails && (
                <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-lg overflow-hidden border-4 border-white dark:border-slate-800 animate-in zoom-in duration-300">
                  {invitationDetails.inviter.avatar_url ? (
                    <img
                      src={invitationDetails.inviter.avatar_url}
                      alt={invitationDetails.inviter.full_name || invitationDetails.inviter.email}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                      {(invitationDetails.inviter.full_name || invitationDetails.inviter.email)[0].toUpperCase()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Content based on status */}
            {status === 'auth-required' && invitationDetails && (
              <>
                <div className="text-center space-y-3">
                  <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
                    ✈️ You're invited to join a trip!
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {invitationDetails.inviter.full_name || invitationDetails.inviter.email}
                    </span>
                    {' '}invited you to join
                  </p>
                </div>

                {/* Trip Details Card */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 space-y-4">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {invitationDetails.trip.name}
                  </h2>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin size={16} className="flex-shrink-0" />
                      <span className="text-sm font-medium">
                        {invitationDetails.trip.destinations.join(', ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Calendar size={16} className="flex-shrink-0" />
                      <span className="text-sm font-medium">
                        {format(new Date(invitationDetails.trip.start_date), 'MMM d')} - {format(new Date(invitationDetails.trip.end_date), 'MMM d, yyyy')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Users size={16} className="flex-shrink-0" />
                      <span className="text-sm font-medium">
                        Join as {invitationDetails.invitation.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-200 text-center">
                    You'll get access to itinerary, budget, packing list, and trip planning tools
                  </p>
                </div>

                <button
                  onClick={handleSignIn}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Sign In to Accept Invitation
                  <ArrowRight size={20} />
                </button>
              </>
            )}

            {status === 'loading' && (
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                  Processing Invitation
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Just a moment...
                </p>
              </div>
            )}

            {status === 'success' && invitationDetails && (
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
                  🎉 Welcome to {invitationDetails.trip.name}!
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  You're now part of the crew as an {invitationDetails.invitation.role}
                </p>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Redirecting to trip...
                </div>
              </div>
            )}

            {status === 'error' && (
              <>
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                    Invitation Error
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    {message}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-semibold text-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Go to Dashboard
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
