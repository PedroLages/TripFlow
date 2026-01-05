/**
 * TripFlow V2 - Main Application Component
 *
 * Mobile-first, simplified application entry point.
 * Uses React Router v7 with React Query for optimal performance.
 */

import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './lib/router';
import { queryClient } from './lib/react-query';

/**
 * App - Main application component
 *
 * Responsibilities:
 * - Provides React Query client for data fetching/caching
 * - Provides React Router for navigation
 * - Applies dark mode class to document root
 *
 * Note: Auth, theme, and other features will be added in future iterations.
 * This is the minimal V2 foundation.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
