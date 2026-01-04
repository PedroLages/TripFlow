/**
 * Custom hook for implementing swipe-to-dismiss gesture on mobile modals
 *
 * Usage:
 * ```tsx
 * const { translateY, handleTouchStart, handleTouchMove, handleTouchEnd, isDragging } = useSwipeToDismiss({
 *   onDismiss: () => setModalOpen(false),
 *   threshold: 150
 * });
 * ```
 */

import { useState, useCallback, useRef } from 'react';

interface UseSwipeToDismissOptions {
  onDismiss: () => void;
  threshold?: number; // Distance to swipe before dismissing (default: 150px)
  enabled?: boolean; // Whether swipe is enabled (default: true)
}

export function useSwipeToDismiss({
  onDismiss,
  threshold = 150,
  enabled = true
}: UseSwipeToDismissOptions) {
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;

    // Only enable swipe from the top portion of the modal
    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    currentYRef.current = touch.clientY;
    setIsDragging(true);
  }, [enabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || !isDragging) return;

    const touch = e.touches[0];
    currentYRef.current = touch.clientY;
    const deltaY = currentYRef.current - startYRef.current;

    // Only allow downward swipes (positive deltaY)
    if (deltaY > 0) {
      setTranslateY(deltaY);
    }
  }, [enabled, isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !isDragging) return;

    const deltaY = currentYRef.current - startYRef.current;

    // If swiped down past threshold, dismiss the modal
    if (deltaY > threshold) {
      // Animate out before dismissing
      setTranslateY(window.innerHeight);
      setTimeout(() => {
        onDismiss();
        setTranslateY(0);
      }, 200);
    } else {
      // Snap back to original position
      setTranslateY(0);
    }

    setIsDragging(false);
    startYRef.current = 0;
    currentYRef.current = 0;
  }, [enabled, isDragging, threshold, onDismiss]);

  return {
    translateY,
    isDragging,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
