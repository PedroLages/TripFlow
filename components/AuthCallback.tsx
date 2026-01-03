/**
 * Auth Callback Component
 *
 * Handles OAuth and Magic Link redirects from Supabase.
 * Place this at /auth/callback route.
 */

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { emailOAuthService } from '../src/services/EmailOAuthService';

/**
 * Validates a return path to prevent XSS and open redirect vulnerabilities
 * Only allows relative paths starting with '/' and without dangerous protocols
 */
function isValidReturnPath(path: string): boolean {
  if (!path || typeof path !== 'string') return false;

  // Must start with '/' (relative path)
  if (!path.startsWith('/')) return false;

  // Reject dangerous protocols (javascript:, data:, vbscript:, etc.)
  const dangerousProtocols = /^(javascript|data|vbscript|file|about):/i;
  if (dangerousProtocols.test(path)) return false;

  // Reject protocol-relative URLs (//)
  if (path.startsWith('//')) return false;

  // Only allow paths that match our app routes
  const validPathPattern = /^\/($|trip|dashboard|settings)/;
  return validPathPattern.test(path);
}

export function AuthCallback() {
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
        // With HashRouter, URL params can be in multiple places:
        // 1. Regular query params: window.location.search (e.g., ?code=XXX before the hash)
        // 2. Inside the hash: window.location.hash (e.g., /#/auth/callback?code=XXX)
        // 3. Hash fragment tokens: #access_token=XXX (implicit flow)

        const hash = window.location.hash;
        const search = window.location.search;

        // First try regular query params (from standalone callback page redirect)
        let urlParams = new URLSearchParams(search);
        let code = urlParams.get('code');
        let errorParam = urlParams.get('error');
        let errorDescription = urlParams.get('error_description');

        // If not found, check inside the hash (HashRouter with query params)
        if (!code && !errorParam) {
          // Parse hash like: #/auth/callback?code=XXX or #/auth/callback#access_token=XXX
          const hashQueryIndex = hash.indexOf('?');
          const hashFragmentIndex = hash.indexOf('#', 1); // Find second # if any

          // Extract query params from hash
          if (hashQueryIndex !== -1) {
            const hashQuery = hash.substring(hashQueryIndex);
            urlParams = new URLSearchParams(hashQuery);
            code = urlParams.get('code');
            errorParam = urlParams.get('error');
            errorDescription = urlParams.get('error_description');
          }

          // Handle implicit flow tokens in hash (e.g., #/auth/callback#access_token=XXX)
          if (!code && hashFragmentIndex !== -1) {
            const tokenFragment = hash.substring(hashFragmentIndex + 1);
            const tokenParams = new URLSearchParams(tokenFragment);
            const accessToken = tokenParams.get('access_token');
            const refreshToken = tokenParams.get('refresh_token');

            if (accessToken) {
              setMessage('Processing authentication tokens...');

              // Set session from implicit flow tokens
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });

              if (sessionError) {
                throw sessionError;
              }

              // Session is set, proceed to verify
              const { data: { session }, error } = await supabase.auth.getSession();
              if (error) throw error;

              if (session) {
                setStatus('success');
                setMessage('Sign in successful! Redirecting...');
                setTimeout(() => {
                  // Navigate to previous location (for Gmail OAuth) or home
                  const returnPath = localStorage.getItem('gmail_oauth_return_path');
                  if (returnPath) {
                    localStorage.removeItem('gmail_oauth_return_path');
                    // SECURITY: Validate return path before redirect to prevent XSS/open redirect
                    const safePath = isValidReturnPath(returnPath) ? returnPath : '/';
                    window.location.assign(`/#${safePath}`);
                  } else {
                    window.location.assign('/#/');
                  }
                }, 300);
                return;
              }
            }
          }
        }

        // Handle OAuth errors from provider
        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        // If we have a code, exchange it for a session (PKCE flow)
        if (code) {
          setMessage('Exchanging authentication code...');

          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }
        }

        // Verify we have a valid session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!session) {
          // No session and no code - might be a stale callback
          throw new Error('No authentication session found. Please try signing in again.');
        }

        // Check if this is a Gmail OAuth flow (has provider_token from Google)
        if (session.provider_token) {
          console.log('[AuthCallback] Gmail OAuth detected - provider_token present');
          console.log('[AuthCallback] Provider token scopes (if available):', session);

          setMessage('Storing Gmail connection...');

          // Store the Gmail OAuth connection
          const gmailResult = await emailOAuthService.handleOAuthCallback();

          if (!gmailResult.success) {
            console.error('[AuthCallback] Gmail connection storage failed:', gmailResult.error);
            // Don't fail the entire auth flow - user is still authenticated
            // They can retry Gmail connection from settings
          } else {
            console.log('[AuthCallback] Gmail connection stored successfully');
          }
        }

        setStatus('success');
        setMessage('Sign in successful! Redirecting...');

        // Redirect to previous location (for Gmail OAuth) or dashboard
        const returnPath = localStorage.getItem('gmail_oauth_return_path');
        console.log('[AuthCallback] Checking redirect path:', {
          returnPath,
          hasReturnPath: !!returnPath,
          currentHash: window.location.hash,
        });

        // Force full page reload to ensure proper route update
        setTimeout(() => {
          if (returnPath) {
            console.log('[AuthCallback] Redirecting to saved path:', returnPath);
            localStorage.removeItem('gmail_oauth_return_path');
            // SECURITY: Validate return path before redirect to prevent XSS/open redirect
            const safePath = isValidReturnPath(returnPath) ? returnPath : '/';
            window.location.assign(`/#${safePath}`);
          } else {
            console.log('[AuthCallback] No return path, redirecting to dashboard');
            window.location.assign('/#/');
          }
        }, 300);
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Signing In
            </h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome!
            </h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Sign In Failed
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
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
