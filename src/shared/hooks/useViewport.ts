import { useEffect } from 'react';

/**
 * Mobile-first viewport hook
 *
 * Fixes iOS Safari viewport height issue where the address bar causes
 * the viewport height to change. This was the root cause of the modal
 * white space bug in V1.
 *
 * Sets a CSS custom property --vh that equals 1% of the actual viewport height,
 * which can be used in place of vh units: `height: calc(var(--vh, 1vh) * 100)`
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useViewport(); // Sets up --vh CSS variable
 *
 *   return (
 *     <div style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
 *       Full height on iOS!
 *     </div>
 *   );
 * }
 * ```
 */
export function useViewport() {
  useEffect(() => {
    const setVh = () => {
      // Get actual viewport height
      const vh = window.innerHeight * 0.01;

      // Set CSS custom property
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set on mount
    setVh();

    // Update on resize and orientation change
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);

    // Cleanup
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);
}
