/**
 * Pull-to-Refresh Hook
 *
 * Implements native mobile pull-to-refresh behavior
 * Detects touch gestures and triggers refresh callback
 */

import { useEffect, useState, useRef, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  pullDownThreshold?: number;
  maxPullDown?: number;
  isEnabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  pullDownThreshold = 80,
  maxPullDown = 120,
  isEnabled = true
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);
  const scrollYRef = useRef(0);
  const isPullingRef = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isEnabled || isRefreshing) return;

    // Only enable pull-to-refresh when scrolled to top
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > 5) return;

    touchStartYRef.current = e.touches[0].clientY;
    touchStartXRef.current = e.touches[0].clientX;
    scrollYRef.current = scrollTop;
    isPullingRef.current = true;
  }, [isEnabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current || !isEnabled || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    // Only pull when at top of page
    if (scrollTop > 0) {
      isPullingRef.current = false;
      setPullDistance(0);
      return;
    }

    const diffY = currentY - touchStartYRef.current;
    const diffX = currentX - touchStartXRef.current;

    // Check if movement is primarily vertical (not horizontal)
    const isVerticalSwipe = Math.abs(diffY) > Math.abs(diffX) * 1.5;

    // Only allow pulling down with vertical swipe
    if (diffY > 0 && isVerticalSwipe) {
      e.preventDefault();

      // Apply resistance curve for smoother feel
      const resistance = 0.5;
      const distance = Math.min(diffY * resistance, maxPullDown);
      setPullDistance(distance);
    } else if (!isVerticalSwipe) {
      // If it's a horizontal swipe, stop tracking
      isPullingRef.current = false;
      setPullDistance(0);
    }
  }, [isEnabled, isRefreshing, maxPullDown]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current || !isEnabled) return;

    isPullingRef.current = false;

    // Trigger refresh if pulled past threshold
    if (pullDistance >= pullDownThreshold && !isRefreshing) {
      setIsRefreshing(true);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Snap back without refreshing
      setPullDistance(0);
    }
  }, [isEnabled, isRefreshing, pullDistance, pullDownThreshold, onRefresh]);

  useEffect(() => {
    if (!isEnabled) return;

    const options: AddEventListenerOptions = { passive: false };

    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, isEnabled]);

  return {
    pullDistance,
    isRefreshing,
    isPulling: isPullingRef.current
  };
}
