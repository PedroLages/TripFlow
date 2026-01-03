import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../src/lib/supabase';
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';

export function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'auth-required'>('loading');
  const [message, setMessage] = useState('');
  const [tripId, setTripId] = useState<string | null>(null);

  const acceptInvitation = useCallback(async (token: string) => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setStatus('auth-required');
        setMessage('Please sign in to accept this invitation.');
        // Store the token in sessionStorage so we can accept after login
        sessionStorage.setItem('pending_invitation_token', token);
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

      // Clear the pending invitation token from sessionStorage
      sessionStorage.removeItem('pending_invitation_token');

      // Redirect to the trip after 2 seconds
      setTimeout(() => {
        if (result.trip_id) {
          navigate(`/trip/${result.trip_id}/itinerary`);
        } else {
          navigate('/');
        }
      }, 2000);

    } catch (err) {
      console.error('Unexpected error:', err);
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
    }
  }, [navigate]);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid invitation link. No token provided.');
      return;
    }

    acceptInvitation(token);
  }, [searchParams, acceptInvitation]);

  const handleSignIn = () => {
    // Redirect to home page which will show the login modal
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl p-8 sm:p-12 space-y-8 border border-slate-100 dark:border-white/5">

          {/* Status Icon */}
          <div className="flex justify-center">
            {status === 'loading' && (
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Loader2 size={40} className="text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-in zoom-in duration-300">
                <XCircle size={40} className="text-red-600 dark:text-red-400" />
              </div>
            )}
            {status === 'auth-required' && (
              <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center animate-in zoom-in duration-300">
                <Mail size={40} className="text-purple-600 dark:text-purple-400" />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
              {status === 'loading' && 'Processing Invitation'}
              {status === 'success' && 'Invitation Accepted!'}
              {status === 'error' && 'Invitation Error'}
              {status === 'auth-required' && 'Sign In Required'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {message}
            </p>
          </div>

          {/* Actions */}
          {status === 'auth-required' && (
            <button
              onClick={handleSignIn}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Sign In to Continue
              <ArrowRight size={20} />
            </button>
          )}

          {status === 'error' && (
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-semibold text-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
            >
              Go to Dashboard
            </button>
          )}

          {status === 'success' && (
            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              Redirecting to trip...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
