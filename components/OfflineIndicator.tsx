import React from 'react';
import { WifiOff, CloudOff } from 'lucide-react';

interface OfflineIndicatorProps {
  isOffline: boolean;
  hasPendingSync?: boolean;
}

/**
 * Offline Indicator Component
 *
 * Displays the current connection and sync status to the user.
 *
 * Variants:
 * - Online + No pending sync: Hidden
 * - Offline: Shows yellow "Offline Mode" badge
 * - Has pending sync: Shows blue "Syncing..." badge
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOffline,
  hasPendingSync = false,
}) => {
  // Hide when online and no pending sync
  if (!isOffline && !hasPendingSync) {
    return null;
  }

  // Show offline indicator
  if (isOffline) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm font-medium"
        role="status"
        aria-live="polite"
      >
        <WifiOff className="w-4 h-4 flex-shrink-0" />
        <span>Offline Mode</span>
      </div>
    );
  }

  // Show syncing indicator
  if (hasPendingSync) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium"
        role="status"
        aria-live="polite"
      >
        <CloudOff className="w-4 h-4 flex-shrink-0 animate-pulse" />
        <span>Syncing...</span>
      </div>
    );
  }

  return null;
};

export default OfflineIndicator;
