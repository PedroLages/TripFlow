/**
 * Auth Callback Component
 *
 * Handles OAuth and Magic Link redirects from Supabase.
 * Place this at /auth/callback route.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../src/lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Completing sign in...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!supabase) {
        setStatus('error');
        setMessage('Authentication service is not configured.');
        return;
      }

      try {
        // Get the auth code from URL
        const { error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        setStatus('success');
        setMessage('Sign in successful! Redirecting...');

        // Redirect to dashboard after a short delay
        // Use window.location to completely replace URL (including removing /auth/callback)
        setTimeout(() => {
          window.location.replace('/#/');
        }, 1500);
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Signing In
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Welcome!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Sign In Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
            <button
              onClick={() => window.location.replace('/#/')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Return Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
