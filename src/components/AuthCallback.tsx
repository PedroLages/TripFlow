/**
 * OAuth Callback Handler Component
 *
 * Handles the OAuth redirect after user authorizes Gmail access.
 * Processes tokens and stores the email connection in the database.
 *
 * Usage:
 *   Add route: <Route path="/auth/callback" element={<AuthCallback />} />
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { emailOAuthService } from '../services/EmailOAuthService';

type CallbackState = 'processing' | 'success' | 'error';

export function AuthCallback() {
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const result = await emailOAuthService.handleOAuthCallback();

        if (result.success) {
          setState('success');
          // Redirect to documents tab after 2 seconds
          setTimeout(() => {
            navigate('/', { replace: true });
            // Force full page reload to ensure session is updated everywhere
            window.location.reload();
          }, 2000);
        } else {
          setState('error');
          setError(result.error || 'Failed to connect Gmail account');
        }
      } catch (err) {
        console.error('[AuthCallback] Unexpected error:', err);
        setState('error');
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {state === 'processing' && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Connecting Gmail
            </h2>
            <p className="text-gray-600">
              Processing your authorization...
            </p>
          </div>
        )}

        {state === 'success' && (
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Successfully Connected!
            </h2>
            <p className="text-gray-600 mb-4">
              Your Gmail account has been connected. Redirecting...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecting to your trips...</span>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
