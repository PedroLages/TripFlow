import React, { useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';

interface UpdateBannerProps {
  onUpdate: (reloadPage?: boolean) => void;
}

/**
 * Update Banner Component
 *
 * Displays a fixed banner at the top of the page when a new version
 * of the app is available. Prompts the user to update.
 *
 * Position: Fixed at top (top-0)
 * Style: Blue background with white text
 * Action: Calls updateServiceWorker() and reloads the page
 */
export const UpdateBanner: React.FC<UpdateBannerProps> = ({ onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // Reload the page after updating service worker
      await onUpdate(true);
    } catch (error) {
      console.error('[UpdateBanner] Error updating:', error);
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 bg-blue-500 text-white z-50 shadow-lg"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Message */}
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">A new version is available!</p>
              <p className="text-xs text-blue-100">Update now to get the latest features and improvements.</p>
            </div>
          </div>

          {/* Update Button */}
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-500 hover:bg-blue-50 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            aria-label="Update application"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Update Now</span>
                <span className="sm:hidden">Update</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateBanner;
