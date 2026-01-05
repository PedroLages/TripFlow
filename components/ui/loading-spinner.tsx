/**
 * Loading Spinner Component
 *
 * A simple, accessible loading indicator for async operations.
 * Used for route loading, data fetching, and form submissions.
 */

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Optional className for additional styling */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

/**
 * Loading spinner with size variants
 *
 * @example
 * ```tsx
 * // Default medium spinner
 * <LoadingSpinner />
 *
 * // Small spinner for buttons
 * <LoadingSpinner size="sm" />
 *
 * // Large spinner for full-page loading
 * <LoadingSpinner size="lg" label="Loading trips..." />
 * ```
 */
export function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading...',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  return (
    <div className="flex items-center justify-center" role="status">
      <div
        className={cn(
          'animate-spin rounded-full border-primary border-t-transparent',
          sizeClasses[size],
          className
        )}
        aria-label={label}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Full-page loading spinner
 *
 * Centers the spinner in the viewport with a semi-transparent backdrop.
 * Use for route transitions or full-page data loading.
 *
 * @example
 * ```tsx
 * {isLoading && <FullPageSpinner />}
 * ```
 */
export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}
