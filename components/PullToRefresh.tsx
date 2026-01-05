/**
 * Pull-to-Refresh Visual Component
 *
 * Displays pull indicator and loading state
 */

import React from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  isEnabled?: boolean;
  children?: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  isEnabled = true,
  children
}) => {
  const { pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh,
    isEnabled,
    pullDownThreshold: 80,
    maxPullDown: 120
  });

  const opacity = Math.min(pullDistance / 80, 1);
  const scale = Math.min(0.5 + (pullDistance / 160), 1);
  const rotation = Math.min((pullDistance / 120) * 360, 360);

  return (
    <>
      {/* Pull Indicator */}
      <div
        className="fixed top-0 left-0 right-0 z-[1001] flex items-center justify-center pointer-events-none transition-opacity duration-200"
        style={{
          opacity: isRefreshing ? 1 : opacity,
          transform: `translateY(${isRefreshing ? 60 : pullDistance / 2}px)`
        }}
      >
        <div
          className="bg-white dark:bg-slate-800 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 p-3 transition-transform duration-200"
          style={{
            transform: `scale(${isRefreshing ? 1 : scale})`
          }}
        >
          {isRefreshing ? (
            <Loader2
              size={20}
              className="text-brand-primary animate-spin"
            />
          ) : (
            <ArrowDown
              size={20}
              className="text-brand-primary transition-transform duration-200"
              style={{
                transform: `rotate(${rotation}deg)`
              }}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </>
  );
};
