/**
 * Authentication Modal Component
 *
 * Provides sign-in options:
 * - Magic Link (passwordless email)
 * - Google OAuth
 * - Try without account (anonymous)
 */

import React, { useState } from 'react';
import { X, Mail, Loader2, CheckCircle, Plane } from 'lucide-react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signInWithMagicLink, signInWithGoogle, signInAnonymously, isSupabaseConfigured } = useSupabaseAuth();

  if (!isOpen) return null;

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    const result = await signInWithMagicLink(email);

    setIsLoading(false);

    if (result.success) {
      setMagicLinkSent(true);
    } else {
      setError(result.error || 'Failed to send magic link');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    const result = await signInWithGoogle();

    if (!result.success) {
      setIsLoading(false);
      setError(result.error || 'Failed to sign in with Google');
    }
    // If successful, page will redirect
  };

  const handleTryWithoutAccount = async () => {
    setIsLoading(true);
    setError(null);

    const result = await signInAnonymously();

    setIsLoading(false);

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setError(result.error || 'Failed to continue without account');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // If Supabase is not configured, show a message
  if (!isSupabaseConfigured) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Sign In Not Available
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Cloud sync is not configured. Your trips are stored locally in your browser.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            To enable cloud sync, set up Supabase and add your credentials to the environment variables.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
          >
            Continue Offline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 md:p-6 text-white flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Plane className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">TripFlow</h2>
                <p className="text-blue-100 text-sm">Smart Trip Planning</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {magicLinkSent ? (
            // Success state
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Check Your Email
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We sent a magic link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Click the link in your email to sign in. It expires in 1 hour.
              </p>
              <button
                onClick={() => setMagicLinkSent(false)}
                className="mt-4 text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              {/* Magic Link Form */}
              <form onSubmit={handleMagicLinkSubmit} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isLoading}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full mt-3 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Continue with Email'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-sm text-gray-500 dark:text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>

              {/* Google OAuth */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Try Without Account */}
              <button
                onClick={handleTryWithoutAccount}
                disabled={isLoading}
                className="w-full mt-3 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium disabled:opacity-50"
              >
                Try without an account
              </button>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Privacy Note */}
              <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-500">
                By continuing, you agree to our Terms of Service and Privacy Policy.
                Your trips are synced securely to the cloud.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
